import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.3em]",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block h-3 w-1.5 shrink-0 animate-blink bg-current motion-reduce:animate-none"
      />
      {children}
    </p>
  );
}
