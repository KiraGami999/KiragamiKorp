import { NextResponse } from "next/server";
import { guardAdmin, readJson, requireDbAdmin } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import { updateAdminProfile, verifyAdminPasswordById } from "@/lib/admin/db-auth";
import { checkRateLimit, getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,40}$/;

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

  const body = await readJson<{ username?: unknown; displayName?: unknown; currentPassword?: unknown }>(request);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const displayName = typeof body?.displayName === "string" ? body.displayName.trim().slice(0, 80) : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const adminUserId = guard.session.adminUserId as string;

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–40 characters: letters, numbers, dot, dash or underscore." },
      { status: 400 },
    );
  }
  if (!(await verifyAdminPasswordById(adminUserId, currentPassword))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  const result = await updateAdminProfile(adminUserId, { username, displayName: displayName || null });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  if (username !== guard.session.username) {
    await logAudit("username_changed", { from: guard.session.username, to: username }, ip);
  }
  return NextResponse.json({ ok: true, username, displayName: displayName || null });
}
