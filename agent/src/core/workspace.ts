import { existsSync, statSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

/** Directories that are never listed, searched or read. */
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".cache",
  "dist",
  "build",
  "out",
  "coverage",
  ".venv",
  "__pycache__",
]);

/**
 * Files the agent may never read. Secrets must not reach the model's context,
 * even though the CLI itself loads .env files to find its own API key.
 */
const PROTECTED_PATTERNS = [
  /(^|[/\\])\.env($|\.)/i,
  /(^|[/\\])(id_rsa|id_ed25519)($|\.)/i,
  /\.pem$/i,
  /\.key$/i,
  /(^|[/\\])\.npmrc$/i,
];

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".bmp",
  ".pdf", ".zip", ".gz", ".tar", ".rar", ".7z",
  ".mp3", ".mp4", ".mov", ".avi", ".webm", ".wav",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".exe", ".dll", ".so", ".dylib", ".node", ".wasm",
]);

export class WorkspaceError extends Error {}

export class Workspace {
  constructor(readonly root: string) {}

  /** Finds the nearest project root by walking up for a package.json or .git. */
  static discover(startDirectory: string = process.cwd()): Workspace {
    let current = path.resolve(startDirectory);

    while (true) {
      if (existsSync(path.join(current, "package.json")) || existsSync(path.join(current, ".git"))) {
        return new Workspace(current);
      }
      const parent = path.dirname(current);
      if (parent === current) return new Workspace(path.resolve(startDirectory));
      current = parent;
    }
  }

  /**
   * Resolves a user- or model-supplied path to an absolute one, refusing
   * anything that escapes the workspace root or touches a secret.
   */
  resolve(relativePath: string): string {
    if (!relativePath || typeof relativePath !== "string") {
      throw new WorkspaceError("A path is required.");
    }

    const absolute = path.resolve(this.root, relativePath);
    const relative = path.relative(this.root, absolute);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new WorkspaceError(`Path escapes the workspace: ${relativePath}`);
    }
    if (this.isProtected(relative)) {
      throw new WorkspaceError(`Refusing to touch a secret file: ${relativePath}`);
    }

    return absolute;
  }

  /** Workspace-relative path with forward slashes, for display and model input. */
  relative(absolutePath: string): string {
    return path.relative(this.root, absolutePath).split(path.sep).join("/");
  }

  isProtected(relativePath: string): boolean {
    return PROTECTED_PATTERNS.some((pattern) => pattern.test(relativePath));
  }

  isIgnoredDirectory(name: string): boolean {
    return IGNORED_DIRECTORIES.has(name);
  }

  static isProbablyBinary(filePath: string): boolean {
    return BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
  }

  /** Depth-first walk yielding workspace-relative file paths. */
  async *walk(options: { from?: string; maxDepth?: number; limit?: number } = {}): AsyncGenerator<string> {
    const { from = ".", maxDepth = Infinity, limit = Infinity } = options;
    const start = this.resolve(from);
    let yielded = 0;

    const visit = async function* (this: Workspace, directory: string, depth: number): AsyncGenerator<string> {
      if (depth > maxDepth || yielded >= limit) return;

      let entries;
      try {
        entries = await readdir(directory, { withFileTypes: true });
      } catch {
        return;
      }

      entries.sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? 1 : -1;
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        if (yielded >= limit) return;
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;

        const absolute = path.join(directory, entry.name);
        const relative = this.relative(absolute);

        if (entry.isDirectory()) {
          yield* visit.call(this, absolute, depth + 1);
        } else if (entry.isFile() && !this.isProtected(relative)) {
          yielded += 1;
          yield relative;
        }
      }
    };

    yield* visit.call(this, start, 0);
  }

  /** A compact tree of the project, used to orient the model at session start. */
  async repoMap(limit = 300): Promise<string> {
    const files: string[] = [];
    for await (const file of this.walk({ limit: limit + 1 })) {
      files.push(file);
    }

    const truncated = files.length > limit;
    const shown = files.slice(0, limit);

    const byDirectory = new Map<string, string[]>();
    for (const file of shown) {
      const directory = path.posix.dirname(file);
      const bucket = byDirectory.get(directory);
      if (bucket) bucket.push(path.posix.basename(file));
      else byDirectory.set(directory, [path.posix.basename(file)]);
    }

    const lines: string[] = [];
    for (const [directory, names] of [...byDirectory.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      lines.push(`${directory === "." ? "." : directory}/`);
      lines.push(`  ${names.join("  ")}`);
    }
    if (truncated) lines.push(`… more files not listed (showing first ${limit})`);

    return lines.join("\n");
  }

  exists(relativePath: string): boolean {
    try {
      return existsSync(this.resolve(relativePath));
    } catch {
      return false;
    }
  }

  isDirectory(relativePath: string): boolean {
    try {
      return statSync(this.resolve(relativePath)).isDirectory();
    } catch {
      return false;
    }
  }
}
