"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { socials } from "@/lib/data/socials";

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export function MobileMenu({ id, open, onClose, links }: MobileMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;

    firstLinkRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !containerRef.current) return;

      const focusable = containerRef.current.querySelectorAll<HTMLElement>(
        "a, button",
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          id={id}
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          initial={{ clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 top-0 z-40 flex flex-col justify-between bg-ink px-6 pb-10 pt-24 text-paper sm:px-10 lg:px-16"
        >
          <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center">
            <ul className="flex flex-col gap-2">
              {links.map((link, index) => (
                <li key={link.href} className="border-b border-paper/10 py-3">
                  <a
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    onClick={onClose}
                    className="group flex items-baseline gap-4 font-display text-[13vw] uppercase leading-none tracking-tight sm:text-6xl"
                  >
                    <span className="font-mono text-sm text-acid">
                      0{index + 1}
                    </span>
                    <span className="transition-colors group-hover:text-acid">
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.2em] text-paper/60">
            {socials.map((social) => (
              <li key={social.id}>
                <a href={social.href} className="hover:text-acid" target={social.href.startsWith("http") ? "_blank" : undefined} rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  {social.platform}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
