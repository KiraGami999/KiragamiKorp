import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GATE_COOKIE, SESSION_COOKIE, cookieOptions } from "@/lib/admin/auth";
import { logAudit } from "@/lib/admin/audit";
import { revokeAdminSession } from "@/lib/admin/db-auth";
import { getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (session) {
    try {
      await revokeAdminSession(session);
      await logAudit("logout", {}, getClientKey(request));
    } catch (error) {
      console.error("[admin/logout] session revoke failed:", error);
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions.session, maxAge: 0 });
  response.cookies.set(GATE_COOKIE, "", { ...cookieOptions.gate, maxAge: 0 });
  return response;
}
