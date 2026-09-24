"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { EXAMPLE_PROMPTS } from "@/lib/automation/generate";
import { cn } from "@/lib/utils/cn";

interface StudioPromptFormProps {
  onSubmit: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  initialPrompt?: string;
}

export function StudioPromptForm({
  onSubmit,
  isGenerating,
  initialPrompt = "",
}: StudioPromptFormProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const remaining = 2000 - prompt.length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    await onSubmit(prompt.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label htmlFor="automation-prompt" className="font-mono text-xs uppercase tracking-[0.25em] text-ink/60">
        Describe the automation
      </label>
      <textarea
        id="automation-prompt"
        name="prompt"
        rows={5}
        maxLength={2000}
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="e.g. Automate weekly ops reports from CSV exports and post a summary to Slack…"
        className="w-full resize-y border-2 border-ink bg-paper px-4 py-3 font-sans text-base leading-relaxed text-ink placeholder:text-ink/35 focus-visible:outline-none"
        disabled={isGenerating}
        required
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">
          {remaining} chars left
        </p>
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className={cn(
            "inline-flex items-center gap-2 border-2 border-ink bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-acid transition-colors",
            "hover:bg-transparent hover:text-ink disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              Generate workflow
            </>
          )}
        </button>
      </div>

      <div className="mt-2">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-ink/45">
          Try an example
        </p>
        <ul className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <li key={example}>
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => setPrompt(example)}
                className="border border-ink/25 bg-transparent px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-wide text-ink/70 transition-colors hover:border-ink hover:bg-ink hover:text-acid disabled:opacity-50"
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
