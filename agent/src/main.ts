import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { describeConfigProblem, loadEnvFiles, resolveConfig, type ConfigOverrides, type ProviderId } from "./config.ts";
import { listModels } from "./provider.ts";
import { Session } from "./session.ts";
import { Workspace } from "./core/workspace.ts";
import { acid, bold, dim, grey, line, red, rule, startSpinner, yellow } from "./core/ui.ts";
import { ToolRegistry, type ConfirmRequest } from "./tools/registry.ts";
import { editFileTool, listFilesTool, readFileTool, writeFileTool } from "./tools/files.ts";
import { searchTool } from "./tools/search.ts";
import { runCommandTool } from "./tools/shell.ts";

const VERSION = "0.1.0";

interface ParsedArgs {
  overrides: ConfigOverrides;
  prompt: string | null;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const overrides: ConfigOverrides = {};
  const positional: string[] = [];
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] as string;
    const next = () => argv[++index];

    switch (arg) {
      case "-h":
      case "--help":
        help = true;
        break;
      case "-m":
      case "--model":
        overrides.model = next();
        break;
      case "--provider":
        overrides.provider = next() as ProviderId;
        break;
      case "--base-url":
        overrides.baseUrl = next();
        break;
      case "--temperature": {
        const value = Number.parseFloat(next() ?? "");
        if (Number.isFinite(value)) overrides.temperature = value;
        break;
      }
      case "--local":
        overrides.provider = "ollama";
        break;
      case "--yolo":
        overrides.autoApprove = true;
        break;
      default:
        if (arg.startsWith("-")) {
          line(`${yellow("!")} Unknown flag ${arg}`);
        } else {
          positional.push(arg);
        }
    }
  }

  return { overrides, prompt: positional.length ? positional.join(" ") : null, help };
}

function printHelp(): void {
  line(`${bold("korp")} — the KiragamiKorp coding agent`);
  line();
  line(bold("Usage"));
  line("  korp                      start an interactive session");
  line('  korp "fix the nav bug"    run one task and exit');
  line();
  line(bold("Flags"));
  line("  -m, --model <id>          model to use");
  line("      --provider <name>     groq (default) or ollama");
  line("      --local               shorthand for --provider ollama");
  line("      --base-url <url>      any OpenAI-compatible endpoint");
  line("      --temperature <n>     0 to 1, defaults to 0.2");
  line("      --yolo                skip approval prompts");
  line("  -h, --help                show this");
  line();
  line(bold("Environment"));
  line("  Reads .env.local / .env from the project root.");
  line("  GROQ_API_KEY, or KORP_API_KEY / KORP_BASE_URL / KORP_MODEL to override.");
}

function printBanner(workspace: Workspace, provider: string, model: string): void {
  line();
  line(`  ${acid(bold("KORP"))} ${dim(`v${VERSION}`)}  ${grey("·")}  ${dim(`${provider} ${model}`)}`);
  line(`  ${grey(workspace.root)}`);
  line(`  ${dim("/help for commands, /exit to leave")}`);
  line();
}

async function main(): Promise<void> {
  const workspace = Workspace.discover();
  loadEnvFiles(workspace.root);

  const { overrides, prompt, help } = parseArgs(process.argv.slice(2));
  if (help) {
    printHelp();
    return;
  }

  const config = resolveConfig(overrides);
  const problem = describeConfigProblem(config);
  if (problem) {
    line(`${red("✗")} ${problem}`);
    process.exitCode = 1;
    return;
  }

  const registry = new ToolRegistry([
    readFileTool,
    listFilesTool,
    searchTool,
    editFileTool,
    writeFileTool,
    runCommandTool,
  ]);

  const rl = readline.createInterface({ input: stdin, output: stdout });
  let approveEverything = config.autoApprove;

  const confirm = async (request: ConfirmRequest): Promise<boolean> => {
    if (approveEverything) return true;

    if (request.body) {
      line(request.body);
    }

    const choice = (
      await rl.question(
        `  ${request.danger ? yellow("⚠") : acid("?")} ${bold(request.title)} ${dim("[y/N/a=always]")} `,
      )
    )
      .trim()
      .toLowerCase();

    if (choice === "a" || choice === "always") {
      approveEverything = true;
      line(dim("  Approving everything for the rest of this session."));
      return true;
    }
    return choice === "y" || choice === "yes";
  };

  const session = new Session({ workspace, registry, config, confirm });

  if (prompt) {
    await session.run(prompt);
    rl.close();
    return;
  }

  printBanner(workspace, config.provider, config.model);

  rl.on("SIGINT", () => {
    line();
    line(dim("  bye"));
    process.exit(0);
  });

  while (true) {
    let input: string;
    try {
      input = (await rl.question(`${acid("❯")} `)).trim();
    } catch {
      break;
    }

    if (!input) continue;

    if (input.startsWith("/")) {
      const [command = "", ...rest] = input.slice(1).split(/\s+/);
      const argument = rest.join(" ");

      if (command === "exit" || command === "quit") break;

      if (command === "help") {
        line();
        line(`  ${bold("/clear")}        ${dim("forget the conversation so far")}`);
        line(`  ${bold("/model")} <id>   ${dim("switch model")}`);
        line(`  ${bold("/models")}       ${dim("list what the provider offers")}`);
        line(`  ${bold("/tools")}        ${dim("list the agent's tools")}`);
        line(`  ${bold("/status")}       ${dim("workspace, model and token usage")}`);
        line(`  ${bold("/exit")}         ${dim("leave")}`);
        line();
        continue;
      }

      if (command === "clear") {
        session.clear();
        line(dim("  Context cleared."));
        line();
        continue;
      }

      if (command === "model") {
        if (!argument) {
          line(dim(`  Current model: ${config.model}`));
        } else {
          session.setModel(argument);
          line(dim(`  Model set to ${argument}`));
        }
        line();
        continue;
      }

      if (command === "models") {
        const spinner = startSpinner("fetching models");
        try {
          const models = await listModels(config);
          spinner.stop();
          line();
          for (const model of models) {
            line(`  ${model === config.model ? acid("●") : grey("○")} ${model}`);
          }
          line();
        } catch (error) {
          spinner.stop();
          line(`${red("✗")} ${error instanceof Error ? error.message : "Could not list models."}`);
          line();
        }
        continue;
      }

      if (command === "tools") {
        line();
        for (const tool of registry.list()) {
          line(`  ${acid("●")} ${bold(tool.name)}`);
          line(`    ${dim(tool.description.split(".")[0] ?? "")}`);
        }
        line();
        continue;
      }

      if (command === "status") {
        const stats = session.stats();
        line();
        line(`  ${dim("workspace")}  ${workspace.root}`);
        line(`  ${dim("provider")}   ${config.provider} ${grey("·")} ${config.model}`);
        line(`  ${dim("approvals")}  ${approveEverything ? yellow("auto") : "ask each time"}`);
        line(`  ${dim("usage")}      ${session.usageSummary()}`);
        line(`  ${dim("messages")}   ${stats.messages} in context`);
        line();
        continue;
      }

      line(`${yellow("!")} Unknown command /${command}. Try /help.`);
      line();
      continue;
    }

    rule();
    await session.run(input);
  }

  rl.close();
  line(dim(`  ${session.usageSummary()}`));
}

main().catch((error: unknown) => {
  line(`${red("✗")} ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  process.exitCode = 1;
});
