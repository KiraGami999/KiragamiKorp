"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { disciplines } from "@/lib/data/site";

/**
 * A kinetic reinforcement of the six disciplines already listed accessibly
 * in the Services section below — purely decorative, so it's hidden from
 * assistive tech and pauses on hover / disables under reduced motion.
 */
export function DisciplinesMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useGSAP(
    () => {
      if (!trackRef.current || reducedMotion) return;
      tweenRef.current = gsap.to(trackRef.current, {
        xPercent: -50,
        duration: 26,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: trackRef, dependencies: [reducedMotion] },
  );

  const items = [...disciplines, ...disciplines];

  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y-2 border-acid bg-ink py-6"
      onMouseEnter={() => tweenRef.current?.pause()}
      onMouseLeave={() => tweenRef.current?.play()}
    >
      <div ref={trackRef} className="flex w-max gap-10 will-change-transform">
        {items.map((item, index) => (
          <span
            key={`${item.id}-${index}`}
            className="flex items-center gap-10 whitespace-nowrap font-display text-3xl uppercase text-acid sm:text-4xl"
          >
            {item.label}
            <span className="text-acid/40">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
