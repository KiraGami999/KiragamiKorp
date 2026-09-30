#!/usr/bin/env node
// Runs the TypeScript entry point through tsx, so there is no build step.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, "..", "src", "main.ts");

const localBin = path.join(here, "..", "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
const runner = existsSync(localBin) ? localBin : "npx";
const args = runner === "npx" ? ["tsx", entry, ...process.argv.slice(2)] : [entry, ...process.argv.slice(2)];

spawn(runner, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
}).on("exit", (code) => {
  process.exit(code ?? 0);
});
