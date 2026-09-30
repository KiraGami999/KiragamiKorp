import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderDiff, diffStats } from "../core/diff.ts";
import { acid, dim, green, grey, truncate } from "../core/ui.ts";
import { Workspace, WorkspaceError } from "../core/workspace.ts";
import {
  fail,
  ok,
  optionalBoolean,
  optionalNumber,
  optionalString,
  requireString,
  type Tool,
  type ToolContext,
  type ToolResult,
} from "./registry.ts";

const MAX_READ_LINES = 2000;
const MAX_READ_CHARS = 120_000;
const MAX_WRITE_CHARS = 400_000;

function numberLines(content: string, startLine: number): string {
  return content
    .split("\n")
    .map((text, index) => `${String(startLine + index).padStart(5)}| ${text}`)
    .join("\n");
}

async function readTextFile(workspace: Workspace, relativePath: string): Promise<string> {
  const absolute = workspace.resolve(relativePath);
  if (Workspace.isProbablyBinary(absolute)) {
    throw new WorkspaceError(`${relativePath} looks like a binary file.`);
  }
  return readFile(absolute, "utf8");
}

export const readFileTool: Tool = {
  name: "read_file",
  description:
    "Read a UTF-8 text file from the workspace. Returns the contents with line numbers. " +
    "Always read a file before editing it.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Workspace-relative path, e.g. src/app/page.tsx" },
      offset: { type: "integer", description: "1-based line to start from. Omit to read from the top." },
      limit: { type: "integer", description: "How many lines to read. Omit to read the whole file." },
    },
    required: ["path"],
    additionalProperties: false,
  },
  summarize: (args) => `read ${optionalString(args, "path") ?? "?"}`,
  async execute(args, { workspace }): Promise<ToolResult> {
    const relativePath = requireString(args, "path");

    let contents: string;
    try {
      contents = await readTextFile(workspace, relativePath);
    } catch (error) {
      if (error instanceof WorkspaceError) return fail(error.message);
      return fail(`Could not read ${relativePath}. It may not exist — use list_files or search to check.`);
    }

    if (!contents.trim()) return ok(`${relativePath} is empty.`);

    const allLines = contents.split("\n");
    const offset = Math.max(1, optionalNumber(args, "offset") ?? 1);
    const limit = Math.min(optionalNumber(args, "limit") ?? MAX_READ_LINES, MAX_READ_LINES);
    const slice = allLines.slice(offset - 1, offset - 1 + limit);

    if (!slice.length) {
      return fail(`${relativePath} has ${allLines.length} lines; offset ${offset} is past the end.`);
    }

    const body = truncate(numberLines(slice.join("\n"), offset), MAX_READ_CHARS);
    const shownEnd = offset - 1 + slice.length;
    const footer =
      shownEnd < allLines.length
        ? `\n\n(showing lines ${offset}-${shownEnd} of ${allLines.length})`
        : "";

    return ok(`${relativePath}\n${body}${footer}`, dim(`${allLines.length} lines`));
  },
};

export const listFilesTool: Tool = {
  name: "list_files",
  description:
    "List files in the workspace. Use this to discover what exists before guessing a path. " +
    "Build output, node_modules and secrets are always excluded.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory to list, relative to the workspace root. Defaults to '.'." },
      depth: { type: "integer", description: "How many directory levels to descend. Defaults to 2." },
    },
    additionalProperties: false,
  },
  summarize: (args) => `list ${optionalString(args, "path") ?? "."}`,
  async execute(args, { workspace }): Promise<ToolResult> {
    const target = optionalString(args, "path") ?? ".";
    const depth = Math.max(0, optionalNumber(args, "depth") ?? 2);

    try {
      workspace.resolve(target);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Invalid path.");
    }
    if (!workspace.exists(target)) return fail(`${target} does not exist.`);

    const files: string[] = [];
    for await (const file of workspace.walk({ from: target, maxDepth: depth, limit: 500 })) {
      files.push(file);
    }

    if (!files.length) return ok(`No files under ${target} (at depth ${depth}).`);

    return ok(
      `${files.length} file(s) under ${target}:\n${files.join("\n")}`,
      dim(`${files.length} files`),
    );
  },
};

