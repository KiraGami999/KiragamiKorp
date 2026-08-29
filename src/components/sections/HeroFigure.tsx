"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * An original, abstract low-poly "digital organism" — a duotone ink/acid
 * stand-in for a portrait, in place of a stock/generated photo. Swap this
 * out for a real portrait (`next/image`) once one is available.
 */
export function HeroFigure() {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [-24, 40]);

  return (
    <motion.div ref={ref} style={{ y }} className="relative mx-auto aspect-[4/5] w-full max-w-md">
      <svg
        viewBox="0 0 400 500"
        role="img"
        aria-label="Abstract low-poly figure representing KiragamiKorp's engineering practice"
        className="h-full w-full"
      >
        <polygon
          points="200,42 258,66 296,124 308,206 338,258 338,430 62,430 62,258 92,206 104,124 142,66"
          className="fill-ink"
        />
        <polygon points="200,42 258,66 232,146 200,112" className="fill-acid" />
        <polygon points="142,66 104,124 162,146 200,112" className="fill-acid" opacity={0.55} />
        <polygon points="296,124 308,206 254,196 232,146" className="fill-acid" opacity={0.8} />
        <polygon points="104,124 92,206 148,196 162,146" className="fill-acid" opacity={0.35} />
        <polygon points="62,258 92,206 148,196 150,300 62,300" className="fill-paper" opacity={0.08} />
        <polygon points="338,258 308,206 254,196 250,300 338,300" className="fill-paper" opacity={0.14} />

        <g className="stroke-acid/70" strokeWidth={1}>
          <line x1="62" y1="330" x2="338" y2="330" />
          <line x1="62" y1="370" x2="338" y2="370" />
          <line x1="150" y1="300" x2="150" y2="430" />
          <line x1="250" y1="300" x2="250" y2="430" />
        </g>

        <circle cx="176" cy="176" r="5" className="fill-acid motion-reduce:animate-none animate-blink" />
        <circle cx="224" cy="176" r="5" className="fill-acid motion-reduce:animate-none animate-blink" />
      </svg>
    </motion.div>
  );
}
