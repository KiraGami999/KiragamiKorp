import { NextResponse } from "next/server";
import { guardAdmin, readJson, requireDbAdmin } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import { updateGatePhrase, verifyAdminPasswordById } from "@/lib/admin/db-auth";
import { checkRateLimit, getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;
  const blocked = requireDbAdmin(guard.session);
  if (blocked) return blocked;

  const ip = getClientKey(request);
  const limit = checkRateLimit(`security:${ip}`, 8);
  if (!limit.allowed) {
    return NextResponse.json({ error: `Too many attempts. Wait ${limit.retryAfterSeconds}s.` }, { status: 429 });
  }

  const body = await readJson<{ newPhrase?: unknown; currentPassword?: unknown }>(request);
  const newPhrase = typeof body?.newPhrase === "string" ? body.newPhrase.trim() : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";

  if (newPhrase.length < 6 || newPhrase.length > 120) {
    return NextResponse.json({ error: "Clearance phrase must be 6–120 characters." }, { status: 400 });
  }
  if (!(await verifyAdminPasswordById(guard.session.adminUserId as string, currentPassword))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  await updateGatePhrase(newPhrase);
  await logAudit("gate_changed", {}, ip);
  return NextResponse.json({ ok: true });
}
