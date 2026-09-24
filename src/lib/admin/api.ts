import { NextResponse } from "next/server";
import { requireAdminSession, type AdminSession } from "@/lib/admin/auth";

type Guarded = { session: AdminSession; response?: never } | { session?: never; response: NextResponse };

export async function guardAdmin(): Promise<Guarded> {
  const session = await requireAdminSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  return { session };
}

export function requireDbAdmin(session: AdminSession): NextResponse | null {
  if (session.adminUserId) return null;
  return NextResponse.json(
    { error: "This action needs a database admin account. Run npm run db:seed first." },
    { status: 409 },
  );
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
