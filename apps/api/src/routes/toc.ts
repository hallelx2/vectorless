import { Hono } from "hono";
import type { Variables } from "../app.js";
import { authMiddleware } from "../middleware/auth.js";
import { getDocument } from "../services/document.service.js";
import { notFound, conflict } from "../middleware/error-handler.js";

const app = new Hono<{ Variables: Variables }>();

app.get("/documents/:id/toc", authMiddleware, async (c) => {
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
  if (!doc.toc) throw notFound("ToC not available for this document");

  return c.json(doc.toc);
});

export { app as tocRoutes };
