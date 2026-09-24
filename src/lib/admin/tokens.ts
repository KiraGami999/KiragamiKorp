export const GATE_COOKIE = "kk_gate";
export const SESSION_COOKIE = "kk_session";

const GATE_MAX_AGE = 60 * 60; // 1 hour to complete login
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.GROQ_API_KEY ?? "kiragamikorp-dev-secret";
}

function getGatePhrase(): string {
  return process.env.GATE_PHRASE ?? "Screw Arasaka";
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toHex(signature);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyGatePhrase(input: string): boolean {
  return safeEqual(input.trim(), getGatePhrase());
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

export async function createGateToken(): Promise<string> {
  const payload = `gate:${Date.now()}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyGateToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, await sign(payload))) return false;
  const issued = Number(payload.split(":")[1]);
  if (!Number.isFinite(issued)) return false;
  return Date.now() - issued < GATE_MAX_AGE * 1000;
}

export async function createSessionToken(username: string): Promise<string> {
  const payload = `session:${username}:${Date.now()}:${randomNonce()}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<{ username: string } | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!safeEqual(signature, await sign(payload))) return null;

  const parts = payload.split(":");
  if (parts[0] !== "session" || parts.length < 4) return null;
  const username = parts[1];
  const issued = Number(parts[2]);
  if (!username || !Number.isFinite(issued)) return null;
  if (Date.now() - issued > SESSION_MAX_AGE * 1000) return null;
  return { username };
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.DATABASE_URL);
}

export const cookieOptions = {
  gate: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GATE_MAX_AGE,
  },
  session: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  },
};
