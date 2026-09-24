import { getSql, requireSql } from "@/lib/db";
import { hashSecret, hashToken, verifySecret } from "@/lib/admin/password";

export interface AdminUserRecord {
  id: string;
  username: string;
  displayName: string | null;
}

export async function findAdminByUsername(username: string): Promise<
  | (AdminUserRecord & { passwordHash: string; isActive: boolean })
  | null
> {
  const sql = getSql();
  if (!sql) return null;

  const rows = await sql`
    SELECT id, username, password_hash, display_name, is_active
    FROM admin_users
    WHERE lower(username) = lower(${username})
    LIMIT 1
  `;

  const row = rows[0] as
    | {
        id: string;
        username: string;
        password_hash: string;
        display_name: string | null;
        is_active: boolean;
      }
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    isActive: row.is_active,
  };
}

export async function verifyAdminAgainstDatabase(
  username: string,
  password: string,
): Promise<AdminUserRecord | null> {
  const user = await findAdminByUsername(username);
  if (!user || !user.isActive) return null;
  if (!verifySecret(password, user.passwordHash)) return null;

  const sql = getSql();
  if (sql) {
    await sql`
      UPDATE admin_users
      SET last_login_at = now(), updated_at = now()
      WHERE id = ${user.id}
    `;
  }

  return { id: user.id, username: user.username, displayName: user.displayName };
}

export async function verifyGateAgainstDatabase(phrase: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  const rows = await sql`
    SELECT gate_phrase_hash
    FROM auth_config
    WHERE id = 'default'
    LIMIT 1
  `;

  const hash = (rows[0] as { gate_phrase_hash?: string } | undefined)?.gate_phrase_hash;
  if (!hash) return false;
  return verifySecret(phrase.trim(), hash);
}

export async function hasDatabaseAdmin(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  try {
    const rows = await sql`
      SELECT 1 AS ok
      FROM admin_users
      WHERE is_active = true
      LIMIT 1
    `;
    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function createAdminSession(params: {
  adminUserId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<void> {
  const sql = requireSql();
  await sql`
    INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at, user_agent, ip_address)
    VALUES (
      ${params.adminUserId},
      ${hashToken(params.token)},
      ${params.expiresAt.toISOString()},
      ${params.userAgent ?? null},
      ${params.ipAddress ?? null}
    )
  `;
}

export async function revokeAdminSession(token: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;

  await sql`
    UPDATE admin_sessions
    SET revoked_at = now()
    WHERE token_hash = ${hashToken(token)}
      AND revoked_at IS NULL
  `;
}

export async function isAdminSessionActive(token: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return true; // cookie signature still validated; DB optional

  const rows = await sql`
    SELECT 1 AS ok
    FROM admin_sessions
    WHERE token_hash = ${hashToken(token)}
      AND revoked_at IS NULL
      AND expires_at > now()
    LIMIT 1
  `;

  // If no session rows exist yet (legacy cookies), allow signed cookie alone.
  if (rows.length > 0) return true;

  const any = await sql`SELECT 1 AS ok FROM admin_sessions LIMIT 1`;
  return any.length === 0;
}

/** Used by seed/bootstrap paths — not exposed as a public API. */
export async function upsertAuthConfig(gatePhrase: string): Promise<void> {
  const sql = requireSql();
  await sql`
    INSERT INTO auth_config (id, gate_phrase_hash)
    VALUES ('default', ${hashSecret(gatePhrase)})
    ON CONFLICT (id) DO UPDATE SET
      gate_phrase_hash = EXCLUDED.gate_phrase_hash,
      updated_at = now()
  `;
}
