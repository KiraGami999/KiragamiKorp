import type { ReactNode } from "react";
import { CopyButton } from "@/components/work/CopyButton";
import type { AiAnalysis } from "@/types";

function blocks(text: string | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export function hasAiAnalysis(analysis: AiAnalysis | undefined): analysis is AiAnalysis {
  return Boolean(
    analysis &&
      (analysis.problem ||
        analysis.tools?.length ||
        analysis.prompts ||
        analysis.mistakes ||
        analysis.result ||
        analysis.metric ||
        analysis.takeaway),
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-paper/80">
      {blocks(text).map((block, index) => (
        <p key={index} className="whitespace-pre-line">
          {block}
        </p>
      ))}
    </div>
  );
}

/** "How AI built this": server-rendered, so it ships no JavaScript beyond the prompt copy buttons. */
export function AiAnalysisSection({ analysis }: { analysis: AiAnalysis }) {
  const prompts = blocks(analysis.prompts);

  const rows: { label: string; node: ReactNode }[] = [];

  if (analysis.problem) {
    rows.push({ label: "The problem", node: <Prose text={analysis.problem} /> });
  }

  if (analysis.tools?.length) {
    rows.push({
      label: "AI tools & models",
      node: (
        <ul className="flex flex-wrap gap-2">
          {analysis.tools.map((tool) => (
            <li
              key={tool}
              className="border-2 border-acid px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-acid"
            >
              {tool}
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (prompts.length) {
    rows.push({
      label: "Prompts that worked",
      node: (
        <ol className="space-y-4">
          {prompts.map((prompt, index) => (
            <li key={index} className="border-2 border-paper/20 bg-paper/[0.03]">
              <div className="flex items-center justify-between border-b border-paper/15 px-4 py-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-acid">
                  Prompt {String(index + 1).padStart(2, "0")}
                </span>
                <CopyButton text={prompt} label={`Copy prompt ${index + 1}`} />
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-sm leading-relaxed text-paper/85">
                {prompt}
              </pre>
            </li>
          ))}
        </ol>
      ),
    });
  }

  if (analysis.mistakes) {
    rows.push({
      label: "Where the AI got it wrong",
      node: (
        <div className="border-l-4 border-acid bg-acid/[0.07] py-1 pl-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-acid">Failure log</p>
          <Prose text={analysis.mistakes} />
        </div>
      ),
    });
  }

  if (analysis.result) {
    rows.push({ label: "The result", node: <Prose text={analysis.result} /> });
  }

  if (analysis.takeaway) {
    rows.push({
      label: "Learner takeaway",
      node: (
        <div className="border-2 border-acid bg-acid p-6 text-ink sm:p-8">
          <div className="max-w-2xl space-y-4 font-display text-2xl uppercase leading-tight tracking-tight sm:text-3xl">
            {blocks(analysis.takeaway).map((block, index) => (
              <p key={index} className="whitespace-pre-line">
                {block}
              </p>
            ))}
          </div>
        </div>
      ),
    });
  }

  return (
    <section
      id="ai-analysis"
      aria-labelledby="ai-analysis-title"
      className="grain-overlay scroll-mt-20 border-t-2 border-acid bg-ink text-paper"
    >
      <div className="mx-auto max-w-[1600px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">LOG.04 — AI breakdown</p>
            <h2
              id="ai-analysis-title"
              className="mt-5 font-display text-6xl uppercase leading-[0.88] tracking-tight sm:text-8xl"
            >
              How AI
              <br />
              <span className="text-acid">built this</span>
            </h2>
          </div>

          {analysis.metric ? (
            <div className="border-2 border-acid p-5 shadow-[8px_8px_0_0_var(--color-acid)] sm:p-6 lg:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-paper/50">Headline result</p>
              <p className="mt-3 font-display text-5xl uppercase leading-none text-acid sm:text-6xl">
                {analysis.metric}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-14 border-b border-paper/15">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className="grid gap-5 border-t border-paper/15 py-10 lg:grid-cols-12 lg:gap-12"
            >
              <div className="lg:col-span-4">
                <p className="font-display text-5xl leading-none text-acid/90">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-mono text-xs uppercase tracking-[0.3em] text-paper/70">{row.label}</h3>
              </div>
              <div className="min-w-0 lg:col-span-8">{row.node}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
