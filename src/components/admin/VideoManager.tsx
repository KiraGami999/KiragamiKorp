"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { Button, Field, Notice } from "@/components/admin/ui";
import {
  MAX_VIDEOS_PER_PROJECT,
  RECOMMENDED_EPISODES,
  parseYouTubeId,
  youTubeThumbnail,
  youTubeWatchUrl,
} from "@/lib/video";
import { cn } from "@/lib/utils/cn";
import type { ProjectVideo } from "@/types";

/** Placeholder titles that sketch a complete five-episode series. */
const EPISODE_TEMPLATE = [
  "The problem and the brief",
  "Prompting the design",
  "Building the core",
  "When the AI got it wrong",
  "Shipping and measuring",
];

type Status = { tone: "error" | "info"; message: string } | null;

export function VideoManager({
  videos,
  onChange,
}: {
  videos: ProjectVideo[];
  onChange: (videos: ProjectVideo[]) => void;
}) {
  const [link, setLink] = useState("");
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  // The lookup is async; a ref keeps the append from overwriting edits made while waiting.
  const videosRef = useRef(videos);
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  const full = videos.length >= MAX_VIDEOS_PER_PROJECT;

  async function add() {
    const videoId = parseYouTubeId(link);
    if (!videoId) {
      setStatus({ tone: "error", message: "That doesn't look like a YouTube link. Paste the video URL from the share button." });
      return;
    }
    if (videosRef.current.some((video) => video.videoId === videoId)) {
      setStatus({ tone: "error", message: "That video is already in this series." });
      return;
    }

    setChecking(true);
    setStatus(null);
    let title = "";
    let warning: string | null = null;

    try {
      const response = await fetch(`/api/admin/video-meta?id=${videoId}`);
      const data = (await response.json().catch(() => ({}))) as { meta?: { title?: string }; error?: string };
      if (response.ok) {
        title = data.meta?.title ?? "";
      } else if (response.status === 404 || response.status === 422 || response.status === 400) {
        setStatus({ tone: "error", message: data.error ?? "YouTube won't allow that video." });
        setChecking(false);
        return;
      } else {
        warning = "Added, but YouTube could not be reached to check it. Make sure it plays on the page.";
      }
    } catch {
      warning = "Added, but YouTube could not be reached to check it. Make sure it plays on the page.";
    }

    const next = [
      ...videosRef.current,
      { id: `ep-${crypto.randomUUID().slice(0, 8)}`, videoId, title: title || `Episode ${videosRef.current.length + 1}` },
    ];
    videosRef.current = next;
    onChange(next);
    setLink("");
    setChecking(false);
    setStatus(warning ? { tone: "info", message: warning } : null);
  }

  function update(index: number, patch: Partial<ProjectVideo>) {
    onChange(videos.map((video, i) => (i === index ? { ...video, ...patch } : video)));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= videos.length) return;
    const next = [...videos];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    const video = videos[index];
    if (!window.confirm(`Remove "${video.title}" from this series? The YouTube video itself is not touched.`)) return;
    onChange(videos.filter((_, i) => i !== index));
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void add();
    }
  }

  const filled = Math.min(videos.length, RECOMMENDED_EPISODES);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">
            {videos.length} / {RECOMMENDED_EPISODES} episodes
            {videos.length > RECOMMENDED_EPISODES ? ` (+${videos.length - RECOMMENDED_EPISODES} bonus)` : ""}
          </p>
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: RECOMMENDED_EPISODES }, (_, i) => (
              <span key={i} className={cn("h-2 w-8 border border-ink", i < filled ? "bg-acid" : "bg-paper")} />
            ))}
          </div>
        </div>
        {videos.length < RECOMMENDED_EPISODES ? (
          <p className="mt-2 text-sm text-ink/55">
            A full series is five episodes: {EPISODE_TEMPLATE.map((name, i) => `${i + 1}. ${name}`).join(" · ")}.
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="video-link"
          className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55"
        >
          Add an episode
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="video-link"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            onKeyDown={handleKey}
            disabled={full || checking}
            placeholder={full ? `Limit of ${MAX_VIDEOS_PER_PROJECT} episodes reached` : "https://youtu.be/… or https://www.youtube.com/watch?v=…"}
            className="w-full border-2 border-ink bg-paper px-3 py-2 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:bg-acid/15 disabled:opacity-50"
          />
          <Button variant="primary" onClick={() => void add()} disabled={!link.trim() || full || checking} className="shrink-0">
            {checking ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
            {checking ? "Checking…" : "Add"}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-ink/50">
          Upload the video to YouTube first (Public or Unlisted, embedding on), then paste its link. Only the link is stored,
          so videos cost nothing and never touch your database.
        </p>
        {status ? (
          <div className="mt-3">
            <Notice tone={status.tone}>{status.message}</Notice>
          </div>
        ) : null}
      </div>

      {videos.length ? (
        <ol className="space-y-3">
          {videos.map((video, index) => (
            <li key={video.id} className="border-2 border-ink bg-paper">
              <div className="flex flex-col gap-4 p-3 sm:flex-row sm:p-4">
                <div className="sm:w-48 sm:shrink-0">
                  <div className="relative aspect-video w-full overflow-hidden border-2 border-ink bg-ink">
                    <Image
                      src={youTubeThumbnail(video.videoId)}
                      alt=""
                      fill
                      unoptimized
                      sizes="192px"
                      className="object-cover"
                    />
                    <span className="absolute left-0 top-0 bg-acid px-2 py-0.5 font-display text-lg leading-none text-ink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="flex">
                      <button
                        type="button"
                        aria-label={`Move episode ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="border-2 border-ink p-1.5 transition-colors hover:bg-ink hover:text-acid disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-ink"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move episode ${index + 1} down`}
                        disabled={index === videos.length - 1}
                        onClick={() => move(index, 1)}
                        className="-ml-0.5 border-2 border-ink p-1.5 transition-colors hover:bg-ink hover:text-acid disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-ink"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </span>
                    <span className="flex items-center gap-1">
                      <a
                        href={youTubeWatchUrl(video.videoId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open episode ${index + 1} on YouTube`}
                        className="border-2 border-ink p-1.5 transition-colors hover:bg-ink hover:text-acid"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        aria-label={`Remove episode ${index + 1}`}
                        onClick={() => remove(index)}
                        className="border-2 border-ink p-1.5 transition-colors hover:border-[#b3261e] hover:bg-[#b3261e] hover:text-paper"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <Field
                    label="Episode title"
                    value={video.title}
                    maxLength={120}
                    placeholder={EPISODE_TEMPLATE[index] ?? `Episode ${index + 1}`}
                    onChange={(title) => update(index, { title })}
                  />
                  <Field
                    label="One-line summary"
                    value={video.summary ?? ""}
                    maxLength={300}
                    placeholder="What the viewer will be able to do after watching."
                    onChange={(summary) => update(index, { summary })}
                  />
                  <Field
                    label="Chapters, links or transcript"
                    value={video.notes ?? ""}
                    multiline
                    rows={4}
                    maxLength={8000}
                    placeholder={"0:00 Intro\n2:10 The prompt\n6:45 Fixing the bug"}
                    hint="Optional. Shown under the player, so people on slow data can read instead of watch."
                    onChange={(notes) => update(index, { notes })}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-2 border-dashed border-ink/40 p-4 text-sm text-ink/60">
          No episodes yet. Record your first one, upload it to YouTube and paste the link above.
        </p>
      )}
    </div>
  );
}
