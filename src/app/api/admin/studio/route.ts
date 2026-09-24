import { NextResponse } from "next/server";
import { guardAdmin, readJson } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import { getClientKey } from "@/lib/automation/rate-limit";
import { getStudioSettings, saveStudioSettings } from "@/lib/studio-settings";

export const runtime = "nodejs";

export async function GET() {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;
  return NextResponse.json({ settings: await getStudioSettings() });
}

export async function PUT(request: Request) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  const body = await readJson<{ settings?: unknown }>(request);
  if (!body?.settings) {
    return NextResponse.json({ error: "Settings are required." }, { status: 400 });
  }

  const settings = await saveStudioSettings(body.settings);
  await logAudit(
    "studio_settings_saved",
    { liveEnabled: settings.liveEnabled, model: settings.model || "default" },
    getClientKey(request),
  );
  return NextResponse.json({ settings });
}
