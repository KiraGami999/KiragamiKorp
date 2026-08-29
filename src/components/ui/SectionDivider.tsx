import { cn } from "@/lib/utils/cn";

interface SectionDividerProps {
  /** Color of the angled wedge (usually the section above). */
  from: string;
  /** Background color the wedge sits on (usually the section below). */
  to: string;
  flip?: boolean;
  className?: string;
}

/**
 * A reusable angular seam between sections — an original take on the
 * reference's single diagonal cut, reused (at varying angles/colors)
 * throughout the page instead of a plain horizontal border.
 */
export function SectionDivider({ from, to, flip = false, className }: SectionDividerProps) {
  return (
    <div
      aria-hidden
      className={cn("relative h-[7vw] max-h-20 min-h-8 w-full overflow-hidden", className)}
      style={{ backgroundColor: to }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: from,
          clipPath: flip
            ? "polygon(0 0, 100% 0, 0 100%)"
            : "polygon(100% 0, 100% 100%, 0 0)",
        }}
      />
    </div>
  );
}
