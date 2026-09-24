"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import type { AutomationStepType, AutomationWorkflow } from "@/types";
import { cn } from "@/lib/utils/cn";

type TabId = "overview" | "steps" | "prompt" | "code";

const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "steps", label: "Steps" },
  { id: "prompt", label: "Prompt" },
  { id: "code", label: "Code" },
];

const stepTypeLabel: Record<AutomationStepType, string> = {
  trigger: "Trigger",
  ingest: "Ingest",
  transform: "Transform",
  ai: "AI",
  action: "Action",
  review: "Review",
};

export function WorkflowResult({ workflow }: { workflow: AutomationWorkflow }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [copied, setCopied] = useState<string | null>(null);

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard may be denied; ignore silently.
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${workflow.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article className="border-2 border-ink bg-paper">
      <header className="flex flex-col gap-4 border-b-2 border-ink bg-ink px-5 py-5 text-paper sm:flex-row sm:items-start sm:justify-between sm:px-7">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
            {workflow.category} ·{" "}
            {workflow.mode === "live" ? `Live · ${workflow.model ?? "AI"}` : "Template"}
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase leading-none tracking-tight sm:text-4xl">
            {workflow.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/70">{workflow.summary}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadJson}
            className="inline-flex items-center gap-2 border border-paper/40 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-paper hover:border-acid hover:text-acid"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            Export JSON
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-0 border-b-2 border-ink" role="tablist" aria-label="Workflow views">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={cn(
              "border-r-2 border-ink px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
              tab === entry.id ? "bg-acid text-ink" : "bg-transparent text-ink/60 hover:bg-ink hover:text-acid",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-7" role="tabpanel">
        {tab === "overview" ? (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/50">Your brief</h3>
              <p className="mt-2 border-l-2 border-acid pl-4 text-base leading-relaxed text-ink/80">
                {workflow.prompt}
              </p>
              <dl className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/45">Time saved</dt>
                  <dd className="mt-1 font-display text-2xl uppercase">{workflow.estimatedTimeSaved}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/45">Steps</dt>
                  <dd className="mt-1 font-display text-2xl uppercase">{workflow.steps.length}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-ink/45">Runtime</dt>
                  <dd className="mt-1 font-display text-2xl uppercase">{workflow.code.language}</dd>
                </div>
              </dl>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/50">Inputs</h3>
                <ul className="mt-2 space-y-1">
                  {workflow.inputs.map((item) => (
                    <li key={item} className="font-mono text-xs text-ink/75">
                      → {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/50">Outputs</h3>
                <ul className="mt-2 space-y-1">
                  {workflow.outputs.map((item) => (
                    <li key={item} className="font-mono text-xs text-ink/75">
                      ← {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "steps" ? (
          <ol className="space-y-0 border-t-2 border-ink">
            {workflow.steps.map((step) => (
              <li
                key={step.id}
                className="grid grid-cols-[auto_1fr] gap-4 border-b-2 border-ink py-5 sm:grid-cols-[4rem_1fr_8rem] sm:gap-6"
              >
                <span className="font-mono text-sm text-ink/40">{step.index}</span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="font-display text-xl uppercase tracking-tight sm:text-2xl">
                      {step.title}
                    </h3>
                    <span className="border border-ink/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink/55">
                      {stepTypeLabel[step.type]}
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink/70">{step.description}</p>
                </div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink/45 sm:text-right">
                  {step.tool}
                </p>
              </li>
            ))}
          </ol>
        ) : null}

        {tab === "prompt" ? (
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/50">
                System prompt
              </h3>
              <button
                type="button"
                onClick={() => copyText("prompt", workflow.systemPrompt)}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink/60 hover:text-ink"
              >
                {copied === "prompt" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === "prompt" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto border-2 border-ink bg-ink p-4 font-mono text-xs leading-relaxed text-acid whitespace-pre-wrap">
              {workflow.systemPrompt}
            </pre>
          </div>
        ) : null}

        {tab === "code" ? (
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/50">
                {workflow.code.filename}
              </h3>
              <button
                type="button"
                onClick={() => copyText("code", workflow.code.source)}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink/60 hover:text-ink"
              >
                {copied === "code" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === "code" ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto border-2 border-ink bg-ink p-4 font-mono text-xs leading-relaxed text-paper/90">
              <code>{workflow.code.source}</code>
            </pre>
          </div>
        ) : null}
      </div>
    </article>
  );
}
