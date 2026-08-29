"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useFinePointer } from "@/lib/hooks/useFinePointer";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

/**
 * A trailing accent ring that grows over interactive elements. Runs
 * alongside (never replaces) the system cursor, so it adds tactile feedback
 * without any accessibility cost. Fine-pointer + motion-safe only.
 */
export function CustomCursor() {
  const isFinePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const [isHovering, setIsHovering] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  const enabled = isFinePointer && !reducedMotion;

  useEffect(() => {
    if (!enabled) return;

    function handleMove(event: globalThis.MouseEvent) {
      x.set(event.clientX);
      y.set(event.clientY);
    }

    function handleOver(event: globalThis.MouseEvent) {
      const target = event.target as HTMLElement | null;
      setIsHovering(Boolean(target?.closest("a, button, [data-cursor-hover]")));
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] mix-blend-difference"
      style={{ x: springX, y: springY }}
    >
      <motion.div
        className="rounded-full bg-white"
        animate={{
          width: isHovering ? 56 : 10,
          height: isHovering ? 56 : 10,
          x: isHovering ? -28 : -5,
          y: isHovering ? -28 : -5,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      />
    </motion.div>
  );
}
