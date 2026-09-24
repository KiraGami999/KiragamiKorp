import { neon } from "@neondatabase/serverless";
import { getDefaultContent } from "@/lib/content/defaults";
import type { EditableSite, SiteContent, SiteContentRecord } from "@/types/content";
import type { Project, ProjectCategory, Stat } from "@/types";

const CATEGORIES: readonly ProjectCategory[] = ["Mobile", "Web", "AI & Automation"];

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

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

      return {
        id: asString(row.id, `project-${index + 1}`),
        index: asString(row.index, String(index + 1).padStart(2, "0")),
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

export async function getSiteContent(): Promise<SiteContentRecord> {
  const defaults = getDefaultContent();
  const sql = getSql();

  if (!sql) {
    return { ...defaults, updatedAt: new Date(0).toISOString() };
  }

  try {
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
      await sql`
        INSERT INTO site_content (id, site, projects, stats)
        VALUES (
          'default',
          ${JSON.stringify(defaults.site)}::jsonb,
          ${JSON.stringify(defaults.projects)}::jsonb,
          ${JSON.stringify(defaults.stats)}::jsonb
        )
        ON CONFLICT (id) DO NOTHING
      `;
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
  const sql = getSql();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const normalized = normalizeContent(content);
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
