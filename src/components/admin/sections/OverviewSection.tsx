"use client";

import { ArrowRight, CircleAlert, CircleCheck } from "lucide-react";
import { Panel, Stat } from "@/components/admin/ui";
import type { Project } from "@/types";
import type { SiteContent } from "@/types/content";
import type { AdminSectionId } from "@/components/admin/AdminShell";

interface Gap {
  projectId: string;
  title: string;
  issue: string;
}

function findGaps(projects: Project[]): Gap[] {
  const gaps: Gap[] = [];
  for (const project of projects) {
    const issues: string[] = [];
    if (!project.images?.length) issues.push("no cover image");
    if (!project.description?.trim()) issues.push("no case-study write-up");
    if (!project.tags.length) issues.push("no stack listed");
    if (!project.summary.trim()) issues.push("no card summary");
    if (project.images?.some((image) => !image.alt.trim())) issues.push("images missing alt text");
    if (issues.length) gaps.push({ projectId: project.id, title: project.title, issue: issues.join(", ") });
  }
  return gaps;
}

export function OverviewSection({
  content,
  displayName,
  onNavigate,
  onOpenProject,
}: {
  content: SiteContent;
  displayName: string;
  onNavigate: (section: AdminSectionId) => void;
  onOpenProject: (id: string) => void;
}) {
  const live = content.projects.filter((project) => project.published !== false);
  const drafts = content.projects.length - live.length;
  const images = content.projects.reduce((sum, project) => sum + (project.images?.length ?? 0), 0);
  const gaps = findGaps(content.projects);
  const stack = new Map<string, number>();
  for (const project of live) for (const tag of project.tags) stack.set(tag, (stack.get(tag) ?? 0) + 1);
  const topStack = [...stack.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="border-2 border-ink bg-ink p-6 text-paper sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">Clearance confirmed</p>
        <h2 className="mt-3 font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-6xl">
          Welcome back,
          <br />
          <span className="text-acid">{displayName}</span>
        </h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {(
            [
              ["work", "Edit selected work"],
              ["studio", "Studio controls"],
              ["security", "Security"],
              ["system", "System health"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="inline-flex items-center gap-2 border-2 border-paper/30 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-paper transition-colors hover:border-acid hover:bg-acid hover:text-ink"
            >
              {label} <ArrowRight className="h-3 w-3" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Live projects" value={live.length} hint={drafts ? `${drafts} draft${drafts > 1 ? "s" : ""}` : "No drafts"} />
        <Stat label="Images" value={images} hint="Across all projects" />
        <Stat label="Stack items" value={stack.size} hint="Unique technologies on live work" />
        <Stat label="Stats on site" value={content.stats.length} />
      </div>

      <Panel
        title="Content health"
        description="What would make your case studies land harder."
      >
        {gaps.length ? (
          <ul className="space-y-2">
            {gaps.map((gap) => (
              <li key={gap.projectId}>
                <button
                  type="button"
                  onClick={() => onOpenProject(gap.projectId)}
                  className="group flex w-full items-start gap-3 border-2 border-ink px-4 py-3 text-left transition-colors hover:bg-acid/25"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#b3261e]" aria-hidden />
                  <span className="flex-1">
                    <span className="block font-mono text-xs uppercase tracking-[0.16em] text-ink">{gap.title}</span>
                    <span className="text-sm text-ink/60">{gap.issue}</span>
                  </span>
                  <ArrowRight className="mt-0.5 h-4 w-4 text-ink/40 transition-transform group-hover:translate-x-1" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-ink">
            <CircleCheck className="h-4 w-4" aria-hidden /> Every project has a cover, write-up, stack and summary.
          </p>
        )}
      </Panel>

      {topStack.length ? (
        <Panel title="Your stack on show" description="How often each technology appears across live projects.">
          <ul className="flex flex-wrap gap-2">
            {topStack.map(([tag, count]) => (
              <li key={tag} className="border-2 border-ink px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink">
                {tag} <span className="text-ink/45">×{count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}
