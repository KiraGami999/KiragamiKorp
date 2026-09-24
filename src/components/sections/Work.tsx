"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { RevealLines } from "@/components/ui/RevealText";
import type { Project } from "@/types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Desktop gets a GSAP ScrollTrigger-pinned horizontal scroll through the
 * work — a deliberate engineering flourish that also solves a real layout
 * problem (showcasing wide project cards without cramming them). Mobile and
 * reduced-motion users get a plain vertical stack instead: scroll-jacking a
 * touch device is bad UX, so it's never applied there.
 */
export function Work({ projects }: { projects: Project[] }) {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const track = trackRef.current;
        const section = sectionRef.current;
        if (!track || !section || reducedMotion) return;

        const getDistance = () => track.scrollWidth - window.innerWidth;

        const tween = gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getDistance()}`,
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true,
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [reducedMotion, projects] },
  );

  return (
    <section
      id="work"
      ref={sectionRef}
      aria-labelledby="work-heading"
      className="relative overflow-hidden bg-ink py-24 text-paper sm:py-32 lg:py-0"
    >
      <div
        ref={trackRef}
        className="mx-auto flex max-w-[1600px] flex-col gap-16 px-6 sm:px-10 lg:h-screen lg:w-max lg:flex-row lg:items-center lg:gap-12 lg:px-16"
      >
        <div className="shrink-0 lg:w-[26vw]">
          <SectionEyebrow className="mb-4 text-acid">LOG.03 — SELECTED WORK</SectionEyebrow>
          <RevealLines
            lines={["SYSTEMS", "WE'VE", "SHIPPED."]}
            as="h2"
            id="work-heading"
            lineClassName="font-display text-paper text-[13vw] leading-[0.9] sm:text-[7vw] lg:text-[3.4vw]"
          />
          <p className="mt-6 max-w-xs font-mono text-xs uppercase leading-relaxed tracking-widest text-paper/50">
            A sample of shipped products across mobile, web, and automation.
          </p>
        </div>

        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            className="w-full shrink-0 sm:w-[70%] lg:w-[24vw]"
          />
        ))}
      </div>
    </section>
  );
}
