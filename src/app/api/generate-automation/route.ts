import { NextResponse } from "next/server";
import { generateAutomation } from "@/lib/automation/generate";
import type { GenerateAutomationRequest, GenerateAutomationResponse } from "@/types";

export const runtime = "nodejs";

const MAX_PROMPT_LENGTH = 2000;

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

  // Artificial pause so the UI can show generation state.
  // Replace this mock path with a live LLM call when ready.
  await new Promise((resolve) => setTimeout(resolve, 900));

  try {
    const workflow = generateAutomation(prompt);
    const payload: GenerateAutomationResponse = { workflow };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
