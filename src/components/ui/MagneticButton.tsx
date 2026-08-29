"use client";

import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from "framer-motion";
import { useFinePointer } from "@/lib/hooks/useFinePointer";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

interface MagneticButtonProps extends HTMLMotionProps<"button"> {
  strength?: number;
}

/**
 * Wraps a button and nudges it toward the cursor within its bounds.
 * Only active for fine-pointer, motion-safe contexts; a no-op elsewhere.
 */
export function MagneticButton({ children, className, strength = 18, ...props }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const isFinePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const active = isFinePointer && !reducedMotion;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.5 });

  function handleMouseMove(event: MouseEvent<HTMLButtonElement>) {
    if (!active || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    const relX = event.clientX - bounds.left - bounds.width / 2;
    const relY = event.clientY - bounds.top - bounds.height / 2;
    x.set((relX / bounds.width) * strength);
    y.set((relY / bounds.height) * strength);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={active ? { x: springX, y: springY } : undefined}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
