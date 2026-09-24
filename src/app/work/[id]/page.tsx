import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Code2 } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { getProjectById } from "@/lib/content/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/work/[id]">): Promise<Metadata> {
  const { id } = await params;
  const found = await getProjectById(id);
  if (!found) return { title: "Project not found" };

  const { project } = found;
  const cover = project.images?.[0];
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: `${project.title} — KiragamiKorp`,
      description: project.summary,
      ...(cover ? { images: [{ url: `/api/media/${cover.id}`, alt: cover.alt || project.title }] } : {}),
    },
  };
}

function paragraphs(text: string | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default async function ProjectPage({ params }: PageProps<"/work/[id]">) {
  const { id } = await params;
  const found = await getProjectById(id);
  if (!found) notFound();

  const { project, next } = found;
  const [cover, ...gallery] = project.images ?? [];
  const body = paragraphs(project.description);
  const facts = [
    { label: "Category", value: project.category },
    { label: "Year", value: project.year },
    ...(project.role ? [{ label: "Role", value: project.role }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-acid text-ink">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
          <Logo />
          <nav aria-label="Project" className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.2em]">
            <Link href="/#work" className="inline-flex items-center gap-2 hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              All work
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="bg-ink text-paper">
        <section className="grain-overlay border-b-2 border-acid">
          <div className="mx-auto grid max-w-[1600px] gap-10 px-6 py-16 sm:px-10 lg:grid-cols-12 lg:gap-12 lg:px-16 lg:py-24">
            <div className="lg:col-span-7">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">
                LOG.03 — CASE {project.index}
              </p>
              <h1 className="mt-6 font-display text-[16vw] uppercase leading-[0.86] tracking-tight text-paper sm:text-[10vw] lg:text-[6.5vw]">
                {project.title}
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-paper/75 sm:text-xl">{project.summary}</p>

              <dl className="mt-10 grid max-w-xl grid-cols-2 gap-6 border-t-2 border-paper/10 pt-8 sm:grid-cols-3">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-paper/45">{fact.label}</dt>
                    <dd className="mt-2 font-mono text-sm uppercase tracking-widest text-paper">{fact.value}</dd>
                  </div>
                ))}
              </dl>

              {project.href || project.repoUrl ? (
                <div className="mt-10 flex flex-wrap gap-4">
                  {project.href ? (
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border-2 border-acid bg-acid px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-transparent hover:text-acid"
                    >
                      Visit live
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </a>
                  ) : null}
                  {project.repoUrl ? (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border-2 border-paper/40 px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-paper transition-colors hover:border-acid hover:text-acid"
                    >
                      <Code2 className="h-4 w-4" aria-hidden />
                      Source
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="lg:col-span-5">
              {cover ? (
                <div className="relative overflow-hidden border-2 border-acid shadow-[10px_10px_0_0_var(--color-acid)]">
                  <Image
                    src={`/api/media/${cover.id}`}
                    alt={cover.alt || `${project.title} cover`}
                    width={cover.width ?? 1600}
                    height={cover.height ?? 1200}
                    unoptimized
                    priority
                    className="h-auto w-full"
                  />
                </div>
              ) : (
                <ProjectVisual project={project} className="shadow-[10px_10px_0_0_var(--color-acid)]" />
              )}
            </div>
          </div>
        </section>

        <section className="bg-paper text-ink">
          <div className="mx-auto grid max-w-[1600px] gap-12 px-6 py-16 sm:px-10 lg:grid-cols-12 lg:px-16 lg:py-24">
            <aside className="lg:col-span-4">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-ink/55">Stack &amp; languages</h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <li
                    key={tag}
                    className="border-2 border-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </aside>

            <div className="lg:col-span-8">
              <h2 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-5xl">The build</h2>
              {body.length ? (
                <div className="mt-8 max-w-2xl space-y-5 text-lg leading-relaxed text-ink/80">
                  {body.map((block, index) => (
                    <p key={index} className="whitespace-pre-line">
                      {block}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/60">{project.summary}</p>
              )}
            </div>
          </div>
        </section>

        {gallery.length ? (
          <section aria-label="Gallery" className="border-t-2 border-ink bg-paper text-ink">
            <div className="mx-auto max-w-[1600px] px-6 pb-20 sm:px-10 lg:px-16">
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-ink/55 pt-12">Gallery</h2>
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {gallery.map((image, index) => (
                  <figure
                    key={image.id}
                    className={index % 3 === 0 && gallery.length > 1 ? "sm:col-span-2" : undefined}
                  >
                    <div className="overflow-hidden border-2 border-ink bg-ink">
                      <Image
                        src={`/api/media/${image.id}`}
                        alt={image.alt || `${project.title} screenshot ${index + 2}`}
                        width={image.width ?? 1600}
                        height={image.height ?? 1000}
                        unoptimized
                        loading="lazy"
                        className="h-auto w-full"
                      />
                    </div>
                    {image.alt ? (
                      <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink/55">
                        {image.alt}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {next ? (
          <Link
            href={`/work/${next.id}`}
            className="group block border-t-2 border-acid bg-ink px-6 py-16 text-paper sm:px-10 lg:px-16"
          >
            <div className="mx-auto flex max-w-[1600px] items-end justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-acid">Next case</p>
                <p className="mt-3 font-display text-5xl uppercase leading-none tracking-tight sm:text-7xl">
                  {next.title}
                </p>
              </div>
              <ArrowRight
                className="h-10 w-10 shrink-0 text-acid transition-transform group-hover:translate-x-2 motion-reduce:transition-none"
                aria-hidden
              />
            </div>
          </Link>
        ) : null}
      </main>
    </>
  );
}
