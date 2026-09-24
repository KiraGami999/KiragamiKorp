import type { AutomationStep, AutomationStepType, AutomationWorkflow } from "@/types";

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "openai/gpt-oss-20b";
const REQUEST_TIMEOUT_MS = 25_000;

const STEP_TYPES: readonly AutomationStepType[] = [
  "trigger",
  "ingest",
  "transform",
  "ai",
  "action",
  "review",
];

interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * Reads provider settings from the environment. Any OpenAI-compatible
 * endpoint works (Groq by default, Ollama or OpenRouter by changing
 * LLM_BASE_URL/LLM_MODEL). Returns null when no key is configured.
 */
export function getLlmConfig(): LlmConfig | null {
  const apiKey = process.env.LLM_API_KEY ?? process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  return {
    baseUrl: (process.env.LLM_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    apiKey,
    model: process.env.LLM_MODEL ?? DEFAULT_MODEL,
  };
}

const SYSTEM_PROMPT = `You are the automation architect inside KiragamiKorp Studio.
Turn the user's plain-language brief into a concrete, buildable automation workflow.
Prefer local-first, auditable steps, and include a human review step before any irreversible action.

Respond with a single JSON object only, matching exactly this shape:
{
  "title": string (max 60 chars, e.g. "Support Ticket Triage Pipeline"),
  "summary": string (1-2 sentences),
  "category": string (short, e.g. "Support Ops"),
  "steps": [
    {
      "type": "trigger" | "ingest" | "transform" | "ai" | "action" | "review",
      "title": string,
      "description": string (one sentence),
      "tool": string (concrete tool or service)
    }
  ] (4 to 8 steps, starting with a trigger),
  "systemPrompt": string (the prompt the AI step should run with),
  "code": {
    "language": "typescript" | "python",
    "filename": string,
    "source": string (a short, readable starter implementation, under 40 lines)
  },
  "inputs": string[] (2-5 items),
  "outputs": string[] (2-5 items),
  "estimatedTimeSaved": string (e.g. "30-60 min / week")
}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function readStringList(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => readString(item, 160))
    .filter((item): item is string => item !== null)
    .slice(0, maxItems);
}

function readSteps(value: unknown): AutomationStep[] | null {
  if (!Array.isArray(value)) return null;

  const steps: AutomationStep[] = [];
  for (const raw of value.slice(0, 10)) {
    if (!isRecord(raw)) continue;
    const title = readString(raw.title, 80);
    const description = readString(raw.description, 300);
    if (!title || !description) continue;

    const type = STEP_TYPES.find((entry) => entry === raw.type) ?? "transform";
    const position = steps.length + 1;
    steps.push({
      id: `step-${position}`,
      index: String(position).padStart(2, "0"),
      type,
      title,
      description,
      tool: readString(raw.tool, 60) ?? "Custom",
    });
  }

  return steps.length >= 3 ? steps : null;
}

/**
 * Validates the model's JSON against the Studio's workflow shape. Returns
 * null for anything unusable so the caller can fall back to the templates.
 */
function toWorkflow(raw: unknown, prompt: string, model: string): AutomationWorkflow | null {
  if (!isRecord(raw)) return null;

  const title = readString(raw.title, 80);
  const summary = readString(raw.summary, 400);
  const steps = readSteps(raw.steps);
  const systemPrompt = readString(raw.systemPrompt, 4000);
  const code = isRecord(raw.code) ? raw.code : null;
  const source = code ? readString(code.source, 6000) : null;

  if (!title || !summary || !steps || !systemPrompt || !code || !source) return null;

  const language = code.language === "python" ? "python" : "typescript";
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);

  return {
    id: `${slug || "automation"}-${Date.now().toString(36)}`,
    title,
    summary,
    category: readString(raw.category, 40) ?? "Custom",
    prompt,
    steps,
    systemPrompt,
    code: {
      language,
      filename:
        readString(code.filename, 60) ?? (language === "python" ? "automation.py" : "automation.ts"),
      source,
    },
    inputs: readStringList(raw.inputs, 6),
    outputs: readStringList(raw.outputs, 6),
    estimatedTimeSaved: readString(raw.estimatedTimeSaved, 40) ?? "Varies by workflow",
    generatedAt: new Date().toISOString(),
    mode: "live",
    model,
  };
}

export class LlmError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export async function generateWithLlm(prompt: string, config: LlmConfig): Promise<AutomationWorkflow> {
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.4,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        // GPT-OSS models think before answering; keep that short so tokens go to the JSON.
        ...(config.model.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new LlmError(timedOut ? "The AI provider timed out." : "Could not reach the AI provider.");
  }

  if (!response.ok) {
    throw new LlmError(`AI provider returned ${response.status}.`, response.status);
  }

  const data: unknown = await response.json();
  const content =
    isRecord(data) &&
    Array.isArray(data.choices) &&
    isRecord(data.choices[0]) &&
    isRecord(data.choices[0].message)
      ? data.choices[0].message.content
      : null;

  if (typeof content !== "string") {
    throw new LlmError("AI provider returned an empty response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new LlmError("AI provider returned invalid JSON.");
  }

  const workflow = toWorkflow(parsed, prompt, config.model);
  if (!workflow) {
    throw new LlmError("AI response didn't match the workflow format.");
  }

  return workflow;
}
