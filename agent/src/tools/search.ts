import { readFile } from "node:fs/promises";
import { dim } from "../core/ui.ts";
import { Workspace } from "../core/workspace.ts";
import {
  fail,
  ok,
  optionalBoolean,
  optionalNumber,
  optionalString,
  requireString,
  type Tool,
  type ToolResult,
} from "./registry.ts";

const MAX_RESULTS = 120;
const MAX_FILE_BYTES = 2_000_000;

function escapeLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Converts a glob such as `src/**\/*.ts` into an anchored regular expression. */
export function globToRegExp(glob: string): RegExp {
  let pattern = "";
  let index = 0;

  while (index < glob.length) {
    const char = glob[index] as string;

    if (char === "*") {
      if (glob[index + 1] === "*") {
        index += 2;
        if (glob[index] === "/") {
          index += 1;
          pattern += "(?:.*/)?";
        } else {
          pattern += ".*";
        }
        continue;
      }
      pattern += "[^/]*";
      index += 1;
      continue;
    }

    if (char === "?") {
      pattern += "[^/]";
      index += 1;
      continue;
    }

    if (char === "{") {
      const close = glob.indexOf("}", index);
      if (close !== -1) {
        const options = glob.slice(index + 1, close).split(",");
        pattern += `(?:${options.map(escapeLiteral).join("|")})`;
        index = close + 1;
        continue;
      }
    }

    pattern += escapeLiteral(char);
    index += 1;
  }

  return new RegExp(`^${pattern}$`);
}

export const searchTool: Tool = {
  name: "search",
  description:
    "Search file contents across the workspace with a regular expression. " +
    "Use this to find where something is defined or used before reading whole files.",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "JavaScript regular expression, e.g. export function \\w+" },
      glob: { type: "string", description: "Limit to matching paths, e.g. src/**/*.ts or *.json" },
      case_sensitive: { type: "boolean", description: "Defaults to false." },
      max_results: { type: "integer", description: `Cap on matching lines. Defaults to 60, max ${MAX_RESULTS}.` },
    },
    required: ["pattern"],
    additionalProperties: false,
  },
  summarize: (args) => {
    const glob = optionalString(args, "glob");
    return `search ${JSON.stringify(optionalString(args, "pattern") ?? "")}${glob ? ` in ${glob}` : ""}`;
  },
  async execute(args, { workspace }): Promise<ToolResult> {
    const rawPattern = requireString(args, "pattern");
    const globPattern = optionalString(args, "glob");
    const limit = Math.min(optionalNumber(args, "max_results") ?? 60, MAX_RESULTS);

    let matcher: RegExp;
    try {
      matcher = new RegExp(rawPattern, optionalBoolean(args, "case_sensitive") ? "" : "i");
    } catch (error) {
      return fail(`Invalid regular expression: ${error instanceof Error ? error.message : "unparseable"}`);
    }

    let globMatcher: RegExp | null = null;
    if (globPattern) {
      try {
        globMatcher = globToRegExp(globPattern);
      } catch {
        return fail(`Invalid glob: ${globPattern}`);
      }
    }

    const results: string[] = [];
    let filesSearched = 0;
    let filesMatched = 0;
    let capped = false;

    for await (const relativePath of workspace.walk({ limit: 5000 })) {
      if (globMatcher && !globMatcher.test(relativePath)) continue;
      if (Workspace.isProbablyBinary(relativePath)) continue;

      let contents: string;
      try {
        const absolute = workspace.resolve(relativePath);
        const buffer = await readFile(absolute);
        if (buffer.byteLength > MAX_FILE_BYTES) continue;
        if (buffer.includes(0)) continue;
        contents = buffer.toString("utf8");
      } catch {
        continue;
      }

      filesSearched += 1;
      let matchedHere = false;

      for (const [index, text] of contents.split("\n").entries()) {
        if (!matcher.test(text)) continue;

        matchedHere = true;
        if (results.length >= limit) {
          capped = true;
          break;
        }
        results.push(`${relativePath}:${index + 1}: ${text.trim().slice(0, 240)}`);
      }

      if (matchedHere) filesMatched += 1;
      if (capped) break;
    }

    if (!results.length) {
      return ok(
        `No matches for /${rawPattern}/${globPattern ? ` in ${globPattern}` : ""} across ${filesSearched} file(s).`,
        dim("no matches"),
      );
    }

    const footer = capped ? `\n… stopped at ${limit} matches; narrow the pattern or glob.` : "";
    return ok(
      `${results.length} match(es) in ${filesMatched} file(s):\n${results.join("\n")}${footer}`,
      dim(`${results.length} matches in ${filesMatched} files`),
    );
  },
};
