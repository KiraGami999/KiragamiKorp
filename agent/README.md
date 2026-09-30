# KORP — the KiragamiKorp coding agent

A coding agent that reads and edits this repo from the terminal. Roughly what Cursor's
agent does, built from scratch so every part is inspectable — no runtime dependencies,
about 1,500 lines of TypeScript.

It talks to any OpenAI-compatible endpoint, so the same agent runs against Groq in the
cloud or a model on your own machine.

## Setup

```bash
cd agent
npm install
```

Then put a key in the project root's `.env.local`:

```
GROQ_API_KEY=gsk_...
```

Get one free at [console.groq.com](https://console.groq.com/keys).

## Use

```bash
node agent/bin/korp.js                          # interactive session
node agent/bin/korp.js "fix the nav overlap"    # one task, then exit
```

Run it from the directory you want it to work in — it finds the nearest `package.json`
or `.git` and treats that as the workspace.

| Flag | Effect |
| --- | --- |
| `-m, --model <id>` | Model to use |
| `--provider groq\|ollama` | Defaults to `groq` |
| `--local` | Shorthand for `--provider ollama` |
| `--base-url <url>` | Any OpenAI-compatible endpoint |
| `--temperature <n>` | Defaults to `0.2` |
| `--yolo` | Skip approval prompts |

In a session: `/help`, `/clear`, `/model`, `/models`, `/tools`, `/status`, `/exit`.

## Running against a local model

```bash
ollama serve
ollama pull qwen2.5-coder:7b
node agent/bin/korp.js --local
```

On a 4 GB card a 3B model is the comfortable ceiling and a 7B needs CPU offload, which is
slow enough that agent loops get tedious. Local is best for autocomplete-sized work today;
use Groq for the reasoning until there's more VRAM in the machine.

## How it works

The loop is the whole idea, and it's small:

1. Send the conversation plus the tool schemas to the model.
2. If it replies with tool calls, run them and append the results as `tool` messages.
3. Repeat until it replies with text instead of tool calls, or hits `maxIterations`.

```
src/
  main.ts          CLI, REPL, approval prompts
  session.ts       the agent loop
  prompts.ts       system prompt (the agent's behaviour lives here)
  provider.ts      OpenAI-compatible chat + tool calling, with retries
  config.ts        env/flag resolution, provider presets
  core/
    workspace.ts   path sandboxing, ignore rules, repo map
    diff.ts        LCS line diff and rendering
    ui.ts          ANSI output
  tools/
    registry.ts    tool interface and JSON schemas
    files.ts       read_file, list_files, edit_file, write_file
    search.ts      regex search with glob filtering
    shell.ts       run_command
```

Quality comes mostly from `prompts.ts` and the tool design, not from the model. If the
agent behaves badly, change the system prompt before changing the model.

## Safety

- **Path sandboxing.** Every path resolves against the workspace root; anything that
  escapes it is rejected, including absolute paths and `..` traversal.
- **Secrets are unreadable.** `.env*`, `*.pem`, `*.key`, SSH keys and `.npmrc` are blocked
  for reads, writes and search, so they can never reach the model's context. The CLI reads
  `.env` files itself to find its own API key — that path never goes through a tool.
- **Approval required.** Every write shows a diff and every command shows the command line
  before it runs. `a` at the prompt approves the rest of the session; `--yolo` skips it.
- **Blocked outright.** Recursive deletes, disk formats, force pushes, hard resets and
  shutdowns are refused before the prompt, so a mis-typed `y` can't cause them.
- **Bounded.** Commands time out, output is clipped, and the loop stops after
  `maxIterations` steps.

## Next

Streaming responses, a repo index so it stops re-reading files, conversation persistence,
sub-agents for parallel exploration, and a VS Code extension once the CLI earns its keep.
