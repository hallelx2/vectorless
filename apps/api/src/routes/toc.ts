import { Hono } from "hono";
import type { Variables } from "../app.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimitFor } from "../middleware/rate-limit.js";
import { getDocument } from "../services/document.service.js";
import { notFound, conflict } from "../middleware/error-handler.js";

const app = new Hono<{ Variables: Variables }>();

/**
 * GET /v1/documents/:id/toc
 *
 * Returns the flat ToC manifest (backward-compatible).
 * Add ?format=tree to get the hierarchical tree ToC instead.
 */
app.get("/documents/:id/toc", authMiddleware, rateLimitFor("tree_nav"), async (c) => {
  const id = c.req.param("id")!;
  const format = c.req.query("format");
  const { projectId } = c.get("auth");
  const doc = await getDocument(id, projectId);

  if (!doc) throw notFound(`Document ${id} not found`);
  if (doc.status === "processing") {
    throw conflict("Document is still being processed");
  }
  if (doc.status === "failed") {
    throw conflict(`Document processing failed: ${doc.errorMessage}`);
  }

  if (format === "tree") {
    if (!doc.treeToc) {
      throw notFound(
        "Tree ToC not available for this document. Re-process with a tree-aware strategy."
      );
    }
    return c.json(doc.treeToc);
  }

  if (!doc.toc) throw notFound("ToC not available for this document");
  return c.json(doc.toc);
});

/**
 * GET /v1/documents/:id/toc/tree
 *
 * Dedicated endpoint for the hierarchical tree ToC.
 */
app.get("/documents/:id/toc/tree", authMiddleware, rateLimitFor("tree_nav"), async (c) => {
  const id = c.req.param("id")!;
  const { projectId } = c.get("auth");
  const doc = await getDocument(id, projectId);

  if (!doc) throw notFound(`Document ${id} not found`);
  if (doc.status === "processing") {
    throw conflict("Document is still being processed");
  }
  if (doc.status === "failed") {
    throw conflict(`Document processing failed: ${doc.errorMessage}`);
  }
  if (!doc.treeToc) {
    throw notFound(
      "Tree ToC not available for this document. Re-process with a tree-aware strategy."
    );
  }

  return c.json(doc.treeToc);
});

export { app as tocRoutes };
