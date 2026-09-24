import { NextResponse } from "next/server";
import { guardAdmin, requireDbAdmin } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import { listAdminSessions, revokeOtherSessions } from "@/lib/admin/db-auth";
import { getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;
  const blocked = requireDbAdmin(guard.session);
  if (blocked) return blocked;

  const sessions = await listAdminSessions(guard.session.adminUserId as string, guard.session.sessionId);
  return NextResponse.json({ sessions });
}

/** Signs out every other device; the current session stays active. */
export async function DELETE(request: Request) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;
  const blocked = requireDbAdmin(guard.session);
  if (blocked) return blocked;

  const revoked = await revokeOtherSessions(guard.session.adminUserId as string, guard.session.sessionId);
  await logAudit("sessions_revoked", { count: revoked }, getClientKey(request));
  return NextResponse.json({ ok: true, revoked });
}
