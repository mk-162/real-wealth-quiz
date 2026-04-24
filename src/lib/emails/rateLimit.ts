/**
 * Process-scope rate limiter for the report-send endpoint.
 *
 * MVP-grade only: the Map lives in module scope, so each serverless
 * function instance holds its own counter and the limit is best-effort
 * across instances / cold starts. That's an acceptable trade for MVP —
 * abuse protection is "slow down an attacker noticeably", not "enforce
 * a hard contractual limit". Phase 2 should move to Vercel KV / Upstash
 * Redis for a shared counter.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the current window resets (0 if allowed). */
  retryAfter: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (current.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }
  current.count += 1;
  return { ok: true, retryAfter: 0 };
}
