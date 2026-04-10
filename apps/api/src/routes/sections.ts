import { Hono } from "hono";
import type { Variables } from "../app.js";
import { authMiddleware } from "../middleware/auth.js";
import { getDocument } from "../services/document.service.js";
import {
  getSection,
  getSectionsByIds,
} from "../services/section.service.js";
import { notFound, badRequest } from "../middleware/error-handler.js";

const app = new Hono<{ Variables: Variables }>();

// GET /v1/documents/:id/sections/:sectionId
app.get("/documents/:id/sections/:sectionId", authMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const sectionId = c.req.param("sectionId")!;
  const { projectId } = c.get("auth");

  const doc = await getDocument(id, projectId);
  if (!doc) throw notFound(`Document ${id} not found`);

  const section = await getSection(id, sectionId, projectId);
  if (!section) throw notFound(`Section ${sectionId} not found`);

  return c.json({
    section_id: section.id,
    doc_id: section.docId,
    title: section.title,
    summary: section.summary,
    content: section.content,
    page_range: section.pageRange,
    order_index: section.orderIndex,
    token_count: section.tokenCount,
  });
});

// POST /v1/documents/:id/sections/batch
app.post("/documents/:id/sections/batch", authMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<{ section_ids?: string[] }>();

  if (!body.section_ids || !Array.isArray(body.section_ids)) {
    throw badRequest("section_ids array is required");
  }
  if (body.section_ids.length === 0) {
    throw badRequest("section_ids must not be empty");
  }
  if (body.section_ids.length > 100) {
    throw badRequest("Cannot fetch more than 100 sections at once");
  }

  const { projectId } = c.get("auth");
  const doc = await getDocument(id, projectId);
  if (!doc) throw notFound(`Document ${id} not found`);

  const secs = await getSectionsByIds(id, body.section_ids);

  return c.json({
    sections: secs.map((s) => ({
      section_id: s.id,
      doc_id: s.docId,
      title: s.title,
      summary: s.summary,
      content: s.content,
      page_range: s.pageRange,
      order_index: s.orderIndex,
      token_count: s.tokenCount,
    })),
  });
});

export { app as sectionRoutes };
