"use client";

import { useCallback, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useFinePointer } from "@/lib/hooks/useFinePointer";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

const TILT_RANGE = 14;
const SPRING = { stiffness: 220, damping: 18, mass: 0.4 };

/**
 * Interactive studio mark for the hero top-right.
 * - Mouse tilt (fine pointer only)
 * - Hover: channel-split glitch + acid flash
 * - Click / drag: brief glitch burst + free pointer play
 * Respects prefers-reduced-motion.
 */
export function SamuraiEmblem({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isFinePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const interactive = isFinePointer && !reducedMotion;

  const [hovered, setHovered] = useState(false);
  const [bursting, setBursting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, SPRING);
  const springY = useSpring(rotateY, SPRING);
  const glareX = useTransform(springY, [-TILT_RANGE, TILT_RANGE], ["20%", "80%"]);
  const glareY = useTransform(springX, [-TILT_RANGE, TILT_RANGE], ["80%", "20%"]);
  const glareBackground = useTransform([glareX, glareY], ([gx, gy]) => {
    return `radial-gradient(circle at ${String(gx)} ${String(gy)}, rgba(219,255,62,0.85) 0%, transparent 55%)`;
  });
  const glareOpacity = hovered || dragging ? 0.55 : 0;

  const updateTilt = useCallback(
    (clientX: number, clientY: number) => {
      const node = containerRef.current;
      if (!node || !interactive) return;
      const bounds = node.getBoundingClientRect();
      const px = (clientX - bounds.left) / bounds.width;
      const py = (clientY - bounds.top) / bounds.height;
      rotateY.set((px - 0.5) * TILT_RANGE * 2);
      rotateX.set((0.5 - py) * TILT_RANGE * 2);
    },
    [interactive, rotateX, rotateY],
  );

  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    updateTilt(event.clientX, event.clientY);
  }

  function handlePointerLeave() {
    if (!dragging) {
      setHovered(false);
      resetTilt();
    }
  }

  function triggerBurst() {
    if (reducedMotion) return;
    setBursting(true);
    window.setTimeout(() => setBursting(false), 520);
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    triggerBurst();
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    triggerBurst();
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // capture may already be released
    }
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="KiragamiKorp studio mark — interactive samurai emblem"
      tabIndex={0}
      data-cursor-hover
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          triggerBurst();
        }
      }}
      className={cn(
        "samurai-emblem relative isolate select-none outline-none",
        interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        className,
      )}
      style={{ perspective: 900 }}
    >
      <motion.div
        className={cn(
          "relative will-change-transform",
          (hovered || bursting) && "samurai-glitch",
          bursting && "samurai-burst",
        )}
        style={
          interactive
            ? {
                rotateX: springX,
                rotateY: springY,
                transformStyle: "preserve-3d",
              }
            : undefined
        }
        animate={
          reducedMotion
            ? undefined
            : {
                scale: hovered || dragging ? 1.05 : 1,
              }
        }
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        <Image
          src="/images/samurai.png"
          alt=""
          width={640}
          height={640}
          priority
          draggable={false}
          className="relative z-10 h-auto w-full drop-shadow-[8px_12px_0_rgba(10,10,10,0.35)]"
        />

        <span aria-hidden className="samurai-channel samurai-channel--acid" />
        <span aria-hidden className="samurai-channel samurai-channel--ink" />

        {interactive ? (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 mix-blend-soft-light transition-opacity duration-200"
            style={{
              background: glareBackground,
              opacity: glareOpacity,
            }}
          />
        ) : null}

        <span aria-hidden className="samurai-scan" />
      </motion.div>

      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.28em] text-ink/50">
        {interactive ? "Hover · drag · click" : "Studio mark"}
      </p>
    </div>
  );
}
