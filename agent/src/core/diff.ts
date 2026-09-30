import { dim, green, grey, red } from "./ui.ts";

type Op = { type: "equal" | "add" | "del"; text: string };

/** Above this many cells the LCS table costs more than the nicer output is worth. */
const LCS_CELL_BUDGET = 2_000_000;

function lcsOps(a: string[], b: string[]): Op[] {
  const rows = a.length;
  const columns = b.length;

  if (rows * columns > LCS_CELL_BUDGET) {
    return [
      ...a.map((text) => ({ type: "del" as const, text })),
      ...b.map((text) => ({ type: "add" as const, text })),
    ];
  }

  // table[i][j] = LCS length of a[i..] and b[j..]
  const table = new Int32Array((rows + 1) * (columns + 1));
  const at = (i: number, j: number) => i * (columns + 1) + j;

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = columns - 1; j >= 0; j -= 1) {
      table[at(i, j)] =
        a[i] === b[j]
          ? (table[at(i + 1, j + 1)] ?? 0) + 1
          : Math.max(table[at(i + 1, j)] ?? 0, table[at(i, j + 1)] ?? 0);
    }
  }

  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < columns) {
    if (a[i] === b[j]) {
      ops.push({ type: "equal", text: a[i] as string });
      i += 1;
      j += 1;
    } else if ((table[at(i + 1, j)] ?? 0) >= (table[at(i, j + 1)] ?? 0)) {
      ops.push({ type: "del", text: a[i] as string });
      i += 1;
    } else {
      ops.push({ type: "add", text: b[j] as string });
      j += 1;
    }
  }
  while (i < rows) {
    ops.push({ type: "del", text: a[i] as string });
    i += 1;
  }
  while (j < columns) {
    ops.push({ type: "add", text: b[j] as string });
    j += 1;
  }

  return ops;
}

export interface DiffStats {
  added: number;
  removed: number;
}

export function diffStats(before: string, after: string): DiffStats {
  const ops = diffOps(before, after);
  return {
    added: ops.filter((op) => op.type === "add").length,
    removed: ops.filter((op) => op.type === "del").length,
  };
}

function diffOps(before: string, after: string): Op[] {
  const a = before.split("\n");
  const b = after.split("\n");

  // Trimming the shared head and tail keeps the LCS table small for typical edits.
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head += 1;

  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  ) {
    tail += 1;
  }

  const middle = lcsOps(a.slice(head, a.length - tail), b.slice(head, b.length - tail));

  return [
    ...a.slice(0, head).map((text) => ({ type: "equal" as const, text })),
    ...middle,
    ...a.slice(a.length - tail).map((text) => ({ type: "equal" as const, text })),
  ];
}

/** Renders a unified-style diff with a few lines of context around each change. */
export function renderDiff(before: string, after: string, options: { context?: number; maxLines?: number } = {}): string {
  const { context = 3, maxLines = 160 } = options;
  const ops = diffOps(before, after);

  const keep = new Array<boolean>(ops.length).fill(false);
  ops.forEach((op, index) => {
    if (op.type === "equal") return;
    for (let offset = -context; offset <= context; offset += 1) {
      const target = index + offset;
      if (target >= 0 && target < ops.length) keep[target] = true;
    }
  });

  const output: string[] = [];
  let beforeLine = 1;
  let afterLine = 1;
  let skipping = false;
  let rendered = 0;

  for (const [index, op] of ops.entries()) {
    const number = op.type === "add" ? afterLine : beforeLine;

    if (!keep[index]) {
      if (!skipping) {
        output.push(grey("  ⋮"));
        skipping = true;
      }
    } else {
      skipping = false;
      if (rendered >= maxLines) {
        output.push(dim(`  … diff truncated`));
        break;
      }
      const gutter = String(number).padStart(4);
      if (op.type === "add") output.push(green(`${gutter} + ${op.text}`));
      else if (op.type === "del") output.push(red(`${gutter} - ${op.text}`));
      else output.push(grey(`${gutter}   ${op.text}`));
      rendered += 1;
    }

    if (op.type !== "add") beforeLine += 1;
    if (op.type !== "del") afterLine += 1;
  }

  return output.join("\n");
}
