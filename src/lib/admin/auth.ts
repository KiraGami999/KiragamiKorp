import { cookies } from "next/headers";
import {
  hasDatabaseAdmin,
  verifyAdminAgainstDatabase,
  verifyGateAgainstDatabase,
} from "@/lib/admin/db-auth";
import {
  SESSION_COOKIE,
  isEnvAdminConfigured,
  verifyAdminCredentialsEnv,
  verifyGatePhraseEnv,
  verifySessionToken,
} from "@/lib/admin/tokens";
import { getDatabaseUrl } from "@/lib/db";

export {
  GATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  cookieOptions,
  createGateToken,
  createSessionToken,
  verifyGateToken,
  verifySessionToken,
} from "@/lib/admin/tokens";

export async function verifyGatePhrase(input: string): Promise<boolean> {
  if (await verifyGateAgainstDatabase(input)) return true;
  return verifyGatePhraseEnv(input);
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<{ username: string; id?: string } | null> {
  const dbUser = await verifyAdminAgainstDatabase(username, password);
  if (dbUser) return { username: dbUser.username, id: dbUser.id };

  if (verifyAdminCredentialsEnv(username, password)) {
    return { username };
  }

  return null;
}

export async function isAdminConfigured(): Promise<boolean> {
  if (!getDatabaseUrl()) return false;
  if (await hasDatabaseAdmin()) return true;
  return isEnvAdminConfigured();
}

export async function readSessionCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export async function requireAdminSession(): Promise<{ username: string } | null> {
  return verifySessionToken(await readSessionCookie());
}
