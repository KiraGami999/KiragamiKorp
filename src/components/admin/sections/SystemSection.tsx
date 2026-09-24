"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { Button, Notice, Panel, Stat, StatusDot, Time, adminFetch, formatBytes } from "@/components/admin/ui";
import type { SystemReport } from "@/lib/admin/system";
import type { AuditEntry } from "@/lib/admin/audit";

const ACTION_LABELS: Record<AuditEntry["action"], string> = {
  login: "Signed in",
  login_failed: "Failed sign-in",
  logout: "Signed out",
  content_saved: "Content saved",
  media_uploaded: "Image uploaded",
  media_deleted: "Image deleted",
  password_changed: "Password changed",
  username_changed: "Username changed",
  gate_changed: "Clearance phrase changed",
  sessions_revoked: "Other sessions revoked",
  studio_settings_saved: "Studio settings saved",
  generations_cleared: "Generation log cleared",
};

function describeDetail(entry: AuditEntry): string {
  const d = entry.detail ?? {};
  switch (entry.action) {
    case "content_saved":
      return `${d.projects ?? "?"} projects${d.drafts ? `, ${d.drafts} draft` : ""}`;
    case "login_failed":
      return typeof d.stage === "string" ? `at ${d.stage}` : typeof d.username === "string" ? `as "${d.username}"` : "";
    case "username_changed":
      return `${d.from} → ${d.to}`;
    case "sessions_revoked":
    case "generations_cleared":
      return `${d.count ?? 0} removed`;
    case "password_changed":
      return d.otherSessionsRevoked ? `${d.otherSessionsRevoked} session(s) signed out` : "";
    case "studio_settings_saved":
      return `live ${d.liveEnabled ? "on" : "off"} · ${d.model}`;
    default:
      return "";
  }
}

export function SystemSection() {
  const [report, setReport] = useState<SystemReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { report } = await adminFetch<{ report: SystemReport }>("/api/admin/system");
      setReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't build the report.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  async function testProvider() {
    setTesting(true);
    setTest(null);
    try {
      const { result } = await adminFetch<{ result: { ok: boolean; message: string } }>("/api/admin/system", {
        method: "POST",
      });
      setTest(result);
    } catch (err) {
      setTest({ ok: false, message: err instanceof Error ? err.message : "Test failed." });
    } finally {
      setTesting(false);
    }
  }

  const worst = report?.checks.some((check) => check.level === "error")
    ? "error"
    : report?.checks.some((check) => check.level === "warn")
      ? "warn"
      : "ok";

  return (
    <div className="space-y-6">
      <Panel
        title="Health"
        description={
          report ? (
            <>
              {worst === "ok" ? "All systems nominal." : worst === "warn" ? "Running, with warnings." : "Something needs attention."}{" "}
              Checked <Time iso={report.generatedAt} relative />.
            </>
          ) : (
            "Live checks against the database, storage and AI provider."
          )
        }
        actions={
          <Button onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden /> Re-run checks
          </Button>
        }
      >
        {error ? <Notice tone="error">{error}</Notice> : null}
        {!report && !error ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" /> : null}
        {report ? (
          <ul className="grid gap-3 md:grid-cols-2">
            {report.checks.map((check) => (
              <li key={`${check.id}-${check.label}`} className="flex gap-3 border-2 border-ink p-4">
                <span className="mt-1">
                  <StatusDot level={check.level} />
                </span>
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink">{check.label}</p>
                  <p className="mt-1 text-sm text-ink/65">{check.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Panel>

      {report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="DB latency"
              value={report.database.latencyMs !== null ? `${report.database.latencyMs}ms` : "—"}
              hint={report.database.name ?? "not connected"}
            />
            <Stat
              label="DB size"
              value={report.database.sizeBytes !== null ? formatBytes(report.database.sizeBytes) : "—"}
              hint="Neon free tier: 512 MB"
            />
            <Stat label="Images" value={report.media.count} hint={`${formatBytes(report.media.bytes)} stored`} />
            <Stat
              label="Generations"
              value={report.generations.total}
              hint={`${report.generations.last7Days} this week · ${report.generations.live} live`}
            />
          </div>

          <Panel
            title="AI provider"
            description={
              report.llm.configured
                ? `${report.llm.host} · ${report.llm.model} · live ${report.llm.liveEnabled ? "enabled" : "paused"}`
                : "No API key set. Add GROQ_API_KEY (or LLM_API_KEY) to the environment."
            }
            actions={
              <Button variant="primary" onClick={() => void testProvider()} disabled={testing || !report.llm.configured}>
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Zap className="h-3.5 w-3.5" aria-hidden />}
                Test connection
              </Button>
            }
          >
            {test ? (
              <Notice tone={test.ok ? "success" : "error"}>{test.message}</Notice>
            ) : (
              <p className="text-sm text-ink/55">
                Lists the provider&apos;s models to confirm the key works — no generation tokens are spent.
              </p>
            )}
          </Panel>

          <Panel title="Audit log" description="Security-relevant activity on the deck, newest first.">
            {report.audit.length ? (
              <ul className="divide-y-2 divide-ink/10 border-2 border-ink">
                {report.audit.map((entry) => (
                  <li key={entry.id} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)_8rem] sm:items-center sm:gap-4">
                    <span className="font-mono text-[11px] text-ink/55">
                      <Time iso={entry.createdAt} />
                    </span>
                    <span className="text-sm text-ink">
                      <span className={entry.action === "login_failed" ? "font-semibold text-[#b3261e]" : "font-semibold"}>
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                      {describeDetail(entry) ? <span className="text-ink/55"> — {describeDetail(entry)}</span> : null}
                    </span>
                    <span className="truncate font-mono text-[11px] text-ink/45 sm:text-right">{entry.ipAddress ?? ""}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink/55">No activity recorded yet.</p>
            )}
          </Panel>

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/40">
            Runtime {report.runtime.node} · {report.runtime.environment}
          </p>
        </>
      ) : null}
    </div>
  );
}
