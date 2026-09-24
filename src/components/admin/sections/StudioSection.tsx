"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, RefreshCw, Trash2, X } from "lucide-react";
import { Button, Field, Notice, Panel, SelectField, Stat, Time, Toggle, adminFetch } from "@/components/admin/ui";
import {
  DEFAULT_STUDIO_SETTINGS,
  STUDIO_MODEL_OPTIONS,
  type StudioSettings,
} from "@/lib/studio-settings-shared";
import type { GenerationSummary } from "@/lib/automation/generations";
import type { AutomationWorkflow } from "@/types";

type Status = { tone: "success" | "error"; text: string } | null;

export function StudioSection() {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [saved, setSaved] = useState<StudioSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    adminFetch<{ settings: StudioSettings }>("/api/admin/studio")
      .then(({ settings }) => {
        setSettings(settings);
        setSaved(settings);
      })
      .catch((error: Error) => setStatus({ tone: "error", text: error.message }));
  }, []);

  const dirty = settings && saved && JSON.stringify(settings) !== JSON.stringify(saved);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setStatus(null);
    try {
      const result = await adminFetch<{ settings: StudioSettings }>("/api/admin/studio", {
        method: "PUT",
        body: JSON.stringify({ settings }),
      });
      setSettings(result.settings);
      setSaved(result.settings);
      setStatus({ tone: "success", text: "Studio settings saved. They apply within 30 seconds." });
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  function patch(update: Partial<StudioSettings>) {
    setSettings((prev) => (prev ? { ...prev, ...update } : prev));
  }

  const modelOptions: { value: string; label: string }[] = STUDIO_MODEL_OPTIONS.map((option) => ({ ...option }));
  if (settings?.model && !modelOptions.some((option) => option.value === settings.model)) {
    modelOptions.push({ value: settings.model, label: `${settings.model} (custom)` });
  }

  return (
    <div className="space-y-6">
      <Panel
        title="Generator controls"
        description="How the public /studio automation generator behaves."
        actions={
          <>
            <Button
              disabled={!settings || JSON.stringify(settings) === JSON.stringify(DEFAULT_STUDIO_SETTINGS)}
              onClick={() => setSettings(DEFAULT_STUDIO_SETTINGS)}
            >
              Reset to defaults
            </Button>
            <Button variant="primary" disabled={!dirty || saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save studio"}
            </Button>
          </>
        }
      >
        {settings ? (
          <div className="space-y-6">
            <Toggle
              label="Live AI generation"
              description="Off = every visitor gets the instant template engine. Use this to pause spend or during an outage."
              checked={settings.liveEnabled}
              onChange={(liveEnabled) => patch({ liveEnabled })}
            />
            <Toggle
              label="Save generations"
              description="Keep a log of prompts and generated workflows below, so you can see what visitors ask for."
              checked={settings.saveGenerations}
              onChange={(saveGenerations) => patch({ saveGenerations })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Model"
                value={settings.model}
                options={modelOptions}
                onChange={(model) => patch({ model })}
              />
              <label className="block">
                <span className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">
                  <span>Rate limit per visitor</span>
                  <span className="text-ink">{settings.rateLimitPerMinute}/min</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={settings.rateLimitPerMinute}
                  onChange={(event) => patch({ rateLimitPerMinute: Number(event.target.value) })}
                  className="w-full accent-ink"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">
                <span>Creativity (temperature)</span>
                <span className="text-ink">{settings.temperature.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={0}
                max={1.2}
                step={0.05}
                value={settings.temperature}
                onChange={(event) => patch({ temperature: Number(event.target.value) })}
                className="w-full accent-ink"
              />
              <span className="mt-1 flex justify-between text-xs text-ink/45">
                <span>Precise, repeatable</span>
                <span>Inventive, riskier</span>
              </span>
            </label>
            <Field
              label="House rules for the architect"
              value={settings.extraInstructions}
              multiline
              rows={4}
              maxLength={2000}
              placeholder="e.g. Prefer n8n and Python. Always include a human review step before sending emails."
              hint="Appended to the system prompt for every live generation."
              onChange={(extraInstructions) => patch({ extraInstructions })}
            />
          </div>
        ) : !status ? (
          <Loader2 className="h-5 w-5 animate-spin text-ink" aria-label="Loading" />
        ) : null}
        {status ? <div className="mt-5"><Notice tone={status.tone}>{status.text}</Notice></div> : null}
      </Panel>

      <GenerationLog />
    </div>
  );
}

function GenerationLog() {
  const [generations, setGenerations] = useState<GenerationSummary[] | null>(null);
  const [stats, setStats] = useState<{ total: number; live: number; last7Days: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<AutomationWorkflow | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await adminFetch<{
        generations: GenerationSummary[];
        stats: { total: number; live: number; last7Days: number };
      }>("/api/admin/studio/generations");
      setGenerations(data.generations);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the log.");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  async function remove(id: string) {
    await adminFetch(`/api/admin/studio/generations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setGenerations((prev) => prev?.filter((item) => item.id !== id) ?? null);
    setStats((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev));
  }

  async function clearAll() {
    if (!window.confirm("Delete every saved generation? This can't be undone.")) return;
    await adminFetch("/api/admin/studio/generations", { method: "DELETE" });
    void load();
  }

  async function view(id: string) {
    try {
      const { workflow } = await adminFetch<{ workflow: AutomationWorkflow }>(
        `/api/admin/studio/generations?id=${encodeURIComponent(id)}`,
      );
      setViewing(workflow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open that generation.");
    }
  }

  return (
    <Panel
      title="Generation log"
      description="The latest 50 workflows generated on /studio."
      actions={
        <>
          <Button onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
          </Button>
          <Button variant="danger" disabled={!generations?.length} onClick={() => void clearAll()}>
            Clear log
          </Button>
        </>
      }
    >
      {stats ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="All time" value={stats.total} />
          <Stat label="Live AI" value={stats.live} hint={`${stats.total - stats.live} from templates`} />
          <Stat label="Last 7 days" value={stats.last7Days} />
        </div>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      {generations === null && !error ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" /> : null}
      {generations?.length === 0 ? <p className="text-sm text-ink/55">No generations saved yet.</p> : null}
      {generations?.length ? (
        <ul className="divide-y-2 divide-ink/10 border-2 border-ink">
          {generations.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg uppercase leading-tight text-ink">
                  {item.title ?? "Untitled workflow"}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-ink/60">&ldquo;{item.prompt}&rdquo;</p>
                <p className="mt-1.5 flex flex-wrap gap-x-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  <span className={item.mode === "live" ? "bg-ink px-1 text-acid" : ""}>{item.mode}</span>
                  {item.model ? <span>{item.model}</span> : null}
                  <Time iso={item.createdAt} relative />
                </p>
              </div>
              <div className="flex gap-2">
                <Button aria-label="View workflow" onClick={() => void view(item.id)}>
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button variant="danger" aria-label="Delete workflow" onClick={() => void remove(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {viewing ? <WorkflowViewer workflow={viewing} onClose={() => setViewing(null)} /> : null}
    </Panel>
  );
}

function WorkflowViewer({ workflow, onClose }: { workflow: AutomationWorkflow; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={workflow.title}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/70 p-4 sm:p-10"
      onClick={onClose}
    >
      <div className="w-full max-w-3xl border-2 border-ink bg-paper" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b-2 border-ink p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">
              {workflow.category} · {workflow.mode} · {workflow.estimatedTimeSaved}
            </p>
            <h3 className="mt-1 font-display text-3xl uppercase leading-none text-ink">{workflow.title}</h3>
          </div>
          <Button variant="ghost" aria-label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="space-y-6 p-5">
          <p className="text-sm text-ink/70">{workflow.summary}</p>
          <ol className="space-y-2">
            {workflow.steps.map((step) => (
              <li key={step.id} className="flex gap-3 border-l-4 border-ink pl-3">
                <span className="font-mono text-xs text-ink/50">{step.index}</span>
                <span>
                  <span className="block font-mono text-xs uppercase tracking-widest text-ink">
                    {step.title} <span className="text-ink/45">· {step.tool}</span>
                  </span>
                  <span className="text-sm text-ink/65">{step.description}</span>
                </span>
              </li>
            ))}
          </ol>
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">{workflow.code.filename}</p>
            <pre className="max-h-80 overflow-auto bg-ink p-4 font-mono text-xs leading-relaxed text-paper">
              {workflow.code.source}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
