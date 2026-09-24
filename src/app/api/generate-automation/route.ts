import { NextResponse } from "next/server";
import { generateAutomation } from "@/lib/automation/generate";
import { generateWithLlm, getLlmConfig, LlmError } from "@/lib/automation/llm";
import { checkRateLimit, getClientKey } from "@/lib/automation/rate-limit";
import type { GenerateAutomationRequest, GenerateAutomationResponse } from "@/types";

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

  const limit = checkRateLimit(getClientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const config = getLlmConfig();

  if (config) {
    try {
      const workflow = await generateWithLlm(prompt, config);
      const payload: GenerateAutomationResponse = { workflow };
      return NextResponse.json(payload);
    } catch (error) {
      console.error("[generate-automation] live generation failed:", error);
      const payload: GenerateAutomationResponse = {
        workflow: generateAutomation(prompt),
        notice: fallbackNotice(error),
      };
      return NextResponse.json(payload);
    }
  }

  // No key configured: brief pause so the template path still shows a loading state.
  await new Promise((resolve) => setTimeout(resolve, 600));

  const payload: GenerateAutomationResponse = {
    workflow: generateAutomation(prompt),
    notice: "No AI key configured — showing a template workflow. Add GROQ_API_KEY to enable live generation.",
  };
  return NextResponse.json(payload);
}
