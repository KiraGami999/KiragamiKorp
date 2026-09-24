import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  GATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  cookieOptions,
  createSessionToken,
  isAdminConfigured,
  verifyAdminCredentials,
  verifyGateToken,
} from "@/lib/admin/auth";
import { createAdminSession } from "@/lib/admin/db-auth";
import { checkRateLimit, getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminConfigured())) {
    return NextResponse.json(
      { error: "Admin credentials are not configured on this server." },
      { status: 503 },
    );
  }

  const limit = checkRateLimit(`login:${getClientKey(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Wait ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  const jar = await cookies();
  if (!(await verifyGateToken(jar.get(GATE_COOKIE)?.value))) {
    return NextResponse.json(
      { error: "Gate clearance required. Return via the studio mark." },
      { status: 403 },
    );
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { username?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const admin = await verifyAdminCredentials(username, password);
  if (!admin) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = await createSessionToken(admin.username);
  if (admin.id) {
    try {
      await createAdminSession({
        adminUserId: admin.id,
        token,
        expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
        userAgent: request.headers.get("user-agent"),
        ipAddress: getClientKey(request),
      });
    } catch (error) {
      console.error("[admin/login] session persist failed:", error);
    }
  }

  const response = NextResponse.json({ ok: true, redirect: "/admin" });
  response.cookies.set(SESSION_COOKIE, token, cookieOptions.session);
  response.cookies.set(GATE_COOKIE, "", { ...cookieOptions.gate, maxAge: 0 });
  return response;
}
