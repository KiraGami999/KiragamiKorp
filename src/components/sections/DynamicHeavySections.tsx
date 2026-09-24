"use client";

import dynamic from "next/dynamic";
import type { Project } from "@/types";

const Work = dynamic(() => import("@/components/sections/Work").then((mod) => mod.Work), {
  ssr: false,
  loading: () => <div aria-hidden className="min-h-screen bg-ink" />,
});

const AiLab = dynamic(() => import("@/components/sections/AiLab").then((mod) => mod.AiLab), {
  ssr: false,
  loading: () => <div aria-hidden className="min-h-[640px] bg-acid" />,
});

/**
 * Work and AiLab are GSAP/state-heavy and below the fold, so they're
 * code-split and mounted client-side only — keeps the initial JS/HTML for
 * the hero and above-the-fold content light.
 */
export function DynamicHeavySections({ projects }: { projects: Project[] }) {
  return (
    <>
      <Work projects={projects} />
      <AiLab />
    </>
  );
}
