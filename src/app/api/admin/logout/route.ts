import { NextResponse } from "next/server";
import { GATE_COOKIE, SESSION_COOKIE, cookieOptions } from "@/lib/admin/auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions.session, maxAge: 0 });
  response.cookies.set(GATE_COOKIE, "", { ...cookieOptions.gate, maxAge: 0 });
  return response;
}
