import { getSql, requireSql } from "@/lib/db";

export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;
export const ALLOWED_MEDIA_TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif", "image/gif"] as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isMediaId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function mediaUrl(id: string): string {
  return `/api/media/${id}`;
}

export function isAllowedMediaType(type: string): type is (typeof ALLOWED_MEDIA_TYPES)[number] {
  return (ALLOWED_MEDIA_TYPES as readonly string[]).includes(type);
}

export async function saveMedia(params: {
  bytes: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
  originalName?: string;
}): Promise<{ id: string; sizeBytes: number }> {
  const sql = requireSql();
  const rows = await sql`
    INSERT INTO media_assets (mime_type, bytes, size_bytes, width, height, original_name)
    VALUES (
      ${params.mimeType},
      decode(${params.bytes.toString("base64")}, 'base64'),
      ${params.bytes.length},
      ${params.width ?? null},
      ${params.height ?? null},
      ${params.originalName?.slice(0, 200) ?? null}
    )
    RETURNING id
  `;
  return { id: (rows[0] as { id: string }).id, sizeBytes: params.bytes.length };
}

export async function readMedia(id: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const sql = getSql();
  if (!sql || !isMediaId(id)) return null;

  const rows = await sql`
    SELECT mime_type, encode(bytes, 'base64') AS data
    FROM media_assets
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0] as { mime_type: string; data: string } | undefined;
  if (!row) return null;
  return { bytes: Buffer.from(row.data, "base64"), mimeType: row.mime_type };
}

export async function deleteMedia(id: string): Promise<void> {
  const sql = getSql();
  if (!sql || !isMediaId(id)) return;
  await sql`DELETE FROM media_assets WHERE id = ${id}`;
}

/**
 * Removes uploads no project references. The one-day grace period keeps
 * images that were uploaded into an editor session but not saved yet.
 */
export async function pruneOrphanMedia(referencedIds: string[]): Promise<number> {
  const sql = getSql();
  if (!sql) return 0;

  const rows = await sql`
    DELETE FROM media_assets
    WHERE created_at < now() - interval '1 day'
      AND NOT (id::text = ANY(${referencedIds}))
    RETURNING id
  `;
  return rows.length;
}

export async function getMediaUsage(): Promise<{ count: number; bytes: number }> {
  const sql = getSql();
  if (!sql) return { count: 0, bytes: 0 };
  const rows = await sql`SELECT count(*)::int AS count, coalesce(sum(size_bytes), 0)::bigint AS bytes FROM media_assets`;
  const row = rows[0] as { count: number; bytes: string | number };
  return { count: row.count, bytes: Number(row.bytes) };
}
