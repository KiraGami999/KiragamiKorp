"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

  return (
    <MagneticButton
      onClick={handleClick}
      className="group flex items-center gap-3 border-2 border-paper px-7 py-4 font-mono text-sm uppercase tracking-[0.15em] text-paper transition-colors hover:bg-paper hover:text-ink sm:text-base"
    >
      {email}
      {copied ? (
        <Check className="h-4 w-4 text-acid group-hover:text-ink" aria-hidden />
      ) : (
        <Copy className="h-4 w-4" aria-hidden />
      )}
      <span className="sr-only" role="status">
        {copied ? "Email copied to clipboard" : ""}
      </span>
    </MagneticButton>
  );
}
