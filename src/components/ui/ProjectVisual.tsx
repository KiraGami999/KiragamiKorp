import type { Project, ProjectCategory } from "@/types";

const patternByCategory: Record<ProjectCategory, string> = {
  Mobile:
    "repeating-linear-gradient(45deg, var(--color-ink) 0px, var(--color-ink) 2px, transparent 2px, transparent 16px)",
  Web: "repeating-linear-gradient(90deg, var(--color-ink) 0px, var(--color-ink) 2px, transparent 2px, transparent 16px)",
  "AI & Automation":
    "repeating-linear-gradient(0deg, var(--color-ink) 0px, var(--color-ink) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(90deg, var(--color-ink) 0px, var(--color-ink) 1px, transparent 1px, transparent 12px)",
};

/**
 * A generated geometric pattern standing in for project cover art — keeps
 * the "Work" section honest (no stock/fake screenshots) while staying
 * visually distinct per discipline.
 */
export function ProjectVisual({ project }: { project: Project }) {
  return (
    <div className="relative flex aspect-[4/5] w-full items-end overflow-hidden border-2 border-ink bg-acid">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: patternByCategory[project.category] }}
      />
      <span className="relative z-10 w-full bg-ink px-4 py-3 font-display text-5xl leading-none text-acid sm:text-6xl">
        {project.index}
      </span>
    </div>
  );
}
