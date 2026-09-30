const colorEnabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function wrap(open: number, close: number) {
  return (value: string): string => (colorEnabled ? `\x1b[${open}m${value}\x1b[${close}m` : value);
}

export const bold = wrap(1, 22);
export const dim = wrap(2, 22);
export const italic = wrap(3, 23);
export const red = wrap(31, 39);
export const green = wrap(32, 39);
export const yellow = wrap(33, 39);
export const blue = wrap(34, 39);
export const magenta = wrap(35, 39);
export const cyan = wrap(36, 39);
export const grey = wrap(90, 39);
/** KiragamiKorp acid yellow. */
export const acid = wrap(93, 39);
export const onAcid = wrap(103, 49);
export const onRed = wrap(41, 49);

export function stripAnsi(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}

export function write(text: string): void {
  process.stdout.write(text);
}

export function line(text = ""): void {
  process.stdout.write(`${text}\n`);
}

export function rule(label?: string): void {
  const width = Math.min(process.stdout.columns ?? 80, 100);
  if (!label) {
    line(grey("─".repeat(width)));
    return;
  }
  const text = ` ${label} `;
  const left = 2;
  const right = Math.max(0, width - text.length - left);
  line(grey("─".repeat(left)) + dim(text) + grey("─".repeat(right)));
}

/** Indents every line of a block, for nesting tool output under a header. */
export function indent(text: string, prefix = "  "): string {
  return text
    .split("\n")
    .map((entry) => prefix + entry)
    .join("\n");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n${dim(`… truncated ${text.length - maxLength} more characters`)}`;
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface Spinner {
  update(label: string): void;
  stop(): void;
}

export function startSpinner(label: string): Spinner {
  if (!process.stdout.isTTY) {
    line(dim(`… ${label}`));
    return { update: () => {}, stop: () => {} };
  }

  let current = label;
  let frame = 0;
  const started = Date.now();

  const render = () => {
    const seconds = Math.round((Date.now() - started) / 1000);
    const elapsed = seconds >= 1 ? dim(` ${seconds}s`) : "";
    const symbol = SPINNER_FRAMES[frame % SPINNER_FRAMES.length] ?? "⠋";
    process.stdout.write(`\r\x1b[K${acid(symbol)} ${dim(current)}${elapsed}`);
    frame += 1;
  };

  render();
  const timer = setInterval(render, 90);
  timer.unref();

  return {
    update(next: string) {
      current = next;
    },
    stop() {
      clearInterval(timer);
      process.stdout.write("\r\x1b[K");
    },
  };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}
