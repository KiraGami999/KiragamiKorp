"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { aiLabScenarios } from "@/lib/data/ai-lab";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const TYPE_SPEED_MS = 26;
const LINE_PAUSE_MS = 450;
const SCENARIO_PAUSE_MS = 2200;
const REDUCED_MOTION_INTERVAL_MS = 4500;

/**
 * A client-side scripted preview of automation pipelines — not a live model
 * call. Clearly labeled as a simulation in the surrounding section copy.
 * Includes a pause control since it auto-advances (WCAG 2.2.2).
 */
export function AiLabTerminal() {
  const reducedMotion = useReducedMotion();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const [typedChars, setTypedChars] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenario = aiLabScenarios[scenarioIndex];
  const lines = scenario.lines;

  useEffect(() => {
    if (paused) return undefined;

    if (reducedMotion) {
      timeoutRef.current = setTimeout(() => {
        setScenarioIndex((i) => (i + 1) % aiLabScenarios.length);
      }, REDUCED_MOTION_INTERVAL_MS);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    const currentLine = lines[lineIndex];
    if (!currentLine) return undefined;

    if (typedChars < currentLine.text.length) {
      timeoutRef.current = setTimeout(() => setTypedChars((c) => c + 1), TYPE_SPEED_MS);
    } else if (lineIndex < lines.length - 1) {
      timeoutRef.current = setTimeout(() => {
        setLineIndex((i) => i + 1);
        setTypedChars(0);
      }, LINE_PAUSE_MS);
    } else {
      timeoutRef.current = setTimeout(() => {
        setScenarioIndex((i) => (i + 1) % aiLabScenarios.length);
        setLineIndex(0);
        setTypedChars(0);
      }, SCENARIO_PAUSE_MS);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [paused, reducedMotion, lineIndex, typedChars, lines, scenarioIndex]);

  const promptLine = lines[0];
  const outputLines = lines.slice(1);

  return (
    <div
      aria-hidden="true"
      className="w-full max-w-2xl border-2 border-ink bg-ink font-mono text-sm text-paper shadow-[10px_10px_0_0_var(--color-ink)]"
    >
      <div className="flex items-center justify-between border-b border-paper/15 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 bg-paper/25" />
          <span className="h-2.5 w-2.5 bg-paper/25" />
          <span className="h-2.5 w-2.5 bg-acid" />
        </div>
        <span className="text-[11px] uppercase tracking-[0.2em] text-paper/50">automation.sh</span>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="text-paper/60 transition-colors hover:text-acid"
          aria-hidden="true"
          tabIndex={-1}
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </button>
      </div>

      <div className="min-h-[220px] px-5 py-5">
        <p className="mb-3 text-acid">
          ${" "}
          {lineIndex === 0 && !reducedMotion
            ? promptLine?.text.slice(0, typedChars)
            : promptLine?.text}
          {!reducedMotion && lineIndex === 0 && typedChars < (promptLine?.text.length ?? 0) ? (
            <span className="ml-0.5 inline-block h-4 w-2 animate-blink bg-acid align-middle" />
          ) : null}
        </p>

        <div className="space-y-1.5 text-paper/75">
          {outputLines.map((line, index) => {
            const realIndex = index + 1;

            if (reducedMotion) {
              return <p key={line.text}>{line.text}</p>;
            }

            if (realIndex > lineIndex) return null;

            const isCurrent = realIndex === lineIndex;
            const text = isCurrent ? line.text.slice(0, typedChars) : line.text;

            return (
              <p key={line.text}>
                {text}
                {isCurrent && typedChars < line.text.length ? (
                  <span className="ml-0.5 inline-block h-4 w-2 animate-blink bg-paper/70 align-middle" />
                ) : null}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
