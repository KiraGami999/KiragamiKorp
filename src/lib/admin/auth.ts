import { cookies } from "next/headers";
import {
  findActiveSession,
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

export interface AdminSession {
  username: string;
  displayName: string | null;
  /** Null only in env-fallback mode (no admin row in the database). */
  adminUserId: string | null;
  sessionId: string | null;
}

export async function verifyGatePhrase(input: string): Promise<boolean> {
  if (await verifyGateAgainstDatabase(input)) return true;
  // The env phrase is only a bootstrap path before the database is seeded.
  if (await hasDatabaseAdmin()) return false;
  return verifyGatePhraseEnv(input);
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<{ username: string; id?: string } | null> {
  if (await hasDatabaseAdmin()) {
    const dbUser = await verifyAdminAgainstDatabase(username, password);
    return dbUser ? { username: dbUser.username, id: dbUser.id } : null;
  }
  return verifyAdminCredentialsEnv(username, password) ? { username } : null;
}

export async function isAdminConfigured(): Promise<boolean> {
  if (!getDatabaseUrl()) return false;
  return (await hasDatabaseAdmin()) || isEnvAdminConfigured();
}

export async function readSessionCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

/**
 * The cookie signature is checked first (cheap), then the session row, so a
 * revoked session or changed password locks the cookie out immediately.
 */
export async function requireAdminSession(): Promise<AdminSession | null> {
  const token = await readSessionCookie();
  const signed = await verifySessionToken(token);
  if (!signed || !token) return null;

  if (await hasDatabaseAdmin()) {
    const active = await findActiveSession(token);
    if (!active) return null;
    return {
      username: active.admin.username,
      displayName: active.admin.displayName,
      adminUserId: active.admin.id,
      sessionId: active.sessionId,
    };
  }

  return { username: signed.username, displayName: null, adminUserId: null, sessionId: null };
}
