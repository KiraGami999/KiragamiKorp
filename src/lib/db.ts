import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Sql = NeonQueryFunction<false, false>;

export function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL ?? null;
}

export function getSql(): Sql | null {
  const url = getDatabaseUrl();
  if (!url) return null;
  return neon(url);
}

export function requireSql(): Sql {
  const sql = getSql();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }
  return sql;
}
