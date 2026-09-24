import { NextResponse } from "next/server";
import {
  GATE_COOKIE,
  cookieOptions,
  createGateToken,
  verifyGatePhrase,
} from "@/lib/admin/auth";
import { checkRateLimit, getClientKey } from "@/lib/automation/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limit = checkRateLimit(`gate:${getClientKey(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Wait ${limit.retryAfterSeconds}s.` },
      { status: 429 },
    );
  }

  let body: { code?: unknown };
  try {
    body = (await request.json()) as { code?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code : "";
  if (!(await verifyGatePhrase(code))) {
    return NextResponse.json({ error: "ACCESS DENIED" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, redirect: "/admin/login" });
  response.cookies.set(GATE_COOKIE, await createGateToken(), cookieOptions.gate);
  return response;
}
