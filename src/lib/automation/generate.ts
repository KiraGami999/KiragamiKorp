import type { AutomationStep, AutomationWorkflow } from "@/types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function padIndex(n: number): string {
  return String(n).padStart(2, "0");
}

function steps(...defs: Omit<AutomationStep, "id" | "index">[]): AutomationStep[] {
  return defs.map((step, i) => ({
    ...step,
    id: `step-${i + 1}`,
    index: padIndex(i + 1),
  }));
}

type Template = {
  match: RegExp;
  category: string;
  title: (prompt: string) => string;
  summary: (prompt: string) => string;
  steps: AutomationStep[];
  systemPrompt: (prompt: string) => string;
  code: (prompt: string) => AutomationWorkflow["code"];
  inputs: string[];
  outputs: string[];
  estimatedTimeSaved: string;
};

const templates: Template[] = [
  {
    match: /ticket|support|inbox|triage|customer\s*service/i,
    category: "Support Ops",
    title: () => "Support Ticket Triage Pipeline",
    summary: (prompt) =>
      `Classifies inbound tickets, drafts replies, and routes them for human review — generated from: “${prompt.slice(0, 120)}”.`,
    steps: steps(
      {
        type: "trigger",
        title: "Webhook intake",
        description: "Receive new tickets from email, Help Scout, or a custom form webhook.",
        tool: "Webhook / IMAP",
      },
      {
        type: "ingest",
        title: "Normalize payload",
        description: "Extract subject, body, customer metadata, and attachments into a shared schema.",
        tool: "Node.js / Zod",
      },
      {
        type: "ai",
        title: "Classify intent & urgency",
        description: "Local LLM labels intent, urgency, and product area with confidence scores.",
        tool: "Local LLM (7B)",
      },
      {
        type: "ai",
        title: "Draft response",
        description: "Generate a reply draft using the knowledge base and tone guide.",
        tool: "Prompt pipeline",
      },
      {
        type: "review",
        title: "Human review gate",
        description: "Queue drafts below the confidence threshold for agent approval.",
        tool: "Review queue",
      },
      {
        type: "action",
        title: "Route & notify",
        description: "Assign to the right channel and notify Slack / email.",
        tool: "Slack / CRM",
      },
    ),
    systemPrompt: (prompt) =>
      `You are a support operations classifier for KiragamiKorp automations.\nUser goal: ${prompt}\nReturn JSON with fields: intent, urgency (low|medium|high), product_area, confidence (0-1), draft_reply.`,
    code: () => ({
      language: "typescript",
      filename: "triage-pipeline.ts",
      source: `type Ticket = { id: string; subject: string; body: string };

export async function triageTicket(ticket: Ticket) {
  const classified = await localLlm.classify({
    system: "Classify support tickets. Return JSON.",
    user: \`\${ticket.subject}\\n\\n\${ticket.body}\`,
  });

  const draft = await localLlm.complete({
    system: "Draft a concise, helpful support reply.",
    user: JSON.stringify({ ticket, classified }),
  });

  if (classified.confidence < 0.75) {
    return queueForReview({ ticket, classified, draft });
  }

  return routeTicket({ ticket, classified, draft });
}`,
    }),
    inputs: ["Ticket webhook / email", "Knowledge base docs", "Tone guide"],
    outputs: ["Classification JSON", "Draft reply", "Routed assignment"],
    estimatedTimeSaved: "8–15 min per ticket",
  },
  {
    match: /report|csv|ops\s*report|weekly|dashboard|analytics/i,
    category: "Ops Reporting",
    title: () => "Weekly Ops Report Automation",
    summary: (prompt) =>
      `Pulls raw exports, normalizes schema drift, summarizes with a local model, and ships a report — from: “${prompt.slice(0, 120)}”.`,
    steps: steps(
      {
        type: "trigger",
        title: "Schedule trigger",
        description: "Run every Monday at 07:00 (or on-demand via API).",
        tool: "Cron",
      },
      {
        type: "ingest",
        title: "Fetch data sources",
        description: "Pull CSV / API exports from the configured ops sources.",
        tool: "HTTP / S3 / Sheets",
      },
      {
        type: "transform",
        title: "Normalize schemas",
        description: "Reconcile column drift and merge into a single analytics table.",
        tool: "Python / Pandas",
      },
      {
        type: "ai",
        title: "Summarize insights",
        description: "Local LLM writes an executive summary and flags anomalies.",
        tool: "Local LLM",
      },
      {
        type: "action",
        title: "Publish artifacts",
        description: "Write report.md + charts and post to Slack / email.",
        tool: "Filesystem / Slack",
      },
    ),
    systemPrompt: (prompt) =>
      `You summarize operational metrics for a weekly report.\nGoal: ${prompt}\nHighlight trends, anomalies, and 3 recommended actions. Keep it under 400 words.`,
    code: () => ({
      language: "python",
      filename: "weekly_ops_report.py",
      source: `def run_weekly_report(sources: list[str]) -> dict:
    frames = [load_source(s) for s in sources]
    table = normalize_and_merge(frames)
    summary = local_llm.summarize(
        system="Write a crisp weekly ops summary.",
        data=table.describe().to_dict(),
    )
    charts = render_charts(table)
    publish(report=summary, charts=charts)
    return {"rows": len(table), "summary": summary}`,
    }),
    inputs: ["CSV exports", "API credentials", "Schedule"],
    outputs: ["report.md", "charts.png", "Slack notification"],
    estimatedTimeSaved: "45–90 min / week",
  },
  {
    match: /changelog|release|pull\s*request|git|commit/i,
    category: "Engineering",
    title: () => "Release Changelog Generator",
    summary: (prompt) =>
      `Turns merged PRs into plain-language release notes — generated from: “${prompt.slice(0, 120)}”.`,
    steps: steps(
      {
        type: "trigger",
        title: "Release tag / manual run",
        description: "Fire when a version tag is pushed or via studio regenerate.",
        tool: "GitHub webhook",
      },
      {
        type: "ingest",
        title: "Collect PR history",
        description: "Read commits and merged pull requests since the last release.",
        tool: "GitHub API",
      },
      {
        type: "transform",
        title: "Group by type",
        description: "Bucket into Feature / Fix / Chore using labels and conventional commits.",
        tool: "Rules + heuristics",
      },
      {
        type: "ai",
        title: "Rewrite for humans",
        description: "Local LLM rewrites bullet points in plain language.",
        tool: "Prompt pipeline",
      },
      {
        type: "action",
        title: "Publish CHANGELOG",
        description: "Write CHANGELOG.md and optionally open a release draft.",
        tool: "Git / GitHub Releases",
      },
    ),
    systemPrompt: (prompt) =>
      `Rewrite engineering pull-request titles into clear customer-facing changelog entries.\nGoal: ${prompt}\nGroup as Features, Fixes, Chores. No jargon.`,
    code: () => ({
      language: "typescript",
      filename: "generate-changelog.ts",
      source: `export async function generateChangelog(sinceTag: string) {
  const prs = await github.listMergedPulls({ since: sinceTag });
  const grouped = groupByType(prs);
  const changelog = await localLlm.complete({
    system: "Write a clean CHANGELOG.md section.",
    user: JSON.stringify(grouped),
  });
  await writeFile("CHANGELOG.md", changelog, { flag: "a" });
  return changelog;
}`,
    }),
    inputs: ["GitHub repo", "Last release tag"],
    outputs: ["CHANGELOG.md", "Release draft"],
    estimatedTimeSaved: "20–40 min / release",
  },
  {
    match: /email|newsletter|outreach|cold\s*mail/i,
    category: "Communications",
    title: () => "Email Draft Automation",
    summary: (prompt) =>
      `Builds a repeatable email drafting pipeline with review before send — from: “${prompt.slice(0, 120)}”.`,
    steps: steps(
      {
        type: "trigger",
        title: "New lead / schedule",
        description: "Start when a CRM lead is created or on a campaign schedule.",
        tool: "CRM webhook / Cron",
      },
      {
        type: "ingest",
        title: "Load context",
        description: "Pull contact profile, last interactions, and campaign brief.",
        tool: "CRM API",
      },
      {
        type: "ai",
        title: "Generate draft",
        description: "Compose a personalized email using the tone and offer brief.",
        tool: "Local LLM",
      },
      {
        type: "review",
        title: "Approve before send",
        description: "Human gate — edit or approve the draft.",
        tool: "Review UI",
      },
      {
        type: "action",
        title: "Queue send",
        description: "Hand off to the mail provider only after approval.",
        tool: "SMTP / ESP",
      },
    ),
    systemPrompt: (prompt) =>
      `Write concise, personalized outreach emails.\nGoal: ${prompt}\nKeep under 150 words. No hype. One clear CTA.`,
    code: () => ({
      language: "typescript",
      filename: "email-draft.ts",
      source: `export async function draftOutreach(contact: Contact, brief: string) {
  const draft = await localLlm.complete({
    system: "Write a short personalized email.",
    user: JSON.stringify({ contact, brief }),
  });
  return enqueueForApproval({ contact, draft });
}`,
    }),
    inputs: ["CRM contact", "Campaign brief", "Tone guide"],
    outputs: ["Email draft", "Approval task"],
    estimatedTimeSaved: "5–10 min per email",
  },
];

