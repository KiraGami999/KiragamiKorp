"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { cn } from "@/lib/utils/cn";

type RevealTag = "h1" | "h2" | "h3" | "p" | "span" | "div";

interface RevealTextProps {
  text: string;
  as?: RevealTag;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  /**
   * `mount` — animate in as soon as the component mounts (hero / above-the-fold).
   * `view` — animate when scrolled into view (below-the-fold sections).
   */
  trigger?: "mount" | "view";
}

type Lines = string[] | readonly string[];

/**
 * Splits text into words and reveals them with a masked upward stagger.
 * Falls back to a plain static render when the user prefers reduced motion.
 */
export function RevealText({
  text,
  as: Tag = "span",
  className,
  delay = 0,
  stagger = 0.06,
  once = true,
  trigger = "view",
}: RevealTextProps) {
  const reducedMotion = useReducedMotion();
  const words = text.split(" ");

  if (reducedMotion) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="inline-block overflow-hidden align-top pb-[0.08em]">
            <motion.span
              className="inline-block will-change-transform"
              initial={{ y: "110%" }}
              {...(trigger === "mount"
                ? { animate: { y: "0%" } }
                : {
                    whileInView: { y: "0%" },
                    // No negative top margin — that prevented hero text from
                    // ever counting as "in view" and left it permanently clipped.
                    viewport: { once, amount: 0.15 },
                  })}
              transition={{
                duration: 0.75,
                delay: delay + index * stagger,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {word}
            </motion.span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}

export function RevealLines({
  lines,
  as: Tag = "h2",
  className,
  lineClassName,
  delay = 0,
  id,
  trigger = "view",
}: {
  lines: Lines;
  as?: RevealTag;
  className?: string;
  lineClassName?: string;
  delay?: number;
  id?: string;
  trigger?: "mount" | "view";
}) {
  return (
    <Tag id={id} className={cn("flex flex-col", className)}>
      {lines.map((line, index) => (
        <RevealText
          key={`${line}-${index}`}
          text={line}
          as="span"
          className={lineClassName}
          delay={delay + index * 0.08}
          trigger={trigger}
        />
      ))}
    </Tag>
  );
}
