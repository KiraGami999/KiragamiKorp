import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type ProviderId = "groq" | "ollama" | "custom";

export interface AgentConfig {
  provider: ProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxIterations: number;
  /** Skip the confirmation prompt for writes and commands. */
  autoApprove: boolean;
}

interface Preset {
  baseUrl: string;
  model: string;
  /** Local servers ignore the key, but the OpenAI wire format requires one. */
  defaultKey?: string;
}

const PRESETS: Record<Exclude<ProviderId, "custom">, Preset> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "openai/gpt-oss-120b",
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    model: "qwen2.5-coder:7b",
    defaultKey: "ollama",
  },
};

/** Minimal .env parser — enough for KEY=value and quoted values. */
function parseEnv(contents: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of contents.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }

  return result;
}

/**
 * Loads .env.local then .env, walking up from the workspace so a nested
 * package still finds the repo-root key. Real environment variables win.
 */
export function loadEnvFiles(root: string): void {
  const directories: string[] = [];
  let current = path.resolve(root);

  for (let depth = 0; depth < 5; depth += 1) {
    directories.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  for (const directory of directories) {
    for (const name of [".env.local", ".env"]) {
      const file = path.join(directory, name);
      if (!existsSync(file)) continue;

      try {
        const values = parseEnv(readFileSync(file, "utf8"));
        for (const [key, value] of Object.entries(values)) {
          if (process.env[key] === undefined) process.env[key] = value;
        }
      } catch {
        // A malformed env file shouldn't stop the agent from starting.
      }
    }
  }
}

export interface ConfigOverrides {
  provider?: ProviderId;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  autoApprove?: boolean;
}

export function resolveConfig(overrides: ConfigOverrides = {}): AgentConfig {
  const provider: ProviderId =
    overrides.provider ?? (process.env.KORP_PROVIDER as ProviderId | undefined) ?? "groq";

  const preset = provider === "custom" ? undefined : PRESETS[provider];

  const baseUrl = (
    overrides.baseUrl ??
    process.env.KORP_BASE_URL ??
    process.env.LLM_BASE_URL ??
    preset?.baseUrl ??
    ""
  ).replace(/\/+$/, "");

  const apiKey =
    process.env.KORP_API_KEY ??
    process.env.LLM_API_KEY ??
    process.env.GROQ_API_KEY ??
    preset?.defaultKey ??
    "";

  const model = overrides.model ?? process.env.KORP_MODEL ?? process.env.LLM_MODEL ?? preset?.model ?? "";

  const envTemperature = Number.parseFloat(process.env.KORP_TEMPERATURE ?? "");
  const temperature = overrides.temperature ?? envTemperature;

  return {
    provider,
    baseUrl,
    apiKey,
    model,
    temperature: Number.isFinite(temperature) ? temperature : 0.2,
    maxIterations: Number.parseInt(process.env.KORP_MAX_ITERATIONS ?? "", 10) || 30,
    autoApprove: overrides.autoApprove ?? process.env.KORP_AUTO_APPROVE === "1",
  };
}

export function describeConfigProblem(config: AgentConfig): string | null {
  if (!config.baseUrl) return "No base URL. Pass --base-url or set KORP_BASE_URL.";
  if (!config.model) return "No model. Pass --model or set KORP_MODEL.";
  if (!config.apiKey) {
    return config.provider === "groq"
      ? "No API key. Add GROQ_API_KEY to .env.local in the project root."
      : "No API key. Set KORP_API_KEY (any non-empty value works for local servers).";
  }
  return null;
}