function genericTemplate(prompt: string): Template {
  const short = titleCase(prompt) || "Custom Automation";
  return {
    match: /.*/,
    category: "Custom",
    title: () => `${short.slice(0, 48)} Pipeline`,
    summary: () =>
      `A modular automation scaffold generated from your brief. Wire the stubs to your tools and swap the mock LLM for a live local model.`,
    steps: steps(
      {
        type: "trigger",
        title: "Define trigger",
        description: "Choose webhook, schedule, or manual run as the entry point.",
        tool: "Trigger adapter",
      },
      {
        type: "ingest",
        title: "Collect inputs",
        description: "Pull the data your automation needs into a typed payload.",
        tool: "Connectors",
      },
      {
        type: "transform",
        title: "Prepare context",
        description: "Clean, validate, and structure data for the model step.",
        tool: "Transform layer",
      },
      {
        type: "ai",
        title: "Generate with AI",
        description: "Run a local-first prompt pipeline against your brief.",
        tool: "Local LLM",
      },
      {
        type: "review",
        title: "Human check",
        description: "Optional approval gate before side effects.",
        tool: "Review queue",
      },
      {
        type: "action",
        title: "Deliver result",
        description: "Write files, notify channels, or call downstream APIs.",
        tool: "Action adapters",
      },
    ),
    systemPrompt: () =>
      `You are an automation architect inside KiragamiKorp Studio.\nUser brief: ${prompt}\nProduce structured outputs only. Prefer local, auditable steps.`,
    code: () => ({
      language: "typescript",
      filename: "automation.ts",
      source: `export async function runAutomation(input: Record<string, unknown>) {
  const context = await prepare(input);
  const result = await localLlm.complete({
    system: ${JSON.stringify(`Automation goal: ${prompt.slice(0, 200)}`)},
    user: JSON.stringify(context),
  });
  await deliver(result);
  return result;
}`,
    }),
    inputs: ["User brief", "Source data", "Credentials (optional)"],
    outputs: ["Structured result", "Action logs"],
    estimatedTimeSaved: "Varies by workflow",
  };
}

/**
 * Mock automation generator — keyword-matched templates for the MVP.
 * Swap the body of `generateAutomation` for a live LLM call later; keep
 * the returned `AutomationWorkflow` shape stable.
 */
export function generateAutomation(prompt: string): AutomationWorkflow {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    throw new Error("Prompt is required.");
  }

  const template =
    templates.find((entry) => entry.match.test(cleaned)) ?? genericTemplate(cleaned);

  const title = template.title(cleaned);
  const id = `${slugify(title) || "automation"}-${Date.now().toString(36)}`;

  return {
    id,
    title,
    summary: template.summary(cleaned),
    category: template.category,
    prompt: cleaned,
    steps: template.steps,
    systemPrompt: template.systemPrompt(cleaned),
    code: template.code(cleaned),
    inputs: template.inputs,
    outputs: template.outputs,
    estimatedTimeSaved: template.estimatedTimeSaved,
    generatedAt: new Date().toISOString(),
    mode: "mock",
  };
}

export const EXAMPLE_PROMPTS = [
  "Automate weekly ops reports from CSV exports",
  "Triage inbound support tickets and draft replies",
  "Generate a changelog from merged pull requests",
  "Draft personalized outreach emails for new CRM leads",
] as const;
