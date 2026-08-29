import type { AiLabScenario } from "@/types";

/**
 * Scripted preview of automation pipelines. This is a client-side
 * simulation (no live model calls), clearly labeled as such in the UI —
 * it demonstrates the shape of the work, not a hosted product.
 */
export const aiLabScenarios: AiLabScenario[] = [
  {
    id: "weekly-report",
    title: "Automate weekly ops report",
    lines: [
      { type: "prompt", text: "automate: weekly ops report from raw CSV exports" },
      { type: "output", text: "> parsing 4 data sources..." },
      { type: "output", text: "> normalizing schema drift across sources" },
      { type: "output", text: "> summarizing via local LLM (7B, on-device)" },
      { type: "output", text: "> drafting report.md + charts.png" },
      { type: "output", text: "> done — 47min task reduced to 12s" },
    ],
  },
  {
    id: "support-triage",
    title: "Triage inbound support tickets",
    lines: [
      { type: "prompt", text: "automate: classify and route support tickets" },
      { type: "output", text: "> ingesting ticket queue (webhook)" },
      { type: "output", text: "> classifying intent + urgency" },
      { type: "output", text: "> drafting response for human review" },
      { type: "output", text: "> routing to #support-eng" },
      { type: "output", text: "> done — 0 tickets left unsorted" },
    ],
  },
  {
    id: "changelog",
    title: "Generate release changelog",
    lines: [
      { type: "prompt", text: "automate: changelog from merged pull requests" },
      { type: "output", text: "> reading commit + PR history" },
      { type: "output", text: "> grouping by feature / fix / chore" },
      { type: "output", text: "> rewriting in plain language" },
      { type: "output", text: "> publishing CHANGELOG.md" },
      { type: "output", text: "> done — release notes ready in seconds" },
    ],
  },
];
