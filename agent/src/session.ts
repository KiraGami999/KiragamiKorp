import type { AgentConfig } from "./config.ts";
import { chat, ProviderError, type Message, type ToolCall } from "./provider.ts";
import { buildSystemPrompt } from "./prompts.ts";
import type { Workspace } from "./core/workspace.ts";
import type { ConfirmRequest, ToolRegistry, ToolResult } from "./tools/registry.ts";
import { ToolError } from "./tools/registry.ts";
import { acid, bold, dim, formatNumber, indent, line, red, startSpinner, yellow } from "./core/ui.ts";

export interface SessionOptions {
  workspace: Workspace;
  registry: ToolRegistry;
  config: AgentConfig;
  confirm(request: ConfirmRequest): Promise<boolean>;
}

/** Renders the small subset of markdown models actually use in replies. */
function renderAssistantText(text: string): string {
  return text
    .split("\n")
    .map((entry) => {
      if (/^#{1,6}\s/.test(entry)) return bold(entry.replace(/^#{1,6}\s/, ""));
      return entry
        .replace(/\*\*(.+?)\*\*/g, (_, inner: string) => bold(inner))
        .replace(/`([^`]+)`/g, (_, inner: string) => acid(inner));
    })
    .join("\n");
}

export class Session {
  private messages: Message[] = [];
  private systemPrompt: string | null = null;
  private promptTokens = 0;
  private completionTokens = 0;
  private turns = 0;

  constructor(private readonly options: SessionOptions) {}

  get config(): AgentConfig {
    return this.options.config;
  }

  setModel(model: string): void {
    this.options.config.model = model;
  }

  stats(): { promptTokens: number; completionTokens: number; turns: number; messages: number } {
    return {
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      turns: this.turns,
      messages: this.messages.length,
    };
  }

  clear(): void {
    this.messages = [];
    this.turns = 0;
  }

  private async ensureSystemPrompt(): Promise<string> {
    this.systemPrompt ??= await buildSystemPrompt(this.options.workspace);
    return this.systemPrompt;
  }

  private async executeToolCall(call: ToolCall): Promise<ToolResult> {
    const tool = this.options.registry.get(call.function.name);
    if (!tool) {
      const available = this.options.registry
        .list()
        .map((entry) => entry.name)
        .join(", ");
      return { output: `Error: no tool named "${call.function.name}". Available tools: ${available}.`, isError: true };
    }

    let args: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(call.function.arguments || "{}");
      args = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    } catch {
      return { output: "Error: tool arguments were not valid JSON. Send the arguments again.", isError: true };
    }

    line(`${acid("●")} ${bold(tool.summarize(args))}`);

    try {
      const result = await tool.execute(args, {
        workspace: this.options.workspace,
        config: this.options.config,
        confirm: this.options.confirm,
      });

      const rendered = result.display ?? (result.isError ? red(result.output) : dim(result.output.split("\n")[0] ?? ""));
      if (rendered.trim()) line(indent(rendered));
      line();

      return result;
    } catch (error) {
      const message =
        error instanceof ToolError
          ? error.message
          : error instanceof Error
            ? error.message
            : "The tool failed for an unknown reason.";
      line(indent(red(message)));
      line();
      return { output: `Error: ${message}`, isError: true };
    }
  }

  /** Runs one user turn to completion, including any tool calls it triggers. */
  async run(userInput: string): Promise<void> {
    const system = await this.ensureSystemPrompt();
    this.messages.push({ role: "user", content: userInput });
    this.turns += 1;

    for (let iteration = 0; iteration < this.options.config.maxIterations; iteration += 1) {
      const spinner = startSpinner(iteration === 0 ? "thinking" : "working");

      let result;
      try {
        result = await chat(
          [{ role: "system", content: system }, ...this.messages],
          this.options.registry.schemas(),
          this.options.config,
          (attempt, reason) => spinner.update(`retrying after ${reason.slice(0, 60)} (attempt ${attempt + 1})`),
        );
      } catch (error) {
        spinner.stop();
        if (error instanceof ProviderError) {
          line(`${red("✗")} ${error.message}`);
          if (error.status === 401) line(dim("  Check your API key in .env.local."));
          if (error.status === 404) line(dim(`  Model "${this.options.config.model}" may not exist. Try /models.`));
        } else {
          line(`${red("✗")} ${error instanceof Error ? error.message : String(error)}`);
        }
        line();
        return;
      }
      spinner.stop();

      this.promptTokens += result.usage.promptTokens;
      this.completionTokens += result.usage.completionTokens;

      if (result.content) {
        line(renderAssistantText(result.content));
        line();
      }

      if (!result.toolCalls.length) {
        this.messages.push({ role: "assistant", content: result.content });
        return;
      }

      this.messages.push({
        role: "assistant",
        content: result.content,
        tool_calls: result.toolCalls,
      });

      for (const call of result.toolCalls) {
        const toolResult = await this.executeToolCall(call);
        this.messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: call.function.name,
          content: toolResult.output,
        });
      }
    }

    line(
      `${yellow("!")} Stopped after ${this.options.config.maxIterations} steps. ` +
        dim("Ask me to continue, or narrow the task."),
    );
    line();
  }

  usageSummary(): string {
    return dim(
      `${formatNumber(this.promptTokens)} in / ${formatNumber(this.completionTokens)} out tokens · ${this.turns} turns`,
    );
  }
}
