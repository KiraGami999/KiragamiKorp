import { cn } from "@/lib/utils/cn";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "span" | "div";
}

/**
 * Hover/focus-triggered channel-split glitch effect, built only from the
 * brand's ink/acid palette (no new hue) — a nod to the cyberpunk mood
 * reference without copying its colors.
 */
export function GlitchText({ text, className, as: Tag = "span" }: GlitchTextProps) {
  return (
    <Tag className={cn("glitch", className)} data-text={text}>
      {text}
    </Tag>
  );
}
