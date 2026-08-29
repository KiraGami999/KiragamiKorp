import { ArrowUpRight } from "lucide-react";
import type { Project } from "@/types";
import { ProjectVisual } from "@/components/ui/ProjectVisual";
import { cn } from "@/lib/utils/cn";

export function ProjectCard({ project, className }: { project: Project; className?: string }) {
  const content = (
    <>
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-paper/50">
        <span>{project.category}</span>
        <span>{project.year}</span>
      </div>
      <h3 className="mt-2 flex items-center gap-2 font-display text-3xl uppercase tracking-tight text-paper sm:text-4xl">
        {project.title}
        {project.href ? (
          <ArrowUpRight
            className="h-6 w-6 text-acid transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
            aria-hidden
          />
        ) : null}
      </h3>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/70">{project.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li
            key={tag}
            className="border border-paper/25 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-paper/60"
          >
            {tag}
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <article className={cn("flex flex-col gap-6", className)}>
      <ProjectVisual project={project} />
      {project.href ? (
        <a href={project.href} target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
          {content}
        </a>
      ) : (
        <div className="group">{content}</div>
      )}
    </article>
  );
}
