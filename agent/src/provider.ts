import type { AgentConfig } from "./config.ts";

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type Message =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; name?: string; content: string };

export interface ToolSchema {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
}

export interface ChatResult {
  content: string | null;
  toolCalls: ToolCall[];
  usage: Usage;
  finishReason: string;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

const REQUEST_TIMEOUT_MS = 180_000;
const MAX_ATTEMPTS = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readToolCalls(raw: unknown): ToolCall[] {
  if (!Array.isArray(raw)) return [];

  const calls: ToolCall[] = [];
  for (const [index, entry] of raw.entries()) {
    if (!isRecord(entry) || !isRecord(entry.function)) continue;
    const name = entry.function.name;
    if (typeof name !== "string") continue;

    calls.push({
      id: typeof entry.id === "string" && entry.id ? entry.id : `call_${index}`,
      type: "function",
      function: {
        name,
        arguments: typeof entry.function.arguments === "string" ? entry.function.arguments : "{}",
      },
    });
  }
  return calls;
}

async function requestOnce(
  messages: Message[],
  tools: ToolSchema[],
  config: AgentConfig,
  signal: AbortSignal,
): Promise<ChatResult> {
  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: config.temperature,
        messages,
        ...(tools.length ? { tools, tool_choice: "auto", parallel_tool_calls: false } : {}),
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
      throw new ProviderError("The model timed out.", undefined, true);
    }
    throw new ProviderError(`Could not reach ${config.baseUrl}. Is the server running?`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let detail = body.slice(0, 400);
    try {
      const parsed: unknown = JSON.parse(body);
      if (isRecord(parsed) && isRecord(parsed.error) && typeof parsed.error.message === "string") {
        detail = parsed.error.message;
      }
    } catch {
      // Keep the raw body.
    }
    const retryable = response.status === 429 || response.status >= 500;
    throw new ProviderError(`${response.status} — ${detail || response.statusText}`, response.status, retryable);
  }

  const data: unknown = await response.json();
  if (!isRecord(data) || !Array.isArray(data.choices) || !isRecord(data.choices[0])) {
    throw new ProviderError("The model returned an unexpected response shape.");
  }

  const choice = data.choices[0];
  const message = isRecord(choice.message) ? choice.message : {};
  const usage = isRecord(data.usage) ? data.usage : {};

  return {
    content: typeof message.content === "string" && message.content.trim() ? message.content : null,
    toolCalls: readToolCalls(message.tool_calls),
    usage: {
      promptTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : 0,
      completionTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : 0,
    },
    finishReason: typeof choice.finish_reason === "string" ? choice.finish_reason : "stop",
  };
}

/** Sends one chat turn, retrying rate limits and server errors with backoff. */
export async function chat(
  messages: Message[],
  tools: ToolSchema[],
  config: AgentConfig,
  onRetry?: (attempt: number, reason: string) => void,
): Promise<ChatResult> {
  let lastError: ProviderError | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await requestOnce(messages, tools, config, controller.signal);
    } catch (error) {
      lastError = error instanceof ProviderError ? error : new ProviderError(String(error));
      if (!lastError.retryable || attempt === MAX_ATTEMPTS) throw lastError;

      const delay = 1000 * 2 ** (attempt - 1);
      onRetry?.(attempt, lastError.message);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new ProviderError("Request failed.");
}

/** Lists model ids the endpoint exposes, for the /models command. */
export async function listModels(config: AgentConfig): Promise<string[]> {
  const response = await fetch(`${config.baseUrl}/models`, {
    headers: { Authorization: `Bearer ${config.apiKey}` },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) throw new ProviderError(`Provider returned ${response.status}.`, response.status);

  const data: unknown = await response.json();
  if (!isRecord(data) || !Array.isArray(data.data)) return [];

  return data.data
    .map((entry) => (isRecord(entry) && typeof entry.id === "string" ? entry.id : null))
    .filter((id): id is string => id !== null)
    .sort();
}
