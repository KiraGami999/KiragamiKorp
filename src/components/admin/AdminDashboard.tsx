"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EditableSite, SiteContent, SiteContentRecord } from "@/types/content";
import type { Project, ProjectCategory, Stat } from "@/types";

const CATEGORIES: ProjectCategory[] = ["Mobile", "Web", "AI & Automation"];

interface AdminDashboardProps {
  initialContent: SiteContentRecord;
  username: string;
}

function emptyProject(index: number): Project {
  return {
    id: `project-${Date.now().toString(36)}`,
    index: String(index).padStart(2, "0"),
    title: "NEW PROJECT",
    category: "Web",
    year: String(new Date().getFullYear()),
    summary: "",
    tags: [],
  };
}

export function AdminDashboard({ initialContent, username }: AdminDashboardProps) {
  const router = useRouter();
  const [content, setContent] = useState<SiteContent>({
    site: initialContent.site,
    projects: initialContent.projects,
    stats: initialContent.stats,
  });
  const [updatedAt, setUpdatedAt] = useState(initialContent.updatedAt);
  const [tab, setTab] = useState<"site" | "projects" | "stats">("projects");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patchSite(patch: Partial<EditableSite>) {
    setContent((prev) => ({ ...prev, site: { ...prev.site, ...patch } }));
  }

  function updateProject(index: number, patch: Partial<Project>) {
    setContent((prev) => ({
      ...prev,
      projects: prev.projects.map((project, i) => (i === index ? { ...project, ...patch } : project)),
    }));
  }

  function updateStat(index: number, patch: Partial<Stat>) {
    setContent((prev) => ({
      ...prev,
      stats: prev.stats.map((stat, i) => (i === index ? { ...stat, ...patch } : stat)),
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = (await response.json()) as { error?: string; content?: SiteContentRecord };

      if (!response.ok || !data.content) {
        throw new Error(data.error ?? "Save failed.");
      }

      setContent({
        site: data.content.site,
        projects: data.content.projects,
        stats: data.content.stats,
      });
      setUpdatedAt(data.content.updatedAt);
      setMessage("Saved. Public site will show the new content.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
            Ops deck · {username}
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-tight text-ink">
            CONTENT CONTROL
          </h1>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/45">
            Last save: {updatedAt === new Date(0).toISOString() ? "never" : new Date(updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="border-2 border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-acid"
          >
            View site
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="border-2 border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink transition-colors hover:bg-ink hover:text-acid"
          >
            Log out
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="border-2 border-ink bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-acid transition-colors hover:bg-acid hover:text-ink disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      {message ? (
        <p role="status" className="mt-4 border-l-4 border-acid bg-ink px-3 py-2 font-mono text-xs text-paper">
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-4 border-l-4 border-ink bg-ink/5 px-3 py-2 font-mono text-xs text-ink">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Content sections">
        {(
          [
            ["projects", "Projects"],
            ["site", "Site details"],
            ["stats", "Stats"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={
              tab === id
                ? "border-2 border-ink bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-acid"
                : "border-2 border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink"
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        {tab === "site" ? (
          <div className="space-y-5 border-2 border-ink bg-paper p-5 sm:p-6">
            {(
              [
                ["name", "Studio name"],
                ["founder", "Founder"],
                ["role", "Role line"],
                ["email", "Email"],
                ["heroSubhead", "Hero subhead"],
                ["aboutEyebrow", "About eyebrow"],
                ["aboutBody", "About body"],
                ["aboutPhilosophy", "About philosophy"],
                ["contactEyebrow", "Contact eyebrow"],
                ["contactBody", "Contact body"],
              ] as const
            ).map(([key, label]) => (
              <Field
                key={key}
                label={label}
                value={content.site[key]}
                multiline={key.includes("Body") || key.includes("Subhead") || key.includes("philosophy") || key.includes("Philosophy")}
                onChange={(value) => patchSite({ [key]: value })}
              />
            ))}

            <Field
              label="Hero headline (one line per row)"
              value={content.site.heroHeadline.join("\n")}
              multiline
              onChange={(value) =>
                patchSite({
                  heroHeadline: value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
            <Field
              label="About heading (one line per row)"
              value={content.site.aboutHeading.join("\n")}
              multiline
              onChange={(value) =>
                patchSite({
                  aboutHeading: value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
            <Field
              label="Contact heading (one line per row)"
              value={content.site.contactHeading.join("\n")}
              multiline
              onChange={(value) =>
                patchSite({
                  contactHeading: value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
            <Field
              label="Disciplines (one per row)"
              value={content.site.disciplines.map((d) => d.label).join("\n")}
              multiline
              onChange={(value) =>
                patchSite({
                  disciplines: value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((label, index) => ({
                      id: content.site.disciplines[index]?.id ?? `discipline-${index + 1}`,
                      label,
                    })),
                })
              }
            />
          </div>
        ) : null}

        {tab === "projects" ? (
          <div className="space-y-6">
            {content.projects.map((project, index) => (
              <div key={project.id} className="space-y-4 border-2 border-ink bg-paper p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/50">
                    Project {String(index + 1).padStart(2, "0")}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setContent((prev) => ({
                        ...prev,
                        projects: prev.projects
                          .filter((_, i) => i !== index)
                          .map((p, i) => ({ ...p, index: String(i + 1).padStart(2, "0") })),
                      }))
                    }
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60 hover:text-ink"
                  >
                    Remove
                  </button>
                </div>

                <Field label="Title" value={project.title} onChange={(value) => updateProject(index, { title: value })} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">
                      Category
                    </span>
                    <select
                      value={project.category}
                      onChange={(event) =>
                        updateProject(index, { category: event.target.value as ProjectCategory })
                      }
                      className="w-full border-2 border-ink bg-paper px-3 py-2 font-mono text-sm text-ink"
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field label="Year" value={project.year} onChange={(value) => updateProject(index, { year: value })} />
                  <Field
                    label="Link (optional)"
                    value={project.href ?? ""}
                    onChange={(value) => updateProject(index, { href: value || undefined })}
                  />
                </div>
                <Field
                  label="Summary"
                  value={project.summary}
                  multiline
                  onChange={(value) => updateProject(index, { summary: value })}
                />
                <Field
                  label="Tags (comma-separated)"
                  value={project.tags.join(", ")}
                  onChange={(value) =>
                    updateProject(index, {
                      tags: value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setContent((prev) => ({
                  ...prev,
                  projects: [...prev.projects, emptyProject(prev.projects.length + 1)],
                }))
              }
              className="w-full border-2 border-dashed border-ink px-4 py-4 font-mono text-xs uppercase tracking-[0.22em] text-ink transition-colors hover:bg-ink hover:text-acid"
            >
              + Add project
            </button>
          </div>
        ) : null}

        {tab === "stats" ? (
          <div className="space-y-4 border-2 border-ink bg-paper p-5 sm:p-6">
            {content.stats.map((stat, index) => (
              <div key={stat.id} className="grid gap-4 sm:grid-cols-2">
                <Field label="Value" value={stat.value} onChange={(next) => updateStat(index, { value: next })} />
                <Field label="Label" value={stat.label} onChange={(next) => updateStat(index, { label: next })} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const className =
    "w-full border-2 border-ink bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:bg-acid/20";

  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className={className}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </label>
  );
}
