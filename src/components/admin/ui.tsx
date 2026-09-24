"use client";

import { useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

let clockNow = 0;
const clockListeners = new Set<() => void>();
let clockTimer: number | undefined;

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (clockTimer === undefined) {
    clockTimer = window.setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((notify) => notify());
    }, 60_000);
  }
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size) {
      window.clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

function getClockSnapshot() {
  if (!clockNow) clockNow = Date.now();
  return clockNow;
}

/** Minute-resolution clock; 0 during SSR and hydration. */
function useNow(): number {
  return useSyncExternalStore(subscribeClock, getClockSnapshot, () => 0);
}

export function Time({ iso, relative = false }: { iso: string; relative?: boolean }) {
  const now = useNow();
  const date = new Date(iso);
  if (!now) return <time dateTime={iso}>{iso.slice(0, 10)}</time>;

  if (relative) {
    const seconds = Math.round((now - date.getTime()) / 1000);
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ["day", 86_400],
      ["hour", 3_600],
      ["minute", 60],
    ];
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) {
        return (
          <time dateTime={iso} title={date.toLocaleString()}>
            {rtf.format(-Math.round(seconds / size), unit)}
          </time>
        );
      }
    }
    return <time dateTime={iso}>just now</time>;
  }

  return <time dateTime={iso}>{date.toLocaleString()}</time>;
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-2 border-ink bg-paper", className)}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-2xl uppercase leading-none tracking-tight text-ink">{title}</h2>
          {description ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/60">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 border-2 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "border-ink bg-ink text-acid hover:bg-acid hover:text-ink",
        variant === "secondary" && "border-ink bg-paper text-ink hover:bg-ink hover:text-acid",
        variant === "danger" && "border-ink bg-paper text-ink hover:border-[#b3261e] hover:bg-[#b3261e] hover:text-paper",
        variant === "ghost" && "border-transparent text-ink/60 hover:text-ink",
        className,
      )}
    />
  );
}

const inputClass =
  "w-full border-2 border-ink bg-paper px-3 py-2 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink/30 focus:bg-acid/15";

export function Field({
  label,
  value,
  onChange,
  multiline = false,
  rows = 4,
  hint,
  maxLength,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  hint?: ReactNode;
  maxLength?: number;
  placeholder?: string;
  type?: "text" | "url" | "password" | "email";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-baseline justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">
        <span>{label}</span>
        {maxLength ? (
          <span className={cn(value.length > maxLength * 0.9 && "text-ink")}>
            {value.length}/{maxLength}
          </span>
        ) : null}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          className={cn(inputClass, "resize-y leading-relaxed")}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={inputClass}
        />
      )}
      {hint ? <span className="mt-1.5 block text-xs text-ink/50">{hint}</span> : null}
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6">
      <span>
        <span className="block font-mono text-xs uppercase tracking-[0.18em] text-ink">{label}</span>
        {description ? <span className="mt-1 block text-sm text-ink/55">{description}</span> : null}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-7 w-12 border-2 border-ink bg-paper transition-colors peer-checked:bg-ink peer-focus-visible:shadow-[0_0_0_3px_var(--color-paper),0_0_0_6px_var(--color-ink)]" />
        <span className="absolute left-1 top-1 h-5 w-5 bg-ink transition-transform peer-checked:translate-x-5 peer-checked:bg-acid motion-reduce:transition-none" />
      </span>
    </label>
  );
}

export function Notice({ tone, children }: { tone: "success" | "error" | "info"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "border-l-4 px-3 py-2 font-mono text-xs",
        tone === "success" && "border-acid bg-ink text-paper",
        tone === "error" && "border-[#b3261e] bg-[#b3261e]/10 text-ink",
        tone === "info" && "border-ink bg-ink/5 text-ink",
      )}
    >
      {children}
    </p>
  );
}

export function StatusDot({ level }: { level: "ok" | "warn" | "error" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-2.5 w-2.5 shrink-0 border border-ink",
        level === "ok" && "bg-acid",
        level === "warn" && "bg-[#f5a524]",
        level === "error" && "bg-[#b3261e]",
      )}
    />
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="border-2 border-ink bg-paper p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/50">{label}</p>
      <p className="mt-2 font-display text-4xl leading-none text-ink">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ink/55">{hint}</p> : null}
    </div>
  );
}

/** Small typed fetch wrapper for the admin JSON APIs. */
export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (response.status === 401) {
    // The admin page redirects away server-side once the session is gone.
    window.location.reload();
    throw new Error("Session expired.");
  }
  if (!response.ok) throw new Error(data.error ?? `Request failed (${response.status}).`);
  return data;
}
