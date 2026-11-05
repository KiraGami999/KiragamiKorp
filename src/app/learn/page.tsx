import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { EpisodePlayer } from "@/components/work/EpisodePlayer";
import { getSiteContent } from "@/lib/content/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Free video series on building apps, websites and business systems with AI, from everyday tasks to booking and scheduling automation.",
};

export default async function LearnPage() {
  const { site, projects } = await getSiteContent();
  const series = projects.filter((project) => project.videos?.length);
  const episodes = series.reduce((sum, project) => sum + (project.videos?.length ?? 0), 0);

  const subscribe = site.youtubeUrl ? (
    <a
      href={site.youtubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 border-2 border-acid bg-acid px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-transparent hover:text-acid"
    >
      <Play className="h-4 w-4 fill-current" aria-hidden />
      Subscribe on YouTube
    </a>
  ) : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-acid text-ink">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
          <Logo />
          <nav aria-label="Learn" className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.2em]">
            <Link href="/" className="inline-flex items-center gap-2 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="bg-ink text-paper">
        <section className="grain-overlay border-b-2 border-acid">
          <div className="mx-auto max-w-[1600px] px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">LOG.07 — The school</p>
            <h1 className="mt-6 font-display text-[16vw] uppercase leading-[0.86] tracking-tight sm:text-[10vw] lg:text-[7vw]">
              Learn to build
              <br />
              <span className="text-acid">with AI</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/75 sm:text-xl">
              Free lessons on using AI to build real things: from everyday tasks to the systems that run a business,
              like hotel booking automation and work schedule planners. Every series follows a real project, mistakes
              included.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              {subscribe}
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-paper/50">
                {series.length} series · {episodes}{" "}
                {episodes === 1 ? "episode" : "episodes"}
              </p>
            </div>
          </div>
        </section>

        {series.length ? (
          series.map((project, index) => (
            <section
              key={project.id}
              id={project.id}
              aria-labelledby={`${project.id}-title`}
              className={index % 2 === 0 ? "border-b-2 border-ink bg-acid text-ink" : "border-b-2 border-ink bg-paper text-ink"}
            >
              <div className="mx-auto max-w-[1600px] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-ink/60">
                      Series {String(index + 1).padStart(2, "0")} · {project.category}
                    </p>
                    <h2
                      id={`${project.id}-title`}
                      className="mt-4 font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-7xl"
                    >
                      {project.title}
                    </h2>
                    <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/75">{project.summary}</p>
                  </div>
                  <Link
                    href={`/work/${project.id}`}
                    className="inline-flex shrink-0 items-center gap-2 self-start border-2 border-ink px-5 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-acid lg:self-auto"
                  >
                    How AI built it
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
                <div className="mt-12">
                  <EpisodePlayer videos={project.videos ?? []} projectTitle={project.title} />
                </div>
              </div>
            </section>
          ))
        ) : (
          <section className="bg-paper text-ink">
            <div className="mx-auto max-w-[1600px] px-6 py-20 sm:px-10 lg:px-16">
              <h2 className="font-display text-5xl uppercase leading-none tracking-tight sm:text-6xl">
                First lessons are being recorded
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
                The first series lands here soon. Subscribe so you don&apos;t miss episode one.
              </p>
              {site.youtubeUrl ? (
                <a
                  href={site.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 border-2 border-ink bg-ink px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-acid transition-colors hover:bg-acid hover:text-ink"
                >
                  <Play className="h-4 w-4 fill-current" aria-hidden />
                  Subscribe on YouTube
                </a>
              ) : null}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
