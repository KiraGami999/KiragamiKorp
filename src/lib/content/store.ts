import { getDefaultContent } from "@/lib/content/defaults";
import { getSql, requireSql } from "@/lib/db";
import { isMediaId, pruneOrphanMedia } from "@/lib/media";
import type { EditableSite, SiteContent, SiteContentRecord } from "@/types/content";
import type { Project, ProjectCategory, ProjectImage, Stat } from "@/types";

const CATEGORIES: readonly ProjectCategory[] = ["Mobile", "Web", "AI & Automation"];
const MAX_IMAGES_PER_PROJECT = 12;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asUrl(value: unknown): string | undefined {
  const text = asString(value).trim();
  if (!text) return undefined;
  return /^https?:\/\//i.test(text) ? text : `https://${text}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeSite(raw: unknown): EditableSite {
  const defaults = getDefaultContent().site;
  if (!raw || typeof raw !== "object") return defaults;
  const data = raw as Record<string, unknown>;
  const disciplinesRaw = Array.isArray(data.disciplines) ? data.disciplines : defaults.disciplines;
  const lines = (value: unknown, fallback: string[]) =>
    asStringArray(value).length ? asStringArray(value) : fallback;

  return {
    name: asString(data.name, defaults.name),
    founder: asString(data.founder, defaults.founder),
    role: asString(data.role, defaults.role),
    heroHeadline: lines(data.heroHeadline, defaults.heroHeadline),
    heroSubhead: asString(data.heroSubhead, defaults.heroSubhead),
    aboutEyebrow: asString(data.aboutEyebrow, defaults.aboutEyebrow),
    aboutHeading: lines(data.aboutHeading, defaults.aboutHeading),
    aboutBody: asString(data.aboutBody, defaults.aboutBody),
    aboutPhilosophy: asString(data.aboutPhilosophy, defaults.aboutPhilosophy),
    contactEyebrow: asString(data.contactEyebrow, defaults.contactEyebrow),
    contactHeading: lines(data.contactHeading, defaults.contactHeading),
    contactBody: asString(data.contactBody, defaults.contactBody),
    email: asString(data.email, defaults.email),
    disciplines: disciplinesRaw
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const label = asString(row.label);
        if (!label) return null;
        return { id: asString(row.id, `discipline-${index + 1}`), label };
      })
      .filter((item): item is { id: string; label: string } => item !== null),
  };
}

function normalizeImages(raw: unknown): ProjectImage[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const images: ProjectImage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = asString(row.id);
    if (!isMediaId(id) || seen.has(id)) continue;
    seen.add(id);
    images.push({
      id,
      alt: asString(row.alt).slice(0, 200),
      ...(typeof row.width === "number" ? { width: row.width } : {}),
      ...(typeof row.height === "number" ? { height: row.height } : {}),
    });
    if (images.length >= MAX_IMAGES_PER_PROJECT) break;
  }
  return images;
}

function normalizeProjects(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return getDefaultContent().projects;

  const usedIds = new Set<string>();
  const projects: Project[] = [];

  raw.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const title = asString(row.title).trim();
    if (!title) return;

    // Ids double as public URLs (/work/<id>), so keep them slug-safe and unique.
    let id = slugify(asString(row.id)) || slugify(title) || `project-${projects.length + 1}`;
    while (usedIds.has(id)) id = `${id}-${projects.length + 1}`;
    usedIds.add(id);

    const href = asUrl(row.href);
    const repoUrl = asUrl(row.repoUrl ?? row.repo_url);
    const role = asString(row.role).trim();

    projects.push({
      id,
      index: String(projects.length + 1).padStart(2, "0"),
      title: title.slice(0, 80),
      category: CATEGORIES.find((entry) => entry === row.category) ?? "Web",
      year: asString(row.year, String(new Date().getFullYear())).slice(0, 12),
      summary: asString(row.summary).slice(0, 400),
      tags: asStringArray(row.tags)
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 16),
      description: asString(row.description).slice(0, 12_000),
      images: normalizeImages(row.images),
      published: row.published !== false,
      ...(href ? { href } : {}),
      ...(repoUrl ? { repoUrl } : {}),
      ...(role ? { role: role.slice(0, 80) } : {}),
    });
  });

  return projects;
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
      return { id: asString(row.id, `stat-${index + 1}`), value, label } satisfies Stat;
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

