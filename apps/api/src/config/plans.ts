/**
 * Plan definitions for Vectorless.
 *
 * Three tiers:
 * - Free: Generous for exploration, rate-limited to prevent abuse
 * - Pro: For serious users with higher limits and priority support
 * - Enterprise: Unlimited, custom limits, SLA
 *
 * Pricing aligns with two cost drivers:
 * 1. Queries = LLM calls for tree-agent traversal
 * 2. Ingest pages = LLM calls for summarization during document processing
 */
export const PLANS = {
  free: {
    name: "Free",
    monthlyQueries: 500,
    monthlyIngestPages: 500,
    maxDocumentsStored: 25,
    maxStorageBytes: 100 * 1024 * 1024, // 100 MB
    queryRateLimit: { windowMs: 60_000, max: 20 }, // 20/min
    ingestRateLimit: { windowMs: 60_000, max: 5 }, // 5/min
    treeNavRateLimit: { windowMs: 60_000, max: 120 }, // getToC, fetchSection, etc.
  },
  pro: {
    name: "Pro",
    monthlyQueries: 20_000,
    monthlyIngestPages: 10_000,
    maxDocumentsStored: 500,
    maxStorageBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    queryRateLimit: { windowMs: 60_000, max: 200 },
    ingestRateLimit: { windowMs: 60_000, max: 30 },
    treeNavRateLimit: { windowMs: 60_000, max: 1200 },
  },
  enterprise: {
    name: "Enterprise",
    monthlyQueries: Infinity,
    monthlyIngestPages: Infinity,
    maxDocumentsStored: Infinity,
    maxStorageBytes: Infinity,
    queryRateLimit: { windowMs: 60_000, max: 1000 },
    ingestRateLimit: { windowMs: 60_000, max: 200 },
    treeNavRateLimit: { windowMs: 60_000, max: 10_000 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
export type PlanConfig = (typeof PLANS)[PlanKey];
