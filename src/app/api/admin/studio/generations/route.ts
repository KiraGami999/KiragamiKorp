import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import {
  clearGenerations,
  deleteGeneration,
  getGeneration,
  getGenerationStats,
  listGenerations,
} from "@/lib/automation/generations";
import { getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    const workflow = await getGeneration(id);
    return workflow
      ? NextResponse.json({ workflow })
      : NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const [generations, stats] = await Promise.all([listGenerations(), getGenerationStats()]);
  return NextResponse.json({ generations, stats });
}

/** `?id=...` deletes one entry; no id clears the whole log. */
export async function DELETE(request: Request) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  const id = new URL(request.url).searchParams.get("id");
  if (id) {
    await deleteGeneration(id);
    return NextResponse.json({ ok: true, deleted: 1 });
  }

  const deleted = await clearGenerations();
  await logAudit("generations_cleared", { count: deleted }, getClientKey(request));
  return NextResponse.json({ ok: true, deleted });
}
