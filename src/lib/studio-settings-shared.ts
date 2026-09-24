export interface StudioSettings {
  /** When off, the Studio always serves template workflows. */
  liveEnabled: boolean;
  /** Empty string means "use LLM_MODEL env / built-in default". */
  model: string;
  temperature: number;
  rateLimitPerMinute: number;
  /** Appended to the architect system prompt. */
  extraInstructions: string;
  saveGenerations: boolean;
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  liveEnabled: true,
  model: "",
  temperature: 0.4,
  rateLimitPerMinute: 5,
  extraInstructions: "",
  saveGenerations: true,
};

export const STUDIO_MODEL_OPTIONS = [
  { value: "", label: "Default (openai/gpt-oss-20b)" },
  { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B — fastest" },
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B — highest quality" },
  { value: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B — preview" },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeStudioSettings(raw: unknown): StudioSettings {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const d = DEFAULT_STUDIO_SETTINGS;
  return {
    liveEnabled: typeof data.liveEnabled === "boolean" ? data.liveEnabled : d.liveEnabled,
    model: typeof data.model === "string" ? data.model.trim().slice(0, 100) : d.model,
    temperature:
      typeof data.temperature === "number" && Number.isFinite(data.temperature)
        ? clamp(Math.round(data.temperature * 100) / 100, 0, 1.5)
        : d.temperature,
    rateLimitPerMinute:
      typeof data.rateLimitPerMinute === "number" && Number.isFinite(data.rateLimitPerMinute)
        ? clamp(Math.round(data.rateLimitPerMinute), 1, 60)
        : d.rateLimitPerMinute,
    extraInstructions:
      typeof data.extraInstructions === "string" ? data.extraInstructions.slice(0, 2000) : d.extraInstructions,
    saveGenerations: typeof data.saveGenerations === "boolean" ? data.saveGenerations : d.saveGenerations,
  };
}
