import { getSql, requireSql } from "@/lib/db";
import {
  DEFAULT_STUDIO_SETTINGS,
  normalizeStudioSettings,
  type StudioSettings,
} from "@/lib/studio-settings-shared";

export type { StudioSettings } from "@/lib/studio-settings-shared";

const CACHE_MS = 30_000;
let cache: { value: StudioSettings; at: number } | null = null;

export async function getStudioSettings(): Promise<StudioSettings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  const sql = getSql();
  if (!sql) return DEFAULT_STUDIO_SETTINGS;

  try {
    const rows = await sql`SELECT value FROM app_settings WHERE key = 'studio' LIMIT 1`;
    const value = normalizeStudioSettings((rows[0] as { value?: unknown } | undefined)?.value);
    cache = { value, at: Date.now() };
    return value;
  } catch (error) {
    console.error("[studio-settings] load failed:", error);
    return DEFAULT_STUDIO_SETTINGS;
  }
}

export async function saveStudioSettings(input: unknown): Promise<StudioSettings> {
  const value = normalizeStudioSettings(input);
  await requireSql()`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES ('studio', ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
  cache = { value, at: Date.now() };
  return value;
}
