import { getSql } from "@/lib/db";

export type AuditAction =
  | "login"
  | "login_failed"
  | "logout"
  | "content_saved"
  | "media_uploaded"
  | "media_deleted"
  | "password_changed"
  | "username_changed"
  | "gate_changed"
  | "sessions_revoked"
  | "studio_settings_saved"
  | "generations_cleared";

export interface AuditEntry {
  id: number;
  action: AuditAction;
  detail: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

/** Never throws — auditing must not break the action being audited. */
export async function logAudit(
  action: AuditAction,
  detail: Record<string, unknown> = {},
  ipAddress: string | null = null,
): Promise<void> {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO admin_audit_log (action, detail, ip_address)
      VALUES (${action}, ${JSON.stringify(detail)}::jsonb, ${ipAddress})
    `;
  } catch (error) {
    console.error("[audit] failed to write entry:", error);
  }
}

export async function listAudit(limit = 30): Promise<AuditEntry[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = await sql`
    SELECT id, action, detail, ip_address, created_at
    FROM admin_audit_log
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => {
    const entry = row as {
      id: string | number;
      action: AuditAction;
      detail: Record<string, unknown>;
      ip_address: string | null;
      created_at: string;
    };
    return {
      id: Number(entry.id),
      action: entry.action,
      detail: entry.detail,
      ipAddress: entry.ip_address,
      createdAt: new Date(entry.created_at).toISOString(),
    };
  });
}
