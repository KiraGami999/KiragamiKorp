import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import { getClientKey } from "@/lib/automation/rate-limit";
import { deleteMedia, isMediaId } from "@/lib/media";

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: RouteContext<"/api/admin/media/[id]">) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  const { id } = await params;
  if (!isMediaId(id)) {
    return NextResponse.json({ error: "Invalid image id." }, { status: 400 });
  }

  await deleteMedia(id);
  await logAudit("media_deleted", { id }, getClientKey(request));
  return NextResponse.json({ ok: true });
}
