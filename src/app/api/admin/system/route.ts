import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/api";
import { buildSystemReport } from "@/lib/admin/system";
import { getLlmConfig, pingLlm } from "@/lib/automation/llm";
import { getStudioSettings } from "@/lib/studio-settings";

export const runtime = "nodejs";

export async function GET() {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;
  return NextResponse.json({ report: await buildSystemReport() });
}

/** Tests the AI provider key without spending generation tokens. */
export async function POST() {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  const settings = await getStudioSettings();
  const config = getLlmConfig(settings.model);
  if (!config) {
    return NextResponse.json({ result: { ok: false, status: 0, latencyMs: 0, modelAvailable: null, message: "No API key configured." } });
  }

  const result = await pingLlm(config);
  const message = result.ok
    ? result.modelAvailable === false
      ? `Key works, but "${config.model}" isn't in the provider's model list.`
      : `Provider reachable in ${result.latencyMs} ms.`
    : result.status === 401
      ? "The provider rejected the API key."
      : result.status
        ? `Provider returned ${result.status}.`
        : "Could not reach the provider.";

  return NextResponse.json({ result: { ...result, message } });
}
