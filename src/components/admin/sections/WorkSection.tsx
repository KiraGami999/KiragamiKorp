"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Copy, ExternalLink, ImageOff, Plus, Trash2 } from "lucide-react";
import { ImageManager } from "@/components/admin/ImageManager";
import { TagInput } from "@/components/admin/TagInput";
import { Button, Field, Panel, SelectField, Toggle } from "@/components/admin/ui";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { cn } from "@/lib/utils/cn";
import type { Project, ProjectCategory } from "@/types";

const CATEGORY_OPTIONS: { value: ProjectCategory; label: string }[] = [
  { value: "Mobile", label: "Mobile" },
  { value: "Web", label: "Web" },
  { value: "AI & Automation", label: "AI & Automation" },
];

export const NEW_PROJECT_PREFIX = "new-";

export function createProject(position: number): Project {
  return {
    id: `${NEW_PROJECT_PREFIX}${crypto.randomUUID().slice(0, 8)}`,
    index: String(position).padStart(2, "0"),
    title: "Untitled project",
    category: "Web",
    year: String(new Date().getFullYear()),
    summary: "",
    tags: [],
    description: "",
    images: [],
    published: false,
  };
}

export function WorkSection({
  projects,
  selectedId,
  onSelect,
  onChange,
  savedIds,
}: {
  projects: Project[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (projects: Project[]) => void;
  /** Ids that exist on the server — only those have a live case-study URL. */
  savedIds: Set<string>;
}) {
  const selectedIndex = Math.max(
    0,
    projects.findIndex((project) => project.id === selectedId),
  );
  const selected = projects[selectedIndex];

  function patch(update: Partial<Project>) {
    onChange(projects.map((project, i) => (i === selectedIndex ? { ...project, ...update } : project)));
  }

  function add() {
    const project = createProject(projects.length + 1);
    onChange([...projects, project]);
    onSelect(project.id);
  }

  function duplicate() {
    if (!selected) return;
    const copy: Project = {
      ...selected,
      id: `${NEW_PROJECT_PREFIX}${crypto.randomUUID().slice(0, 8)}`,
      title: `${selected.title} copy`,
      published: false,
    };
    const next = [...projects];
    next.splice(selectedIndex + 1, 0, copy);
    onChange(next);
    onSelect(copy.id);
  }

  function remove() {
    if (!selected) return;
    if (!window.confirm(`Delete "${selected.title}"? It disappears from the site when you save.`)) return;
    const next = projects.filter((_, i) => i !== selectedIndex);
    onChange(next);
    const fallback = next[Math.min(selectedIndex, next.length - 1)];
    if (fallback) onSelect(fallback.id);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= projects.length) return;
    const next = [...projects];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  const liveCount = projects.filter((project) => project.published !== false).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/55">
            {projects.length} projects · {liveCount} live
          </p>
          <Button variant="primary" onClick={add} className="px-3 py-1.5">
            <Plus className="h-3.5 w-3.5" aria-hidden /> New
          </Button>
        </div>
        <ol className="space-y-2">
          {projects.map((project, index) => {
            const cover = project.images?.[0];
            const active = index === selectedIndex;
            return (
              <li key={project.id}>
                <div
                  className={cn(
                    "flex items-stretch border-2 border-ink transition-colors",
                    active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-acid/25",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(project.id)}
                    aria-current={active ? "true" : undefined}
                    className="flex min-w-0 flex-1 items-center gap-3 p-2 text-left"
                  >
                    <span className="relative h-11 w-14 shrink-0 overflow-hidden border border-current/30 bg-ink/10">
                      {cover ? (
                        <Image src={`/api/media/${cover.id}`} alt="" fill unoptimized sizes="56px" className="object-cover" />
                      ) : (
                        <ImageOff className="absolute inset-0 m-auto h-4 w-4 opacity-40" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-lg uppercase leading-tight">
                        {project.title || "Untitled"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] opacity-60">
                        {String(index + 1).padStart(2, "0")} · {project.category}
                        {project.published === false ? (
                          <span className={cn("px-1", active ? "bg-acid text-ink" : "bg-ink text-acid")}>Draft</span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                  <span className="flex flex-col border-l-2 border-current/20">
                    <button
                      type="button"
                      aria-label={`Move ${project.title} up`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="flex flex-1 items-center px-1.5 opacity-60 hover:opacity-100 disabled:opacity-15"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${project.title} down`}
                      disabled={index === projects.length - 1}
                      onClick={() => move(index, 1)}
                      className="flex flex-1 items-center px-1.5 opacity-60 hover:opacity-100 disabled:opacity-15"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
        {!projects.length ? (
          <p className="border-2 border-dashed border-ink/40 p-4 text-sm text-ink/60">
            No projects yet. Add your first case study.
          </p>
        ) : null}
      </aside>

      {selected ? (
        <div className="min-w-0 space-y-6">
          <Panel
            title={selected.title || "Untitled project"}
            description={
              savedIds.has(selected.id) ? (
                <>
                  Case study lives at{" "}
                  <span className="font-mono text-ink">/work/{selected.id}</span>
                </>
              ) : (
                "New project — the URL is generated from the title when you save."
              )
            }
            actions={
              <>
                {savedIds.has(selected.id) ? (
                  <Link
                    href={`/work/${selected.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 border-2 border-ink px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-acid"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden /> View
                  </Link>
                ) : null}
                <Button onClick={duplicate}>
                  <Copy className="h-3.5 w-3.5" aria-hidden /> Duplicate
                </Button>
                <Button variant="danger" onClick={remove}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
                </Button>
              </>
            }
          >
            <div className="space-y-5">
              <Toggle
                label="Published"
                description="Drafts are saved but hidden from Selected Work, case-study pages and the sitemap."
                checked={selected.published !== false}
                onChange={(published) => patch({ published })}
              />
              <Field label="Title" value={selected.title} maxLength={80} onChange={(title) => patch({ title })} />
              <div className="grid gap-4 sm:grid-cols-3">
                <SelectField
                  label="Category"
                  value={selected.category}
                  options={CATEGORY_OPTIONS}
                  onChange={(category) => patch({ category })}
                />
                <Field label="Year" value={selected.year} maxLength={12} onChange={(year) => patch({ year })} />
                <Field
                  label="Your role"
                  value={selected.role ?? ""}
                  maxLength={80}
                  placeholder="Design & engineering"
                  onChange={(role) => patch({ role })}
                />
              </div>
              <Field
                label="Card summary"
                value={selected.summary}
                multiline
                rows={3}
                maxLength={220}
                hint="The one-liner on the Selected Work card. Aim for one or two sentences."
                onChange={(summary) => patch({ summary })}
              />
              <TagInput
                label="Stack & languages"
                tags={selected.tags}
                onChange={(tags) => patch({ tags })}
              />
            </div>
          </Panel>

          <Panel
            title="Images"
            description="Screenshots, mockups and diagrams. The first image is the card cover and the case-study hero; the rest form the gallery."
          >
            <ImageManager
              images={selected.images ?? []}
              projectTitle={selected.title}
              onChange={(images) => patch({ images })}
            />
          </Panel>

          <Panel title="Case study" description="Long-form story shown on the project page. Leave a blank line between paragraphs.">
            <div className="space-y-5">
              <Field
                label="Description"
                value={selected.description ?? ""}
                multiline
                rows={10}
                maxLength={6000}
                placeholder={"The problem…\n\nWhat I built…\n\nThe outcome…"}
                onChange={(description) => patch({ description })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Live URL"
                  type="url"
                  value={selected.href ?? ""}
                  placeholder="https://"
                  onChange={(href) => patch({ href })}
                />
                <Field
                  label="Source / repo URL"
                  type="url"
                  value={selected.repoUrl ?? ""}
                  placeholder="https://github.com/…"
                  onChange={(repoUrl) => patch({ repoUrl })}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Card preview" description="Exactly how the card renders in the Selected Work rail.">
            <div className="pointer-events-none bg-ink p-6 sm:p-8" aria-hidden inert>
              <ProjectCard project={selected} className="max-w-md" />
            </div>
          </Panel>
        </div>
      ) : (
        <Panel title="Selected work" description="Add a project to start building your case studies.">
          <Button variant="primary" onClick={add}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add project
          </Button>
        </Panel>
      )}
    </div>
  );
}
