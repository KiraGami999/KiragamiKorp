import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/api";
import { logAudit } from "@/lib/admin/audit";
import { getClientKey } from "@/lib/automation/rate-limit";
import { MAX_MEDIA_BYTES, isAllowedMediaType, mediaUrl, saveMedia } from "@/lib/media";

export const runtime = "nodejs";

function readDimension(value: FormDataEntryValue | null): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 20_000 ? parsed : undefined;
}

export async function POST(request: Request) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (!isAllowedMediaType(file.type)) {
    return NextResponse.json({ error: "Use a WebP, JPEG, PNG, AVIF or GIF image." }, { status: 415 });
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return NextResponse.json({ error: "Image is larger than 4 MB after compression." }, { status: 413 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const width = readDimension(form.get("width"));
    const height = readDimension(form.get("height"));
    const saved = await saveMedia({
      bytes,
      mimeType: file.type,
      width,
      height,
      originalName: file.name,
    });
    await logAudit("media_uploaded", { id: saved.id, bytes: saved.sizeBytes }, getClientKey(request));

    return NextResponse.json({
      image: { id: saved.id, url: mediaUrl(saved.id), width, height, sizeBytes: saved.sizeBytes },
    });
  } catch (error) {
    console.error("[admin/media] upload failed:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
