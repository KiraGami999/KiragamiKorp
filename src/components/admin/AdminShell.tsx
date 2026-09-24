"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  ExternalLink,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Notice, Time, adminFetch } from "@/components/admin/ui";
import { OverviewSection } from "@/components/admin/sections/OverviewSection";
import { SecuritySection } from "@/components/admin/sections/SecuritySection";
import { SiteSection, StatsSection } from "@/components/admin/sections/SiteSection";
import { StudioSection } from "@/components/admin/sections/StudioSection";
import { SystemSection } from "@/components/admin/sections/SystemSection";
import { NEW_PROJECT_PREFIX, WorkSection } from "@/components/admin/sections/WorkSection";
import { cn } from "@/lib/utils/cn";
import type { EditableSite, SiteContent, SiteContentRecord } from "@/types/content";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, group: "content" },
  { id: "work", label: "Selected work", icon: FolderKanban, group: "content" },
  { id: "site", label: "Site copy", icon: FileText, group: "content" },
  { id: "stats", label: "Stats", icon: BarChart3, group: "content" },
  { id: "studio", label: "Studio", icon: Sparkles, group: "ops" },
  { id: "security", label: "Security", icon: ShieldCheck, group: "ops" },
  { id: "system", label: "System", icon: Activity, group: "ops" },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon; group: "content" | "ops" }[];

export type AdminSectionId = (typeof SECTIONS)[number]["id"];

const CONTENT_SECTIONS = new Set<AdminSectionId>(["overview", "work", "site", "stats"]);

function subscribeHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function useSection(): AdminSectionId {
  const hash = useSyncExternalStore(
    subscribeHash,
    () => window.location.hash.slice(1),
    () => "",
  );
  return SECTIONS.find((section) => section.id === hash)?.id ?? "overview";
}

function navigate(section: AdminSectionId) {
  window.location.hash = section;
  window.scrollTo({ top: 0 });
}

function toContent(record: SiteContentRecord): SiteContent {
  return { site: record.site, projects: record.projects, stats: record.stats };
}

/** The server treats "" and a missing optional field the same, so dirty-checking must too. */
function fingerprint(content: SiteContent): string {
  return JSON.stringify(content, (_key, value) => (value === "" ? undefined : value));
}

