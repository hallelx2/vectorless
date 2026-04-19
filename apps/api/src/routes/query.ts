import { Hono } from "hono";
import type { Variables } from "../app.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimitFor } from "../middleware/rate-limit.js";
import { quotaCheck, recordUsage } from "../middleware/quota.js";
import { getDocument } from "../services/document.service.js";
import { runTreeAgent } from "../services/retrieval/tree-agent.js";
import { notFound, conflict, badRequest } from "../middleware/error-handler.js";

const app = new Hono<{ Variables: Variables }>();

/**
 * POST /v1/documents/:id/query
 *
 * Agentic tree traversal retrieval. The LLM navigates the document's
 * hierarchical section tree to find and retrieve relevant content.
 *
 * Body: { query: string, max_steps?: number, token_budget?: number }
 * Returns: TreeQueryResult with sections, traversal trace, and reasoning
 */
app.post(
  "/documents/:id/query",
  authMiddleware,
  rateLimitFor("query"),
  quotaCheck("query"),
  async (c) => {
    const id = c.req.param("id")!;
    const auth = c.get("auth");
    const { projectId } = auth;

    const body = await c.req.json<{
      query?: string;
      max_steps?: number;
      token_budget?: number;
    }>();

    if (!body.query?.trim()) {
      throw badRequest("query is required");
    }

    const doc = await getDocument(id, projectId);
    if (!doc) throw notFound(`Document ${id} not found`);
    if (doc.status === "processing") {
      throw conflict("Document is still being processed");
    }
    if (doc.status === "failed") {
      throw conflict(`Document processing failed: ${doc.errorMessage}`);
    }

    const result = await runTreeAgent({
      docId: id,
      projectId,
      query: body.query.trim(),
      maxSteps: body.max_steps,
      tokenBudget: body.token_budget,
    });

    // Record usage after success (fire-and-forget)
    recordUsage({
      userId: auth.userId ?? auth.projectId,
      projectId: auth.projectId,
      kind: "query",
      metadata: { doc_id: id, tool: "query" },
    });

    return c.json(result);
  }
);

export { app as queryRoutes };
