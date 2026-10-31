"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import { youTubeEmbedUrl, youTubeThumbnail, youTubeWatchUrl } from "@/lib/video";
import { cn } from "@/lib/utils/cn";
import type { ProjectVideo } from "@/types";

/**
 * Click-to-load YouTube player. Until someone presses play only a small thumbnail is fetched, so the
 * page stays light on slow or metered connections, and the privacy-enhanced domain sets no cookies.
 */
export function EpisodePlayer({ videos, projectTitle }: { videos: ProjectVideo[]; projectTitle: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const current = videos[Math.min(index, videos.length - 1)];
  if (!current) return null;
  const notes = current.notes?.trim();

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="min-w-0 lg:col-span-8">
        <div className="relative aspect-video w-full overflow-hidden border-2 border-ink bg-ink shadow-[10px_10px_0_0_var(--color-ink)]">
          {playing ? (
            <iframe
              key={current.videoId}
              src={youTubeEmbedUrl(current.videoId)}
              title={`${projectTitle} — ${current.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Play episode ${index + 1}: ${current.title}`}
              className="group absolute inset-0 block h-full w-full text-left"
            >
              <Image
                src={youTubeThumbnail(current.videoId)}
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <span className="absolute left-0 top-0 bg-acid px-3 py-1 font-display text-2xl leading-none text-ink">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 border-ink bg-acid text-ink transition-transform group-hover:scale-110 motion-reduce:transition-none sm:h-24 sm:w-24"
              >
                <Play className="h-9 w-9 fill-current" />
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4 font-mono text-[10px] uppercase tracking-[0.25em] text-paper/80 sm:p-5">
                Press play · nothing loads until you do
              </span>
            </button>
          )}
        </div>

        <div className="mt-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/55">
            Episode {String(index + 1).padStart(2, "0")} of {String(videos.length).padStart(2, "0")}
          </p>
          <h3 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-5xl">
            {current.title}
          </h3>
          {current.summary ? (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/75">{current.summary}</p>
          ) : null}
          <a
            href={youTubeWatchUrl(current.videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 border-2 border-ink px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-acid"
          >
            Watch on YouTube
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>

          {notes ? (
            <details className="group mt-6 max-w-2xl border-2 border-ink bg-paper">
              <summary className="cursor-pointer list-none px-4 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink marker:hidden">
                <span className="group-open:hidden">Show chapters &amp; notes +</span>
                <span className="hidden group-open:inline">Hide chapters &amp; notes −</span>
              </summary>
              <div className="whitespace-pre-line border-t-2 border-ink px-4 py-4 font-mono text-sm leading-relaxed text-ink/80">
                {notes}
              </div>
            </details>
          ) : null}
        </div>
      </div>

      <div className="lg:col-span-4">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-ink/60">Playlist</p>
        <ol className="space-y-3">
          {videos.map((video, i) => {
            const active = i === index;
            return (
              <li key={video.id}>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-stretch gap-4 border-2 border-ink p-3 text-left transition-colors",
                    active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-ink/10",
                  )}
                >
                  <span
                    className={cn(
                      "font-display text-4xl leading-none",
                      active ? "text-acid" : "text-ink/35",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-xl uppercase leading-tight tracking-tight">
                      {video.title}
                    </span>
                    {video.summary ? (
                      <span
                        className={cn(
                          "mt-1 line-clamp-2 block text-sm leading-snug",
                          active ? "text-paper/65" : "text-ink/60",
                        )}
                      >
                        {video.summary}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
