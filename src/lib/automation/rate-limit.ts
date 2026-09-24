const WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 5;

const hits = new Map<string, number[]>();

/**
 * Sliding-window limiter keyed by client IP. In-memory, so on serverless
 * hosts each instance keeps its own count — enough to stop casual abuse
 * of a free-tier key, not a hard global quota.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= maxRequests) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000);
    hits.set(key, recent);
    return { allowed: false, retryAfterSeconds };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 5_000) {
    for (const [entryKey, times] of hits) {
      if (times.every((time) => now - time >= WINDOW_MS)) hits.delete(entryKey);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