export function AdminShell({
  initialContent,
  username: initialUsername,
  displayName: initialDisplayName,
  hasDatabaseAdmin,
}: {
  initialContent: SiteContentRecord;
  username: string;
  displayName: string | null;
  hasDatabaseAdmin: boolean;
}) {
  const router = useRouter();
  const section = useSection();
  const [content, setContent] = useState<SiteContent>(() => toContent(initialContent));
  const [savedContent, setSavedContent] = useState<SiteContent>(() => toContent(initialContent));
  const [savedIds, setSavedIds] = useState(() => new Set(initialContent.projects.map((project) => project.id)));
  const [updatedAt, setUpdatedAt] = useState(initialContent.updatedAt);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialContent.projects[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [profile, setProfile] = useState({ username: initialUsername, displayName: initialDisplayName });

  const savedFingerprint = useMemo(() => fingerprint(savedContent), [savedContent]);
  const dirty = useMemo(() => fingerprint(content) !== savedFingerprint, [content, savedFingerprint]);

  const save = useCallback(async () => {
    setSaving(true);
    setStatus(null);
    const selected = content.projects.find((project) => project.id === selectedProjectId);
    const payload: SiteContent = {
      ...content,
      // New projects get a slug derived from their title on the server.
      projects: content.projects.map((project) =>
        project.id.startsWith(NEW_PROJECT_PREFIX) ? { ...project, id: "" } : project,
      ),
    };
    try {
      const { content: saved } = await adminFetch<{ content: SiteContentRecord }>("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify({ content: payload }),
      });
      const next = toContent(saved);
      setContent(next);
      setSavedContent(next);
      setSavedIds(new Set(next.projects.map((project) => project.id)));
      setUpdatedAt(saved.updatedAt);
      const reselected =
        next.projects.find((project) => project.id === selectedProjectId) ??
        next.projects.findLast((project) => project.title === selected?.title.trim()) ??
        next.projects[0];
      setSelectedProjectId(reselected?.id ?? null);
      setStatus({ tone: "success", text: "Saved — the public site is updated." });
      router.refresh();
    } catch (error) {
      setStatus({ tone: "error", text: error instanceof Error ? error.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }, [content, selectedProjectId, router]);

  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (status?.tone !== "success") return;
    const timer = window.setTimeout(() => setStatus(null), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function logout() {
    if (dirty && !window.confirm("You have unsaved changes. Sign out anyway?")) return;
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
  }

  const patchSite = (patch: Partial<EditableSite>) =>
    setContent((prev) => ({ ...prev, site: { ...prev.site, ...patch } }));

  const current = SECTIONS.find((item) => item.id === section)!;
  const showSaveBar = CONTENT_SECTIONS.has(section) && (dirty || saving || status);
  const neverSaved = updatedAt === new Date(0).toISOString();

  return (
    <div className="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="border-b-2 border-ink bg-ink text-paper lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r-2">
        <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
          <Link href="/" className="font-display text-2xl leading-none tracking-tight text-paper hover:text-acid">
            KIRAGAMI<span className="text-acid">KORP</span>
          </Link>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-paper/45 lg:mt-2">Ops deck</p>
        </div>

        <nav aria-label="Admin sections" className="overflow-x-auto px-3 pb-3 lg:flex-1 lg:overflow-y-auto lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {SECTIONS.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === section;
              const groupStart = index > 0 && SECTIONS[index - 1].group !== item.group;
              return (
                <li key={item.id} className={cn(groupStart && "lg:mt-5 lg:border-t lg:border-paper/10 lg:pt-5")}>
                  <a
                    href={`#${item.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 whitespace-nowrap px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
                      active ? "bg-acid text-ink" : "text-paper/70 hover:bg-paper/10 hover:text-paper",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                    {item.id === "work" && dirty ? (
                      <span className="ml-auto h-1.5 w-1.5 bg-current" aria-label="unsaved changes" />
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden border-t border-paper/10 p-5 lg:block">
          <p className="truncate font-mono text-xs text-paper">{profile.displayName ?? profile.username}</p>
          <p className="truncate font-mono text-[10px] text-paper/45">@{profile.username}</p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex flex-1 items-center justify-center gap-1.5 border border-paper/25 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/75 hover:border-acid hover:text-acid"
            >
              <ExternalLink className="h-3 w-3" aria-hidden /> Site
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 border border-paper/25 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/75 hover:border-acid hover:text-acid"
            >
              <LogOut className="h-3 w-3" aria-hidden /> Exit
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink px-5 py-6 sm:px-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink/50">
              {current.group === "content" ? "Content" : "Operations"}
              {CONTENT_SECTIONS.has(section) ? (
                <>
                  {" "}· last save {neverSaved ? "never" : <Time iso={updatedAt} relative />}
                </>
              ) : null}
            </p>
            <h1 className="mt-2 font-display text-5xl uppercase leading-none tracking-tight">{current.label}</h1>
          </div>
          <div className="flex gap-2 lg:hidden">
            <Link
              href="/"
              className="border-2 border-ink px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-ink hover:text-acid"
            >
              Site
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="border-2 border-ink px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em] hover:bg-ink hover:text-acid"
            >
              Exit
            </button>
          </div>
        </header>

        <main className={cn("px-5 py-8 sm:px-8", showSaveBar && "pb-28")}>
          {section === "overview" ? (
            <OverviewSection
              content={content}
              displayName={profile.displayName ?? profile.username}
              onNavigate={navigate}
              onOpenProject={(id) => {
                setSelectedProjectId(id);
                navigate("work");
              }}
            />
          ) : null}
          {section === "work" ? (
            <WorkSection
              projects={content.projects}
              selectedId={selectedProjectId}
              onSelect={setSelectedProjectId}
              savedIds={savedIds}
              onChange={(projects) => setContent((prev) => ({ ...prev, projects }))}
            />
          ) : null}
          {section === "site" ? <SiteSection site={content.site} onChange={patchSite} /> : null}
          {section === "stats" ? (
            <StatsSection stats={content.stats} onChange={(stats) => setContent((prev) => ({ ...prev, stats }))} />
          ) : null}
          {section === "studio" ? <StudioSection /> : null}
          {section === "security" ? (
            <SecuritySection
              username={profile.username}
              displayName={profile.displayName}
              hasDatabaseAdmin={hasDatabaseAdmin}
              onProfileChange={setProfile}
            />
          ) : null}
          {section === "system" ? <SystemSection /> : null}
        </main>
      </div>

      {showSaveBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper lg:left-64">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8">
            <div className="min-w-0 flex-1">
              {status ? (
                <Notice tone={status.tone}>{status.text}</Notice>
              ) : (
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/70">
                  Unsaved changes <span className="text-ink/40">· Ctrl+S</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {dirty ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (!window.confirm("Discard all unsaved changes?")) return;
                    setContent(savedContent);
                    if (!savedContent.projects.some((project) => project.id === selectedProjectId)) {
                      setSelectedProjectId(savedContent.projects[0]?.id ?? null);
                    }
                  }}
                  className="border-2 border-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink hover:bg-ink hover:text-acid disabled:opacity-40"
                >
                  Discard
                </button>
              ) : null}
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={() => void save()}
                className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-acid hover:bg-acid hover:text-ink disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : null}
                {saving ? "Saving…" : "Save & publish"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