async function readTables(includeDrafts: boolean): Promise<SiteContentRecord | null> {
  const sql = getSql();
  if (!sql) return null;

  const [settingsRows, projectRows, statRows] = await Promise.all([
    sql`SELECT data, updated_at FROM site_settings WHERE id = 'default' LIMIT 1`,
    sql`
      SELECT id, title, category, year, summary, tags, href, description, role, repo_url, images, published
      FROM projects
      WHERE published = true OR ${includeDrafts}
      ORDER BY sort_order ASC, created_at ASC
    `,
    sql`SELECT id, value, label FROM site_stats ORDER BY sort_order ASC`,
  ]);

  const settings = settingsRows[0] as { data: unknown; updated_at: string } | undefined;
  if (!settings && projectRows.length === 0 && statRows.length === 0) return null;

  // Normalization renumbers indexes, so public numbering follows visible order.
  const projects = normalizeProjects(projectRows);

  return {
    site: normalizeSite(settings?.data),
    projects,
    stats: normalizeStats(statRows),
    updatedAt: settings?.updated_at ? new Date(settings.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function getSiteContent(options: { includeDrafts?: boolean } = {}): Promise<SiteContentRecord> {
  const defaults = getDefaultContent();
  try {
    const record = await readTables(options.includeDrafts ?? false);
    if (record) return record;
    if (!getSql()) return { ...defaults, updatedAt: new Date(0).toISOString() };
    return await saveSiteContent(defaults);
  } catch (error) {
    console.error("[content] failed to load site content:", error);
    return { ...defaults, updatedAt: new Date(0).toISOString() };
  }
}

export async function getProjectById(id: string): Promise<{ project: Project; next: Project | null } | null> {
  const { projects } = await getSiteContent();
  const position = projects.findIndex((project) => project.id === id);
  if (position === -1) return null;
  const next = projects.length > 1 ? projects[(position + 1) % projects.length] : null;
  return { project: projects[position], next };
}

export async function saveSiteContent(content: SiteContent): Promise<SiteContentRecord> {
  const sql = requireSql();
  const normalized = normalizeContent(content);
  const ids = normalized.projects.map((project) => project.id);

  await sql`
    INSERT INTO site_settings (id, data, updated_at)
    VALUES ('default', ${JSON.stringify(normalized.site)}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;

  await sql`DELETE FROM projects WHERE NOT (id = ANY(${ids}))`;
  for (let i = 0; i < normalized.projects.length; i += 1) {
    const p = normalized.projects[i];
    await sql`
      INSERT INTO projects (
        id, index_label, title, category, year, summary, tags, href,
        description, role, repo_url, images, published, sort_order, updated_at
      )
      VALUES (
        ${p.id}, ${p.index}, ${p.title}, ${p.category}, ${p.year}, ${p.summary},
        ${JSON.stringify(p.tags)}::jsonb, ${p.href ?? null},
        ${p.description ?? ""}, ${p.role ?? null}, ${p.repoUrl ?? null},
        ${JSON.stringify(p.images ?? [])}::jsonb, ${p.published !== false}, ${i}, now()
      )
      ON CONFLICT (id) DO UPDATE SET
        index_label = EXCLUDED.index_label,
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        year = EXCLUDED.year,
        summary = EXCLUDED.summary,
        tags = EXCLUDED.tags,
        href = EXCLUDED.href,
        description = EXCLUDED.description,
        role = EXCLUDED.role,
        repo_url = EXCLUDED.repo_url,
        images = EXCLUDED.images,
        published = EXCLUDED.published,
        sort_order = EXCLUDED.sort_order,
        updated_at = now()
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
      site = EXCLUDED.site, projects = EXCLUDED.projects, stats = EXCLUDED.stats, updated_at = now()
    RETURNING updated_at
  `;

  const referenced = normalized.projects.flatMap((project) => (project.images ?? []).map((image) => image.id));
  try {
    await pruneOrphanMedia(referenced);
  } catch (error) {
    console.error("[content] media prune failed:", error);
  }

  const updatedAt = rows[0]
    ? new Date((rows[0] as { updated_at: string }).updated_at).toISOString()
    : new Date().toISOString();

  return { ...normalized, updatedAt };
}
