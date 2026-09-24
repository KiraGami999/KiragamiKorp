import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PREFIX = "scrypt";

/** Format: scrypt:<saltHex>:<hashHex> */
export function hashSecret(value: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(value, salt, 64);
  return `${PREFIX}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifySecret(value: string, stored: string): boolean {
  const [prefix, saltHex, hashHex] = stored.split(":");
  if (prefix !== PREFIX || !saltHex || !hashHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const actual = scryptSync(value, salt, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
