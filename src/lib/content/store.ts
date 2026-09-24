import { getDefaultContent } from "@/lib/content/defaults";
import { getSql, requireSql } from "@/lib/db";
import type { EditableSite, SiteContent, SiteContentRecord } from "@/types/content";
import type { Project, ProjectCategory, Stat } from "@/types";

const CATEGORIES: readonly ProjectCategory[] = ["Mobile", "Web", "AI & Automation"];

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeSite(raw: unknown): EditableSite {
  const defaults = getDefaultContent().site;
  if (!raw || typeof raw !== "object") return defaults;
  const data = raw as Record<string, unknown>;
  const disciplinesRaw = Array.isArray(data.disciplines) ? data.disciplines : defaults.disciplines;

  return {
    name: asString(data.name, defaults.name),
    founder: asString(data.founder, defaults.founder),
    role: asString(data.role, defaults.role),
    heroHeadline: asStringArray(data.heroHeadline).length
      ? asStringArray(data.heroHeadline)
      : defaults.heroHeadline,
    heroSubhead: asString(data.heroSubhead, defaults.heroSubhead),
    aboutEyebrow: asString(data.aboutEyebrow, defaults.aboutEyebrow),
    aboutHeading: asStringArray(data.aboutHeading).length
      ? asStringArray(data.aboutHeading)
      : defaults.aboutHeading,
    aboutBody: asString(data.aboutBody, defaults.aboutBody),
    aboutPhilosophy: asString(data.aboutPhilosophy, defaults.aboutPhilosophy),
    contactEyebrow: asString(data.contactEyebrow, defaults.contactEyebrow),
    contactHeading: asStringArray(data.contactHeading).length
      ? asStringArray(data.contactHeading)
      : defaults.contactHeading,
    contactBody: asString(data.contactBody, defaults.contactBody),
    email: asString(data.email, defaults.email),
    disciplines: disciplinesRaw
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const label = asString(row.label);
        if (!label) return null;
        return {
          id: asString(row.id, `discipline-${index + 1}`),
          label,
        };
      })
      .filter((item): item is { id: string; label: string } => item !== null),
  };
}

function normalizeProjects(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return getDefaultContent().projects;

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const title = asString(row.title);
      if (!title) return null;

      const category = CATEGORIES.find((entry) => entry === row.category) ?? "Web";
      const href = asString(row.href);
      const indexLabel = asString(row.index ?? row.index_label, String(index + 1).padStart(2, "0"));

      return {
        id: asString(row.id, `project-${index + 1}`),
        index: indexLabel,
        title,
        category,
        year: asString(row.year, String(new Date().getFullYear())),
        summary: asString(row.summary),
        tags: asStringArray(row.tags),
        ...(href ? { href } : {}),
      } satisfies Project;
    })
    .filter((item): item is Project => item !== null);
}

function normalizeStats(raw: unknown): Stat[] {
  if (!Array.isArray(raw)) return getDefaultContent().stats;

  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const value = asString(row.value);
      const label = asString(row.label);
      if (!value || !label) return null;
      return {
        id: asString(row.id, `stat-${index + 1}`),
        value,
        label,
      } satisfies Stat;
    })
    .filter((item): item is Stat => item !== null);
}

export function normalizeContent(raw: SiteContent): SiteContent {
  return {
    site: normalizeSite(raw.site),
    projects: normalizeProjects(raw.projects),
    stats: normalizeStats(raw.stats),
  };
}

