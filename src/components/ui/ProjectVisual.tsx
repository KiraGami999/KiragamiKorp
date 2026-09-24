import Image from "next/image";
import type { Project, ProjectCategory } from "@/types";
import { cn } from "@/lib/utils/cn";

const patternByCategory: Record<ProjectCategory, string> = {
  Mobile:
    "repeating-linear-gradient(45deg, var(--color-ink) 0px, var(--color-ink) 2px, transparent 2px, transparent 16px)",
  Web: "repeating-linear-gradient(90deg, var(--color-ink) 0px, var(--color-ink) 2px, transparent 2px, transparent 16px)",
  "AI & Automation":
    "repeating-linear-gradient(0deg, var(--color-ink) 0px, var(--color-ink) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(90deg, var(--color-ink) 0px, var(--color-ink) 1px, transparent 1px, transparent 12px)",
};

/**
 * Uses the project's cover image when one is uploaded; otherwise falls back
 * to a generated geometric pattern per discipline (no stock screenshots).
 */
export function ProjectVisual({ project, className }: { project: Project; className?: string }) {
  const cover = project.images?.[0];

  return (
    <div
      className={cn(
        "relative flex aspect-[4/5] w-full items-end overflow-hidden border-2 border-ink bg-acid",
        className,
      )}
    >
      {cover ? (
        <Image
          src={`/api/media/${cover.id}`}
          alt={cover.alt || `${project.title} cover`}
          fill
          unoptimized
          sizes="(min-width: 1024px) 24vw, (min-width: 640px) 70vw, 100vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: patternByCategory[project.category] }}
        />
      )}
      <span className="relative z-10 w-full bg-ink px-4 py-3 font-display text-5xl leading-none text-acid sm:text-6xl">
        {project.index}
      </span>
    </div>
  );
}