export const editFileTool: Tool = {
  name: "edit_file",
  description:
    "Replace an exact string in a file. This is the preferred way to change existing code. " +
    "`old_string` must appear exactly once unless replace_all is true, so include enough " +
    "surrounding lines to make it unique. Read the file first.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Workspace-relative path." },
      old_string: { type: "string", description: "Exact text to replace, including indentation." },
      new_string: { type: "string", description: "Replacement text." },
      replace_all: { type: "boolean", description: "Replace every occurrence instead of requiring exactly one." },
    },
    required: ["path", "old_string", "new_string"],
    additionalProperties: false,
  },
  summarize: (args) => `edit ${optionalString(args, "path") ?? "?"}`,
  async execute(args, context): Promise<ToolResult> {
    const { workspace, confirm, config } = context;
    const relativePath = requireString(args, "path");
    const oldString = requireString(args, "old_string");
    const newString = typeof args.new_string === "string" ? args.new_string : "";
    const replaceAll = optionalBoolean(args, "replace_all");

    if (oldString === newString) return fail("old_string and new_string are identical.");

    let before: string;
    let absolute: string;
    try {
      absolute = workspace.resolve(relativePath);
      before = await readTextFile(workspace, relativePath);
    } catch (error) {
      if (error instanceof WorkspaceError) return fail(error.message);
      return fail(`Could not read ${relativePath}.`);
    }

    const occurrences = before.split(oldString).length - 1;
    if (occurrences === 0) {
      return fail(
        `old_string was not found in ${relativePath}. Read the file again — whitespace and indentation must match exactly.`,
      );
    }
    if (occurrences > 1 && !replaceAll) {
      return fail(
        `old_string appears ${occurrences} times in ${relativePath}. Add surrounding context to make it unique, or set replace_all.`,
      );
    }

    const after = replaceAll ? before.split(oldString).join(newString) : before.replace(oldString, newString);
    const stats = diffStats(before, after);
    const diff = renderDiff(before, after);

    const approved = await confirm({
      title: `Edit ${relativePath}`,
      body: diff,
    });
    if (!approved) {
      return fail("The user rejected this edit. Ask what they'd prefer before trying again.");
    }

    await writeFile(absolute, after, "utf8");
    void config;

    return ok(
      `Edited ${relativePath} (+${stats.added} -${stats.removed}).`,
      `${diff}\n${dim(`  ${green(`+${stats.added}`)} ${dim("/")} ${stats.removed ? `-${stats.removed}` : "-0"}`)}`,
    );
  },
};

export const writeFileTool: Tool = {
  name: "write_file",
  description:
    "Write a whole file, creating it and any parent directories if needed. " +
    "Use edit_file for changes to existing files — this overwrites everything.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Workspace-relative path." },
      content: { type: "string", description: "Full file contents." },
    },
    required: ["path", "content"],
    additionalProperties: false,
  },
  summarize: (args) => `write ${optionalString(args, "path") ?? "?"}`,
  async execute(args, { workspace, confirm }): Promise<ToolResult> {
    const relativePath = requireString(args, "path");
    const content = typeof args.content === "string" ? args.content : "";

    if (content.length > MAX_WRITE_CHARS) {
      return fail(`Refusing to write ${content.length} characters; split the work into smaller files.`);
    }

    let absolute: string;
    try {
      absolute = workspace.resolve(relativePath);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Invalid path.");
    }

    let before: string | null = null;
    try {
      if ((await stat(absolute)).isFile()) before = await readFile(absolute, "utf8");
    } catch {
      before = null;
    }

    if (before === content) return ok(`${relativePath} already has exactly that content; nothing to do.`);

    const display =
      before === null
        ? content
            .split("\n")
            .slice(0, 40)
            .map((text, index) => green(`${String(index + 1).padStart(4)} + ${text}`))
            .join("\n")
        : renderDiff(before, content);

    const approved = await confirm({
      title: before === null ? `Create ${relativePath}` : `Overwrite ${relativePath}`,
      body: display,
    });
    if (!approved) {
      return fail("The user rejected this write. Ask what they'd prefer before trying again.");
    }

    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content, "utf8");

    const lineCount = content.split("\n").length;
    return ok(
      before === null
        ? `Created ${relativePath} (${lineCount} lines).`
        : `Overwrote ${relativePath} (${lineCount} lines).`,
      `${display}\n${grey(`  ${acid("✓")} ${before === null ? "created" : "overwritten"}`)}`,
    );
  },
};
