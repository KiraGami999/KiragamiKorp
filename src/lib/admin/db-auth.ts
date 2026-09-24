import { getSql, requireSql } from "@/lib/db";
import { hashSecret, hashToken, verifySecret } from "@/lib/admin/password";

export interface AdminUserRecord {
  id: string;
  username: string;
  displayName: string | null;
}

export interface AdminSessionInfo {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
  current: boolean;
}

type AdminRow = {
  id: string;
  username: string;
  password_hash: string;
  display_name: string | null;
  is_active: boolean;
};

async function findAdminRow(where: { username?: string; id?: string }): Promise<AdminRow | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = where.id
    ? await sql`
        SELECT id, username, password_hash, display_name, is_active
        FROM admin_users WHERE id = ${where.id} LIMIT 1
      `
    : await sql`
        SELECT id, username, password_hash, display_name, is_active
        FROM admin_users WHERE lower(username) = lower(${where.username ?? ""}) LIMIT 1
      `;
  return (rows[0] as AdminRow | undefined) ?? null;
}

export async function verifyAdminAgainstDatabase(
  username: string,
  password: string,
): Promise<AdminUserRecord | null> {
  const user = await findAdminRow({ username });
  if (!user || !user.is_active) return null;
  if (!verifySecret(password, user.password_hash)) return null;

  await requireSql()`
    UPDATE admin_users SET last_login_at = now(), updated_at = now() WHERE id = ${user.id}
  `;

  return { id: user.id, username: user.username, displayName: user.display_name };
}

export async function verifyAdminPasswordById(adminUserId: string, password: string): Promise<boolean> {
  const user = await findAdminRow({ id: adminUserId });
  return Boolean(user?.is_active && verifySecret(password, user.password_hash));
}

export async function verifyGateAgainstDatabase(phrase: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;

  const rows = await sql`SELECT gate_phrase_hash FROM auth_config WHERE id = 'default' LIMIT 1`;
  const hash = (rows[0] as { gate_phrase_hash?: string } | undefined)?.gate_phrase_hash;
  return hash ? verifySecret(phrase.trim(), hash) : false;
}

export async function hasDatabaseAdmin(): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  try {
    const rows = await sql`SELECT 1 AS ok FROM admin_users WHERE is_active = true LIMIT 1`;
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
  await requireSql()`
    INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at, user_agent, ip_address)
    VALUES (
      ${params.adminUserId},
      ${hashToken(params.token)},
      ${params.expiresAt.toISOString()},
      ${params.userAgent?.slice(0, 300) ?? null},
      ${params.ipAddress ?? null}
    )
  `;
}

export async function revokeAdminSession(token: string): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  await sql`
    UPDATE admin_sessions SET revoked_at = now()
    WHERE token_hash = ${hashToken(token)} AND revoked_at IS NULL
  `;
}

/** Resolves a signed cookie to a live, unrevoked session and its admin. */
export async function findActiveSession(
  token: string,
): Promise<{ sessionId: string; admin: AdminUserRecord } | null> {
  const sql = getSql();
  if (!sql) return null;

  const rows = await sql`
    SELECT s.id AS session_id, u.id, u.username, u.display_name
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.admin_user_id
    WHERE s.token_hash = ${hashToken(token)}
      AND s.revoked_at IS NULL
      AND s.expires_at > now()
      AND u.is_active = true
    LIMIT 1
  `;
  const row = rows[0] as
    | { session_id: string; id: string; username: string; display_name: string | null }
    | undefined;
  if (!row) return null;
  return {
    sessionId: row.session_id,
    admin: { id: row.id, username: row.username, displayName: row.display_name },
  };
}

export async function listAdminSessions(
  adminUserId: string,
  currentSessionId: string | null,
): Promise<AdminSessionInfo[]> {
  const rows = await requireSql()`
    SELECT id, created_at, expires_at, user_agent, ip_address
    FROM admin_sessions
    WHERE admin_user_id = ${adminUserId} AND revoked_at IS NULL AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 20
  `;
  return rows.map((row) => {
    const s = row as {
      id: string;
      created_at: string;
      expires_at: string;
      user_agent: string | null;
      ip_address: string | null;
    };
    return {
      id: s.id,
      createdAt: new Date(s.created_at).toISOString(),
      expiresAt: new Date(s.expires_at).toISOString(),
      userAgent: s.user_agent,
      ipAddress: s.ip_address,
      current: s.id === currentSessionId,
    };
  });
}

export async function revokeOtherSessions(adminUserId: string, keepSessionId: string | null): Promise<number> {
  const rows = await requireSql()`
    UPDATE admin_sessions SET revoked_at = now()
    WHERE admin_user_id = ${adminUserId}
      AND revoked_at IS NULL
      AND (${keepSessionId}::uuid IS NULL OR id <> ${keepSessionId}::uuid)
    RETURNING id
  `;
  return rows.length;
}

export async function updateAdminPassword(adminUserId: string, newPassword: string): Promise<void> {
  await requireSql()`
    UPDATE admin_users SET password_hash = ${hashSecret(newPassword)}, updated_at = now()
    WHERE id = ${adminUserId}
  `;
}

export async function updateAdminProfile(
  adminUserId: string,
  patch: { username: string; displayName: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const sql = requireSql();
  const clash = await sql`
    SELECT 1 FROM admin_users WHERE lower(username) = lower(${patch.username}) AND id <> ${adminUserId} LIMIT 1
  `;
  if (clash.length > 0) return { ok: false, error: "That username is already taken." };

  await sql`
    UPDATE admin_users
    SET username = ${patch.username}, display_name = ${patch.displayName}, updated_at = now()
    WHERE id = ${adminUserId}
  `;
  return { ok: true };
}

export async function updateGatePhrase(phrase: string): Promise<void> {
  await requireSql()`
    INSERT INTO auth_config (id, gate_phrase_hash)
    VALUES ('default', ${hashSecret(phrase.trim())})
    ON CONFLICT (id) DO UPDATE SET gate_phrase_hash = EXCLUDED.gate_phrase_hash, updated_at = now()
  `;
}
