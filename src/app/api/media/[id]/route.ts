import { readMedia } from "@/lib/media";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: RouteContext<"/api/media/[id]">) {
  const { id } = await params;
  const media = await readMedia(id);

  if (!media) {
    return new Response("Not found", { status: 404 });
  }

  // Assets are never edited in place (replacing an image uploads a new id).
  return new Response(new Uint8Array(media.bytes), {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
