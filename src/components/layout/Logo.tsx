import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex h-10 w-10 shrink-0 items-center justify-center border-2 border-current font-display text-base leading-none",
        className,
      )}
      aria-label="KiragamiKorp — home"
    >
      <span className="group-hover:hidden">KK</span>
      <span className="hidden group-hover:inline">↑</span>
    </Link>
  );
}
