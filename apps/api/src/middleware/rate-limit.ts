import type { Context, Next } from "hono";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { PLANS, type PlanKey } from "../config/plans.js";
import { tooManyRequests } from "./error-handler.js";

// ── Upstash Redis (production) ──

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// Cache limiter instances per (windowMs, max) pair to avoid re-creating them
const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(windowMs: number, max: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${windowMs}:${max}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowMs / 1000} s`),
      prefix: "vl:rl",
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// ── In-memory fallback (local dev / single-process) ──

interface RateLimitEntry {
  timestamps: number[];
}

const memStore = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 120_000);
    if (entry.timestamps.length === 0) {
      memStore.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

function inMemoryCheck(
  identifier: string,
  windowMs: number,
  max: number
): { success: boolean; limit: number; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  let entry = memStore.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    memStore.set(identifier, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= max) {
    const oldestInWindow = entry.timestamps[0]!;
    const resetMs = oldestInWindow + windowMs;
    return { success: false, limit: max, remaining: 0, resetMs };
  }

  entry.timestamps.push(now);
  return {
    success: true,
    limit: max,
    remaining: max - entry.timestamps.length,
    resetMs: now + windowMs,
  };
}

// ── Exported middleware ──

type RateLimitKind = "query" | "ingest" | "tree_nav";

/**
 * Rate-limit middleware factory.
 *
 * Uses Upstash Redis in production (when UPSTASH_REDIS_REST_URL is set),
 * falls back to in-memory sliding window for local dev.
 *
 * Usage:
 * ```ts
 * app.post("/v1/documents/:id/query", authMiddleware, rateLimitFor("query"), handler);
 * ```
 */
export function rateLimitFor(kind: RateLimitKind) {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth") as {
      projectId: string;
      apiKeyId: string;
      userId?: string;
      plan?: string;
    };

    const planKey = (auth.plan ?? "free") as PlanKey;
    const plan = PLANS[planKey] ?? PLANS.free;

    const cfg = {
      query: plan.queryRateLimit,
      ingest: plan.ingestRateLimit,
      tree_nav: plan.treeNavRateLimit,
    }[kind];

    const identifier = `${auth.userId ?? auth.projectId}:${kind}`;

    let success: boolean;
    let limit: number;
    let remaining: number;
    let resetMs: number;

    const upstashLimiter = getUpstashLimiter(cfg.windowMs, cfg.max);
    if (upstashLimiter) {
      const result = await upstashLimiter.limit(identifier);
      success = result.success;
      limit = result.limit;
      remaining = result.remaining;
      resetMs = result.reset;
    } else {
      // In-memory fallback for local dev
      ({ success, limit, remaining, resetMs } = inMemoryCheck(
        identifier,
        cfg.windowMs,
        cfg.max
      ));
    }

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.floor(resetMs / 1000)));

    if (!success) {
      c.header(
        "Retry-After",
        String(Math.ceil((resetMs - Date.now()) / 1000))
      );
      throw tooManyRequests(
        `Rate limit exceeded for ${kind}. ` +
          `Current plan: ${plan.name} (${cfg.max} per ${cfg.windowMs / 1000}s). ` +
          `Upgrade at vectorless.store/dashboard/billing.`
      );
    }

    await next();
  };
}
