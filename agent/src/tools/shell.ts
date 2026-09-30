import { spawn } from "node:child_process";
import { bold, dim, red } from "../core/ui.ts";
import {
  fail,
  ok,
  optionalNumber,
  optionalString,
  requireString,
  type Tool,
  type ToolResult,
} from "./registry.ts";

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_TIMEOUT_MS = 600_000;
const MAX_OUTPUT_CHARS = 30_000;

/**
 * Commands that are never worth the risk of a mis-click on the confirmation
 * prompt. Everything else is gated behind explicit approval instead.
 */
const BLOCKED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /\brm\s+(-[a-z]*\s+)*-[a-z]*[rf]/i, reason: "recursive delete" },
  { pattern: /\b(del|erase)\s+\/[sq]/i, reason: "recursive delete" },
  { pattern: /\bRemove-Item\b.*-Recurse/i, reason: "recursive delete" },
  { pattern: /\bformat\s+[a-z]:/i, reason: "disk format" },
  { pattern: /\bmkfs\b/i, reason: "disk format" },
  { pattern: /\b(shutdown|reboot)\b/i, reason: "power control" },
  { pattern: /\bgit\s+push\b.*--force/i, reason: "force push" },
  { pattern: /\bgit\s+reset\b.*--hard/i, reason: "destructive reset" },
  { pattern: /:\(\)\s*\{.*\}\s*;\s*:/, reason: "fork bomb" },
  { pattern: />\s*\/dev\/sd[a-z]/i, reason: "raw disk write" },
];

function clip(text: string): string {
  if (text.length <= MAX_OUTPUT_CHARS) return text;
  const head = text.slice(0, MAX_OUTPUT_CHARS * 0.6);
  const tail = text.slice(-MAX_OUTPUT_CHARS * 0.4);
  return `${head}\n… ${text.length - MAX_OUTPUT_CHARS} characters trimmed from the middle …\n${tail}`;
}

interface CommandOutcome {
  code: number | null;
  output: string;
  timedOut: boolean;
}

function runCommand(command: string, cwd: string, timeoutMs: number): Promise<CommandOutcome> {
  return new Promise((resolve) => {
    const child = spawn(command, { cwd, shell: true, windowsHide: true });

    let output = "";
    let timedOut = false;

    const append = (chunk: Buffer) => {
      // Keep a bounded buffer so a runaway watch process can't exhaust memory.
      output += chunk.toString("utf8");
      if (output.length > MAX_OUTPUT_CHARS * 4) {
        output = output.slice(-MAX_OUTPUT_CHARS * 2);
      }
    };

    child.stdout?.on("data", append);
    child.stderr?.on("data", append);

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ code: null, output: `${output}\n${error.message}`, timedOut });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, output, timedOut });
    });
  });
}

export const runCommandTool: Tool = {
  name: "run_command",
  description:
    "Run a shell command in the workspace root and return its combined output. " +
    "Use this to verify your work — type checks, linters, tests, builds, git status. " +
    "Do not start long-running servers or watch processes; they will time out.",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "The command line to run, e.g. npx tsc --noEmit" },
      timeout_seconds: { type: "integer", description: "Defaults to 120." },
    },
    required: ["command"],
    additionalProperties: false,
  },
  summarize: (args) => `run ${optionalString(args, "command") ?? "?"}`,
  async execute(args, { workspace, confirm }): Promise<ToolResult> {
    const command = requireString(args, "command").trim();

    const blocked = BLOCKED_PATTERNS.find((entry) => entry.pattern.test(command));
    if (blocked) {
      return fail(
        `Refusing to run this command (${blocked.reason}). If you genuinely need it, ask the user to run it themselves.`,
      );
    }

    const seconds = optionalNumber(args, "timeout_seconds");
    const timeoutMs = Math.min(seconds ? seconds * 1000 : DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

    const approved = await confirm({
      title: "Run command",
      body: `  ${bold(command)}\n  ${dim(`in ${workspace.root}`)}`,
      danger: true,
    });
    if (!approved) {
      return fail("The user rejected this command. Ask before trying a different one.");
    }

    const started = Date.now();
    const outcome = await runCommand(command, workspace.root, timeoutMs);
    const elapsed = Math.round((Date.now() - started) / 100) / 10;

    const body = clip(outcome.output.trim()) || "(no output)";
    const status = outcome.timedOut
      ? `timed out after ${timeoutMs / 1000}s`
      : `exit code ${outcome.code ?? "unknown"}`;

    const summary = `$ ${command}\n${status} in ${elapsed}s\n\n${body}`;
    const display =
      `  ${dim("$")} ${bold(command)}\n` +
      `${body
        .split("\n")
        .slice(0, 40)
        .map((entry) => `  ${dim(entry)}`)
        .join("\n")}\n` +
      `  ${outcome.code === 0 ? dim(status) : red(status)}`;

    return ok(summary, display);
  },
};
