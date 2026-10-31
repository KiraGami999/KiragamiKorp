/**
 * YouTube helpers shared by the server (validation) and the browser (admin preview, player).
 * Videos are never stored by this site, only the 11-character YouTube id.
 */

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export const MAX_VIDEOS_PER_PROJECT = 12;
/** A complete series; the admin nudges towards this but never enforces it. */
export const RECOMMENDED_EPISODES = 5;

export function isVideoId(value: string): boolean {
  return VIDEO_ID.test(value);
}

/**
 * Accepts a bare id or any common YouTube link (watch, youtu.be, embed, shorts, live)
 * and returns the 11-character id, or null when it is not a YouTube video.
 */
export function parseYouTubeId(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  if (isVideoId(text)) return text;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "").toLowerCase();
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v");
    } else {
      const [, kind, id] = url.pathname.split("/");
      if (kind === "embed" || kind === "shorts" || kind === "live" || kind === "v") candidate = id ?? null;
    }
  }

  return candidate && isVideoId(candidate) ? candidate : null;
}

export function youTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/** Privacy-enhanced embed: sets no cookies until the visitor presses play. */
export function youTubeEmbedUrl(videoId: string, autoplay = true): string {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
