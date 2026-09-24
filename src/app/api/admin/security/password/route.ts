import { NextResponse } from "next/server";
import { guardAdmin, readJson, requireDbAdmin } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import { revokeOtherSessions, updateAdminPassword, verifyAdminPasswordById } from "@/lib/admin/db-auth";
import { checkRateLimit, getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

const MIN_LENGTH = 10;

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

  const body = await readJson<{ currentPassword?: unknown; newPassword?: unknown }>(request);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const adminUserId = guard.session.adminUserId as string;

  if (!(await verifyAdminPasswordById(adminUserId, currentPassword))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }
  if (newPassword.length < MIN_LENGTH) {
    return NextResponse.json({ error: `New password must be at least ${MIN_LENGTH} characters.` }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "New password must differ from the current one." }, { status: 400 });
  }
  if (newPassword.toLowerCase() === guard.session.username.toLowerCase()) {
    return NextResponse.json({ error: "Password can't be your username." }, { status: 400 });
  }

  await updateAdminPassword(adminUserId, newPassword);
  const revoked = await revokeOtherSessions(adminUserId, guard.session.sessionId);
  await logAudit("password_changed", { otherSessionsRevoked: revoked }, ip);

  return NextResponse.json({ ok: true, revokedSessions: revoked });
}
