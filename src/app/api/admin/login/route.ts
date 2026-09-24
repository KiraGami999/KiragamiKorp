import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  GATE_COOKIE,
  SESSION_COOKIE,
  cookieOptions,
  createSessionToken,
  isAdminConfigured,
  verifyAdminCredentials,
  verifyGateToken,
} from "@/lib/admin/auth";
import { checkRateLimit, getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
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

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, redirect: "/admin" });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(username), cookieOptions.session);
  response.cookies.set(GATE_COOKIE, "", { ...cookieOptions.gate, maxAge: 0 });
  return response;
}
