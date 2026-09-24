import type { Metadata } from "next";
import Link from "next/link";
import { StudioApp } from "@/components/studio/StudioApp";
import { Logo } from "@/components/layout/Logo";
import { CustomCursor } from "@/components/layout/CustomCursor";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "KiragamiKorp Studio — describe a task in plain language and generate a full AI automation workflow: steps, prompts, and starter code.",
};

export default function StudioPage() {
  return (
    <>
      <CustomCursor />
      <header className="sticky top-0 z-50 border-b-2 border-ink bg-acid text-ink">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.3em] text-ink/55 sm:inline">
              Studio
            </span>
          </div>
          <nav aria-label="Studio" className="flex items-center gap-6 font-mono text-xs uppercase tracking-[0.2em]">
            <Link href="/" className="hover:underline">
              Portfolio
            </Link>
            <Link
              href="/studio"
              className="border-2 border-ink bg-ink px-3 py-2 text-acid"
              aria-current="page"
            >
              Studio
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="flex-1 bg-paper">
        <StudioApp />
      </main>
      <footer className="border-t-2 border-ink bg-ink py-6 text-paper">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-6 font-mono text-[11px] uppercase tracking-[0.2em] text-paper/45 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
          <p>KiragamiKorp Studio · Live generation via Groq</p>
          <p>Template fallback when the AI is unavailable</p>
        </div>
      </footer>
    </>
  );
}
