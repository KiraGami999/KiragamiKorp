"use client";

import type { ReactNode } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";

interface ScrollLinkButtonProps {
  target: string;
  children: ReactNode;
  className?: string;
}

/**
 * A magnetic button that smooth-scrolls to a section id. Kept as its own
 * client component so server-rendered sections (like Hero) can use it
 * without passing a function prop across the server/client boundary.
 */
export function ScrollLinkButton({ target, children, className }: ScrollLinkButtonProps) {
  return (
    <MagneticButton
      onClick={(event) => {
        event.preventDefault();
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      }}
      className={className}
    >
      {children}
    </MagneticButton>
  );
}