async function readNormalizedTables(): Promise<SiteContentRecord | null> {
  const sql = getSql();
  if (!sql) return null;

  const [settingsRows, projectRows, statRows] = await Promise.all([
    sql`SELECT data, updated_at FROM site_settings WHERE id = 'default' LIMIT 1`,
    sql`
      SELECT id, index_label, title, category, year, summary, tags, href
      FROM projects
      WHERE published = true
      ORDER BY sort_order ASC, created_at ASC
    `,
    sql`SELECT id, value, label FROM site_stats ORDER BY sort_order ASC`,
  ]);

  const settings = settingsRows[0] as { data: unknown; updated_at: string } | undefined;
  if (!settings && projectRows.length === 0 && statRows.length === 0) {
    return null;
  }

  const projects = normalizeProjects(
    projectRows.map((row) => {
      const item = row as {
        id: string;
        index_label: string;
        title: string;
        category: string;
        year: string;
        summary: string;
        tags: unknown;
        href: string | null;
      };
      return {
        id: item.id,
        index: item.index_label,
        title: item.title,
        category: item.category,
        year: item.year,
        summary: item.summary,
        tags: item.tags,
        href: item.href ?? undefined,
      };
    }),
  );

  return {
    site: normalizeSite(settings?.data),
    projects,
    stats: normalizeStats(statRows),
    updatedAt: settings?.updated_at
      ? new Date(settings.updated_at).toISOString()
      : new Date().toISOString(),
  };
}

export async function getSiteContent(): Promise<SiteContentRecord> {
  const defaults = getDefaultContent();

  try {
    const normalized = await readNormalizedTables();
    if (normalized) return normalized;

    // Fallback to legacy blob table if normalized tables are empty.
    const sql = getSql();
    if (!sql) return { ...defaults, updatedAt: new Date(0).toISOString() };

    const rows = await sql`
      SELECT site, projects, stats, updated_at
      FROM site_content
      WHERE id = 'default'
      LIMIT 1
    `;
    const row = rows[0] as
      | { site: unknown; projects: unknown; stats: unknown; updated_at: string }
      | undefined;

    if (!row) {
      await saveSiteContent(defaults);
      return { ...defaults, updatedAt: new Date().toISOString() };
    }

    return {
      site: normalizeSite(row.site),
      projects: normalizeProjects(row.projects),
      stats: normalizeStats(row.stats),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  } catch (error) {
    console.error("[content] failed to load site content:", error);
    return { ...defaults, updatedAt: new Date(0).toISOString() };
  }
}

export async function saveSiteContent(content: SiteContent): Promise<SiteContentRecord> {
  const sql = requireSql();
  const normalized = normalizeContent(content);

  await sql`
    INSERT INTO site_settings (id, data, updated_at)
    VALUES ('default', ${JSON.stringify(normalized.site)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = now()
  `;

  await sql`DELETE FROM projects`;
  for (let i = 0; i < normalized.projects.length; i += 1) {
    const project = normalized.projects[i];
    await sql`
      INSERT INTO projects (
        id, index_label, title, category, year, summary, tags, href, sort_order, published, updated_at
      )
      VALUES (
        ${project.id},
        ${project.index},
        ${project.title},
        ${project.category},
        ${project.year},
        ${project.summary},
        ${JSON.stringify(project.tags)}::jsonb,
        ${project.href ?? null},
        ${i},
        true,
        now()
      )
    `;
  }

  await sql`DELETE FROM site_stats`;
  for (let i = 0; i < normalized.stats.length; i += 1) {
    const stat = normalized.stats[i];
    await sql`
      INSERT INTO site_stats (id, value, label, sort_order)
      VALUES (${stat.id}, ${stat.value}, ${stat.label}, ${i})
    `;
  }

  // Keep legacy blob in sync for rollback / tooling.
  const rows = await sql`
    INSERT INTO site_content (id, site, projects, stats, updated_at)
    VALUES (
      'default',
      ${JSON.stringify(normalized.site)}::jsonb,
      ${JSON.stringify(normalized.projects)}::jsonb,
      ${JSON.stringify(normalized.stats)}::jsonb,
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      site = EXCLUDED.site,
      projects = EXCLUDED.projects,
      stats = EXCLUDED.stats,
      updated_at = now()
    RETURNING updated_at
  `;

  const updatedAt = rows[0]
    ? new Date((rows[0] as { updated_at: string }).updated_at).toISOString()
    : new Date().toISOString();

  return { ...normalized, updatedAt };
}
