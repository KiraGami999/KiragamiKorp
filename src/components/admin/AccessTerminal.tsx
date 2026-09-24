"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

const BOOT_LINES = [
  "KIRAGAMIKORP // BLACKWALL INTERFACE",
  "establishing encrypted uplink…",
  "local netsec: hardened",
  "awaiting clearance phrase_",
];

interface AccessTerminalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Mounted only while open so boot/input state resets without setState-in-effect.
 */
function TerminalPanel({ onClose }: { onClose: () => void }) {
  const reducedMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const [bootIndex, setBootIndex] = useState(reducedMotion ? BOOT_LINES.length : 0);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "denied" | "granted">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(focusTimer);
    }

    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      setBootIndex(current);
      if (current >= BOOT_LINES.length) {
        window.clearInterval(timer);
        inputRef.current?.focus();
      }
    }, 280);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    if (!code.trim() || status === "checking" || status === "granted") return;

    setStatus("checking");
    setMessage("verifying clearance…");

    try {
      const response = await fetch("/api/admin/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { error?: string; redirect?: string };

      if (!response.ok) {
        setStatus("denied");
        setMessage(data.error ?? "ACCESS DENIED");
        setCode("");
        inputRef.current?.focus();
        return;
      }

      setStatus("granted");
      setMessage("CLEARANCE GRANTED — routing to personal login…");
      window.setTimeout(() => {
        window.location.assign(data.redirect ?? "/admin/login");
      }, reducedMotion ? 200 : 900);
    } catch {
      setStatus("denied");
      setMessage("UPLINK FAILED");
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Restricted access terminal"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/92 p-4 backdrop-blur-sm"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-xl border-2 border-acid bg-ink font-mono text-sm text-acid shadow-[12px_12px_0_0_#dbff3e]"
        initial={reducedMotion ? false : { y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={reducedMotion ? undefined : { y: 16, opacity: 0 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-acid/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-acid/40" />
            <span className="h-2.5 w-2.5 bg-acid/40" />
            <span className="h-2.5 w-2.5 bg-acid" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.28em] text-acid/70">netrun.exe</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] uppercase tracking-[0.2em] text-acid/60 transition-colors hover:text-acid"
          >
            Abort
          </button>
        </div>

        <div className="min-h-[260px] space-y-2 px-5 py-5 text-[12px] leading-relaxed sm:text-sm">
          {BOOT_LINES.slice(0, bootIndex).map((line) => (
            <p key={line} className="text-acid/80">
              <span className="text-acid/40">&gt;</span> {line}
            </p>
          ))}

          {bootIndex >= BOOT_LINES.length ? (
            <form
              className="pt-3"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <label htmlFor="gate-code" className="sr-only">
                Clearance phrase
              </label>
              <div className="flex items-center gap-2">
                <span className="text-acid" aria-hidden>
                  $
                </span>
                <input
                  ref={inputRef}
                  id="gate-code"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={code}
                  disabled={status === "checking" || status === "granted"}
                  onChange={(event) => {
                    setCode(event.target.value);
                    if (status === "denied") {
                      setStatus("idle");
                      setMessage(null);
                    }
                  }}
                  className={cn(
                    "w-full border-0 bg-transparent text-acid caret-acid outline-none",
                    "placeholder:text-acid/30",
                  )}
                  placeholder="enter clearance phrase"
                />
                <span aria-hidden className="inline-block h-4 w-2 shrink-0 animate-blink bg-acid" />
              </div>
            </form>
          ) : null}

          {message ? (
            <p
              role="status"
              className={cn(
                "pt-3 text-[11px] uppercase tracking-[0.18em]",
                status === "granted" ? "text-acid" : "text-paper",
              )}
            >
              {message}
            </p>
          ) : null}
        </div>

        <div className="border-t border-acid/30 px-5 py-2 text-[10px] uppercase tracking-[0.22em] text-acid/45">
          Restricted node · sole operator access
        </div>
      </motion.div>
    </motion.div>
  );
}

export function AccessTerminal({ open, onClose }: AccessTerminalProps) {
  return <AnimatePresence>{open ? <TerminalPanel key="gate" onClose={onClose} /> : null}</AnimatePresence>;
}
