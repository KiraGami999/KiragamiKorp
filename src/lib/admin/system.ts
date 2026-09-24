import { listAudit, type AuditEntry } from "@/lib/admin/audit";
import { getGenerationStats } from "@/lib/automation/generations";
import { getLlmConfig } from "@/lib/automation/llm";
import { getSql } from "@/lib/db";
import { getMediaUsage } from "@/lib/media";
import { getStudioSettings } from "@/lib/studio-settings";

export type CheckLevel = "ok" | "warn" | "error";

export interface SystemCheck {
  id: string;
  label: string;
  level: CheckLevel;
  detail: string;
}

export interface SystemReport {
  checks: SystemCheck[];
  database: { ok: boolean; latencyMs: number | null; sizeBytes: number | null; name: string | null };
  media: { count: number; bytes: number };
  generations: { total: number; live: number; last7Days: number };
  llm: { configured: boolean; model: string | null; host: string | null; liveEnabled: boolean };
  audit: AuditEntry[];
  runtime: { node: string; environment: string };
  generatedAt: string;
}

/** Neon free tier storage cap per branch. */
const STORAGE_LIMIT_BYTES = 512 * 1024 * 1024;

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function buildSystemReport(): Promise<SystemReport> {
  const checks: SystemCheck[] = [];
  const sql = getSql();

  let database: SystemReport["database"] = { ok: false, latencyMs: null, sizeBytes: null, name: null };
  if (!sql) {
    checks.push({ id: "db", label: "Database", level: "error", detail: "DATABASE_URL is not set." });
  } else {
    const started = Date.now();
    try {
      const rows = await sql`SELECT current_database() AS name, pg_database_size(current_database())::bigint AS size`;
      const row = rows[0] as { name: string; size: string | number };
      database = { ok: true, latencyMs: Date.now() - started, sizeBytes: Number(row.size), name: row.name };
      checks.push({
        id: "db",
        label: "Database",
        level: row.name === "kiragamikorp" ? "ok" : "warn",
        detail:
          row.name === "kiragamikorp"
            ? `Connected to ${row.name} in ${database.latencyMs} ms.`
            : `Connected to "${row.name}" — expected "kiragamikorp". Check DATABASE_URL.`,
      });
      const usage = Number(row.size) / STORAGE_LIMIT_BYTES;
      checks.push({
        id: "storage",
        label: "Storage",
        level: usage > 0.85 ? "error" : usage > 0.6 ? "warn" : "ok",
        detail: `${formatMb(Number(row.size))} of ${formatMb(STORAGE_LIMIT_BYTES)} used (${Math.round(usage * 100)}%).`,
      });
    } catch (error) {
      checks.push({
        id: "db",
        label: "Database",
        level: "error",
        detail: error instanceof Error ? error.message : "Connection failed.",
      });
    }
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  checks.push({
    id: "secret",
    label: "Session secret",
    level: !secret ? "error" : secret.length < 32 ? "warn" : "ok",
    detail: !secret
      ? "ADMIN_SESSION_SECRET is missing — cookies fall back to a weaker secret."
      : secret.length < 32
        ? "ADMIN_SESSION_SECRET is short; use 32+ random characters."
        : "Configured.",
  });

  const [settings, media, generations, audit] = await Promise.all([
    getStudioSettings(),
    database.ok ? getMediaUsage() : Promise.resolve({ count: 0, bytes: 0 }),
    database.ok ? getGenerationStats() : Promise.resolve({ total: 0, live: 0, last7Days: 0 }),
    database.ok ? listAudit(25) : Promise.resolve([] as AuditEntry[]),
  ]);

  const llmConfig = getLlmConfig(settings.model);
  checks.push({
    id: "llm",
    label: "AI provider",
    level: !llmConfig ? "warn" : settings.liveEnabled ? "ok" : "warn",
    detail: !llmConfig
      ? "GROQ_API_KEY is not set — Studio serves templates only."
      : settings.liveEnabled
        ? `Live generation on (${llmConfig.model}).`
        : "Key configured, but live generation is paused in Studio settings.",
  });

  const recentFailures = audit.filter(
    (entry) => entry.action === "login_failed" && Date.now() - Date.parse(entry.createdAt) < 24 * 3600 * 1000,
  ).length;
  checks.push({
    id: "logins",
    label: "Failed logins (24h)",
    level: recentFailures >= 5 ? "error" : recentFailures > 0 ? "warn" : "ok",
    detail: recentFailures ? `${recentFailures} failed attempt(s) in the last day.` : "None.",
  });

  return {
    checks,
    database,
    media,
    generations,
    llm: {
      configured: Boolean(llmConfig),
      model: llmConfig?.model ?? null,
      host: llmConfig ? new URL(llmConfig.baseUrl).host : null,
      liveEnabled: settings.liveEnabled,
    },
    audit,
    runtime: { node: process.version, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown" },
    generatedAt: new Date().toISOString(),
  };
}
