import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/admin/tokens";

export {
  GATE_COOKIE,
  SESSION_COOKIE,
  cookieOptions,
  createGateToken,
  createSessionToken,
  isAdminConfigured,
  verifyAdminCredentials,
  verifyGatePhrase,
  verifyGateToken,
  verifySessionToken,
} from "@/lib/admin/tokens";

export async function readSessionCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function requireAdminSession(): Promise<{ username: string } | null> {
  return verifySessionToken(await readSessionCookie());
}
