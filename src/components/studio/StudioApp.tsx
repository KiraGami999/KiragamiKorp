"use client";

import { useState } from "react";
import { StudioPromptForm } from "@/components/studio/StudioPromptForm";
import { WorkflowResult } from "@/components/studio/WorkflowResult";
import type { AutomationWorkflow, GenerateAutomationResponse } from "@/types";

export function StudioApp() {
  const [workflow, setWorkflow] = useState<AutomationWorkflow | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleGenerate(prompt: string) {
    setIsGenerating(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/generate-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as GenerateAutomationResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Generation failed.");
      }

      setWorkflow(data.workflow);
      setNotice(data.notice ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1600px] gap-10 px-6 py-10 sm:px-10 lg:grid-cols-12 lg:gap-12 lg:px-16 lg:py-14">
      <div className="lg:col-span-5">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/50">
          SYS.STUDIO — AUTOMATION GENERATOR
        </p>
        <h1 className="mt-4 font-display text-[12vw] leading-[0.88] tracking-tight text-ink sm:text-6xl lg:text-5xl xl:text-6xl">
          DESCRIBE IT.
          <br />
          GENERATE THE SYSTEM.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70">
          Plain-language brief in. Structured automation workflow out — steps, system prompt,
          and starter code, built live by an open-source model on Groq.
        </p>

        <div className="mt-8 border-2 border-ink bg-paper p-5 sm:p-6">
          <StudioPromptForm onSubmit={handleGenerate} isGenerating={isGenerating} />
          {error ? (
            <p role="alert" className="mt-4 border-l-2 border-ink bg-ink/5 px-3 py-2 font-mono text-xs text-ink">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="mt-4 border-l-2 border-acid bg-ink px-3 py-2 font-mono text-xs text-paper">
              {notice}
            </p>
          ) : null}
          {isGenerating ? (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/50" aria-live="polite">
              Architecting pipeline…
            </p>
          ) : null}
        </div>
      </div>

      <div className="lg:col-span-7">
        {workflow ? (
          <WorkflowResult workflow={workflow} />
        ) : (
          <div className="flex min-h-[420px] flex-col justify-between border-2 border-dashed border-ink/30 bg-ink p-6 text-paper sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">Awaiting brief</p>
            <div>
              <p className="font-display text-4xl uppercase leading-none sm:text-5xl">
                Your workflow
                <br />
                appears here.
              </p>
              <p className="mt-4 max-w-sm font-mono text-xs uppercase leading-relaxed tracking-widest text-paper/45">
                Steps · prompts · code stubs · exportable JSON
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/35">
              Powered by Groq · template fallback
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
