import type { AgentConfig } from "../config.ts";
import type { ToolSchema } from "../provider.ts";
import type { Workspace } from "../core/workspace.ts";

export interface ConfirmRequest {
  /** One-line description of the action, e.g. "Edit src/app/page.tsx". */
  title: string;
  /** Rendered detail shown above the prompt — a diff or the command line. */
  body?: string;
  danger?: boolean;
}

export interface ToolContext {
  workspace: Workspace;
  config: AgentConfig;
  confirm(request: ConfirmRequest): Promise<boolean>;
}

export interface ToolResult {
  /** Text returned to the model. */
  output: string;
  /** Richer rendering for the human, shown instead of `output` when present. */
  display?: string;
  isError?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  /** Compact transcript label, e.g. `read src/main.ts`. */
  summarize(args: Record<string, unknown>): string;
  execute(args: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
}

export class ToolError extends Error {}

export function ok(output: string, display?: string): ToolResult {
  return display === undefined ? { output } : { output, display };
}

export function fail(message: string): ToolResult {
  return { output: `Error: ${message}`, isError: true };
}

export function requireString(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || !value) {
    throw new ToolError(`\`${key}\` must be a non-empty string.`);
  }
  return value;
}

export function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value ? value : undefined;
}

export function optionalNumber(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function optionalBoolean(args: Record<string, unknown>, key: string): boolean {
  return args[key] === true || args[key] === "true";
}

export class ToolRegistry {
  private readonly tools = new Map<string, Tool>();

  constructor(tools: Tool[]) {
    for (const tool of tools) this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return [...this.tools.values()];
  }

  schemas(): ToolSchema[] {
    return this.list().map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}
