import { NextResponse } from "next/server";
import { guardAdmin } from "@/lib/admin/api";
import { isVideoId, youTubeWatchUrl } from "@/lib/video";

export const runtime = "nodejs";

/**
 * Looks a video up on YouTube's public oEmbed endpoint so the admin can prefill the title and
 * confirm the video exists and is embeddable before it goes on the site. The URL is built here
 * from a validated 11-character id, so nothing user-supplied is ever fetched.
 */
export async function GET(request: Request) {
  const guard = await guardAdmin();
  if (guard.response) return guard.response;

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!isVideoId(id)) return NextResponse.json({ error: "That is not a valid YouTube video id." }, { status: 400 });

  try {
    const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youTubeWatchUrl(id))}`;
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(6_000), cache: "no-store" });

    // YouTube answers 400 for ids it has never issued and 404 for deleted videos.
    if (response.status === 404 || response.status === 400) {
      return NextResponse.json({ error: "YouTube could not find that video. Check the link." }, { status: 404 });
    }
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: "That video is private or has embedding switched off. Set it to Public or Unlisted and allow embedding." },
        { status: 422 },
      );
    }
    if (!response.ok) {
      return NextResponse.json({ error: `YouTube returned ${response.status}.` }, { status: 502 });
    }

    const data = (await response.json()) as { title?: string; author_name?: string };
    return NextResponse.json({
      meta: {
        title: typeof data.title === "string" ? data.title.slice(0, 120) : "",
        author: typeof data.author_name === "string" ? data.author_name.slice(0, 80) : "",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach YouTube to check the video." }, { status: 502 });
  }
}
