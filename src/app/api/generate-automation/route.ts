import { NextResponse } from "next/server";
import { generateAutomation } from "@/lib/automation/generate";
import { recordGeneration } from "@/lib/automation/generations";
import { generateWithLlm, getLlmConfig, LlmError } from "@/lib/automation/llm";
import { checkRateLimit, getClientKey } from "@/lib/automation/rate-limit";
import { getStudioSettings } from "@/lib/studio-settings";
import type { AutomationWorkflow, GenerateAutomationRequest, GenerateAutomationResponse } from "@/types";

export const runtime = "nodejs";

const MAX_PROMPT_LENGTH = 2000;

function fallbackNotice(error: unknown): string {
  if (error instanceof LlmError && error.status === 429) {
    return "Free AI quota is busy right now — showing a template workflow instead. Try again in a minute.";
  }
  return "Live AI generation failed — showing a template workflow instead.";
}

export async function POST(request: Request) {
  let body: GenerateAutomationRequest;

  try {
    body = (await request.json()) as GenerateAutomationRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  const settings = await getStudioSettings();

  const limit = checkRateLimit(getClientKey(request), settings.rateLimitPerMinute);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  async function respond(workflow: AutomationWorkflow, notice?: string) {
    if (settings.saveGenerations) await recordGeneration(workflow);
    const payload: GenerateAutomationResponse = notice ? { workflow, notice } : { workflow };
    return NextResponse.json(payload);
  }

  const config = settings.liveEnabled ? getLlmConfig(settings.model) : null;

  if (config) {
    try {
      const workflow = await generateWithLlm(prompt, config, {
        temperature: settings.temperature,
        extraInstructions: settings.extraInstructions,
      });
      return respond(workflow);
    } catch (error) {
      console.error("[generate-automation] live generation failed:", error);
      return respond(generateAutomation(prompt), fallbackNotice(error));
    }
  }

  // Template path: brief pause so the UI still shows a loading state.
  await new Promise((resolve) => setTimeout(resolve, 600));

  return respond(
    generateAutomation(prompt),
    settings.liveEnabled
      ? "No AI key configured — showing a template workflow. Add GROQ_API_KEY to enable live generation."
      : "Live AI is paused by the studio — showing a template workflow.",
  );
}
