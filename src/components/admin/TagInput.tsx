"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

const SUGGESTIONS = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Swift",
  "Kotlin",
  "Dart",
  "Go",
  "Rust",
  "SQL",
  "React",
  "React Native",
  "Next.js",
  "Flutter",
  "Node.js",
  "Tailwind CSS",
  "PostgreSQL",
  "Firebase",
  "Supabase",
  "GraphQL",
  "Docker",
  "AWS",
  "Vercel",
  "OpenAI",
  "Groq",
  "LangChain",
  "n8n",
  "Figma",
];

export function TagInput({
  label,
  tags,
  onChange,
  max = 16,
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function add(raw: string) {
    const values = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!values.length) return;
    const lower = new Set(tags.map((tag) => tag.toLowerCase()));
    const next = [...tags];
    for (const value of values) {
      if (!lower.has(value.toLowerCase()) && next.length < max) {
        next.push(value.slice(0, 40));
        lower.add(value.toLowerCase());
      }
    }
    onChange(next);
    setDraft("");
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  const suggestions = SUGGESTIONS.filter(
    (item) => !tags.some((tag) => tag.toLowerCase() === item.toLowerCase()),
  ).slice(0, 10);

  return (
    <div>
      <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55" htmlFor={`${listId}-input`}>
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2 border-2 border-ink bg-paper px-2 py-2 focus-within:bg-acid/15">
        {tags.map((tag, index) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-acid"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((_, i) => i !== index))}
              className="text-acid/60 hover:text-acid"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={`${listId}-input`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKey}
          onBlur={() => add(draft)}
          placeholder={tags.length >= max ? "Limit reached" : "Type and press Enter"}
          disabled={tags.length >= max}
          className="min-w-[10rem] flex-1 bg-transparent px-1 py-1 font-mono text-sm text-ink outline-none placeholder:text-ink/30"
        />
      </div>
      {suggestions.length && tags.length < max ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => add(item)}
              className="border border-ink/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink/55 transition-colors hover:border-ink hover:text-ink"
            >
              + {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
