import type { Context, Next } from "hono";
import { sql, eq, and, gte } from "drizzle-orm";
import { db } from "../db/client.js";
import { usageRecords, userPlans } from "../db/schema.js";
import { PLANS, type PlanKey } from "../config/plans.js";
import { quotaExceeded } from "./error-handler.js";

type QuotaKind = "query" | "ingest";

/**
 * Get the start of the current billing period for a user.
 * If the user has a plan with explicit period dates, use those.
 * Otherwise, use the first day of the current calendar month.
 */
async function getCurrentPeriodStart(userId: string): Promise<Date> {
  const [plan] = await db
    .select({ currentPeriodStart: userPlans.currentPeriodStart })
    .from(userPlans)
    .where(eq(userPlans.userId, userId))
    .limit(1);

  if (plan?.currentPeriodStart) {
    return new Date(plan.currentPeriodStart);
  }

  // Default: start of current month
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Count usage for a user in the current billing period.
 */
async function countUsage(
  userId: string,
  kind: string,
  periodStart: Date
): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${usageRecords.count}), 0)`,
    })
    .from(usageRecords)
    .where(
      and(
        eq(usageRecords.userId, userId),
        eq(usageRecords.kind, kind as any),
        gte(usageRecords.recordedAt, periodStart)
      )
    );

  return Number(result?.total ?? 0);
}

/**
 * Monthly quota enforcement middleware.
 *
 * Checks the aggregate monthly count against the user's plan limit.
 * Failed requests don't count against the quota — usage is recorded
 * after the request succeeds (by the caller, not this middleware).
 *
 * Usage:
 * ```ts
 * app.post("/v1/documents/:id/query", authMiddleware, rateLimitFor("query"), quotaCheck("query"), handler);
 * ```
 */
export function quotaCheck(kind: QuotaKind) {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth") as {
      projectId: string;
      apiKeyId: string;
      userId?: string;
      plan?: string;
    };

    const planKey = (auth.plan ?? "free") as PlanKey;
    const plan = PLANS[planKey] ?? PLANS.free;
    const cap =
      kind === "query" ? plan.monthlyQueries : plan.monthlyIngestPages;

    // Enterprise plan has Infinity — skip the check
    if (cap === Infinity) {
      await next();
      return;
    }

    const userId = auth.userId ?? auth.projectId;
    const periodStart = await getCurrentPeriodStart(userId);
    const usageKind =
      kind === "query" ? "query" : "ingest_page";
    const used = await countUsage(userId, usageKind, periodStart);

    // Set usage headers
    c.header("X-Quota-Limit", String(cap));
    c.header("X-Quota-Used", String(used));
    c.header("X-Quota-Remaining", String(Math.max(0, cap - used)));

    if (used >= cap) {
      throw quotaExceeded(
        `Monthly ${kind} quota reached (${used}/${cap}). ` +
          `Current plan: ${plan.name}. ` +
          `Upgrade at vectorless.store/dashboard/billing.`
      );
    }

    await next();
  };
}

/**
 * Record a usage event (call after successful request, fire-and-forget).
 */
export function recordUsage(params: {
  userId: string;
  projectId: string;
  kind: "query" | "ingest_page" | "tree_nav";
  count?: number;
  metadata?: Record<string, unknown>;
}) {
  // Fire-and-forget — don't block the response
  db.insert(usageRecords)
    .values({
      userId: params.userId,
      projectId: params.projectId,
      kind: params.kind,
      count: params.count ?? 1,
      metadata: params.metadata ?? null,
    })
    .execute()
    .catch((err) => {
      console.error("[quota] Failed to record usage:", err);
    });
}
