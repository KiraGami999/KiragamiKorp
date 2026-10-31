"use client";

import { Field } from "@/components/admin/ui";
import { TagInput } from "@/components/admin/TagInput";
import type { AiAnalysis } from "@/types";

const AI_TOOLS = [
  "Cursor",
  "Claude",
  "ChatGPT",
  "Gemini",
  "Groq",
  "GitHub Copilot",
  "v0",
  "Midjourney",
  "ElevenLabs",
  "Whisper",
  "n8n",
  "Ollama",
] as const;

/** An analysis with nothing in it is stored as "no analysis" so the public section hides itself. */
export function isEmptyAnalysis(analysis: AiAnalysis | undefined): boolean {
  if (!analysis) return true;
  return !(
    analysis.tools?.length ||
    analysis.problem?.trim() ||
    analysis.prompts?.trim() ||
    analysis.mistakes?.trim() ||
    analysis.result?.trim() ||
    analysis.metric?.trim() ||
    analysis.takeaway?.trim()
  );
}

export function AiAnalysisEditor({
  analysis,
  onChange,
}: {
  analysis: AiAnalysis | undefined;
  onChange: (analysis: AiAnalysis | undefined) => void;
}) {
  const value = analysis ?? {};

  function patch(update: Partial<AiAnalysis>) {
    // Drop empty fields so the draft matches what the server stores (keeps the "unsaved" check honest).
    const next = Object.fromEntries(
      Object.entries({ ...value, ...update }).filter(([, field]) =>
        Array.isArray(field) ? field.length > 0 : typeof field === "string" && field.trim() !== "",
      ),
    ) as AiAnalysis;
    onChange(isEmptyAnalysis(next) ? undefined : next);
  }

  return (
    <div className="space-y-5">
      <Field
        label="The problem"
        value={value.problem ?? ""}
        multiline
        rows={3}
        maxLength={2000}
        placeholder="A guesthouse owner was losing bookings because replies to WhatsApp took hours."
        hint="Who has this problem, and what does it cost them?"
        onChange={(problem) => patch({ problem })}
      />

      <TagInput
        label="AI tools & models used"
        tags={value.tools ?? []}
        suggestions={AI_TOOLS}
        max={12}
        placeholder="Cursor, Claude, Groq…"
        onChange={(tools) => patch({ tools })}
      />

      <Field
        label="Prompts that worked"
        value={value.prompts ?? ""}
        multiline
        rows={8}
        maxLength={6000}
        placeholder={"Build a booking form that…\n\nNow add validation so that…"}
        hint="Paste the real prompts. Leave a blank line between each one; they show as separate blocks."
        onChange={(prompts) => patch({ prompts })}
      />

      <Field
        label="Where the AI got it wrong"
        value={value.mistakes ?? ""}
        multiline
        rows={5}
        maxLength={3000}
        placeholder="It invented a database column that didn't exist. I caught it when the build failed, pasted the error back and it fixed it."
        hint="The most useful part for learners. Be specific about the mistake and the fix."
        onChange={(mistakes) => patch({ mistakes })}
      />

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
        <Field
          label="The result"
          value={value.result ?? ""}
          multiline
          rows={3}
          maxLength={2000}
          placeholder="Replies now go out in under a minute and the owner checks one dashboard."
          onChange={(result) => patch({ result })}
        />
        <Field
          label="Headline metric"
          value={value.metric ?? ""}
          maxLength={60}
          placeholder="6 hrs → 20 min"
          hint="Big number on the page. Before → after works well."
          onChange={(metric) => patch({ metric })}
        />
      </div>

      <Field
        label="Learner takeaway"
        value={value.takeaway ?? ""}
        multiline
        rows={3}
        maxLength={1500}
        placeholder="You don't need to code first. Describe the problem clearly, then check what the AI hands back."
        onChange={(takeaway) => patch({ takeaway })}
      />
    </div>
  );
}
