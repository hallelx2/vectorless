import type { Context, Next } from "hono";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * IP-based rate limiting for unauthenticated endpoints.
 *
 * Used for DCR (/oauth/register) to prevent abuse.
 * 5 registrations per IP per hour.
 */

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const dcrLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "vl:dcr",
      analytics: false,
    })
  : null;

// In-memory fallback for local dev
const memStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(c: Context): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

/**
 * Rate-limit DCR registrations to 5 per IP per hour.
 */
export async function dcrRateLimit(c: Context, next: Next) {
  const ip = getClientIp(c);

  if (dcrLimiter) {
    // Upstash path (production)
    const { success } = await dcrLimiter.limit(ip);
    if (!success) {
      return c.json(
        {
          error: "too_many_registrations",
          error_description:
            "Rate limit exceeded for client registration. Try again later.",
        },
        429
      );
    }
  } else {
    // In-memory fallback (local dev)
    const now = Date.now();
    const key = `dcr:${ip}`;
    const entry = memStore.get(key);

    if (entry && now < entry.resetAt) {
      if (entry.count >= 5) {
        return c.json(
          {
            error: "too_many_registrations",
            error_description:
              "Rate limit exceeded for client registration. Try again later.",
          },
          429
        );
      }
      entry.count++;
    } else {
      memStore.set(key, { count: 1, resetAt: now + 3600_000 });
    }
  }

  return next();
}
