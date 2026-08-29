"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedCounterProps {
  /** e.g. "20+", "500+", "6" — leading digits are animated, the rest is kept as a suffix. */
  value: string;
  className?: string;
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? Number.parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : value;

  useGSAP(
    () => {
      const node = ref.current;
      if (!node) return;

      if (reducedMotion) {
        node.textContent = value;
        return;
      }

      const counter = { current: 0 };
      gsap.to(counter, {
        current: target,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: {
          trigger: node,
          start: "top 85%",
          once: true,
        },
        onUpdate: () => {
          node.textContent = `${Math.round(counter.current)}${suffix}`;
        },
      });
    },
    { scope: ref, dependencies: [value, reducedMotion, target, suffix] },
  );

  return (
    <span ref={ref} className={cn(className)}>
      0{suffix}
    </span>
  );
}
