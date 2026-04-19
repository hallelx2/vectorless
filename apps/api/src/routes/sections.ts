import { Hono } from "hono";
import type { Variables } from "../app.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimitFor } from "../middleware/rate-limit.js";
import { getDocument } from "../services/document.service.js";
import {
  getSection,
  getSectionsByIds,
  getRootSections,
  getChildSections,
  getSiblingSections,
} from "../services/section.service.js";
import { notFound, badRequest } from "../middleware/error-handler.js";

const app = new Hono<{ Variables: Variables }>();

// Helper to format a section for the API response
function formatSection(s: {
  id: string;
  docId: string;
  title: string;
  summary: string | null;
  content: string;
  pageRange: unknown;
  orderIndex: number;
  tokenCount: number;
  level: number;
  parentSectionId: string | null;
  isLeaf: string;
}) {
  return {
    section_id: s.id,
    doc_id: s.docId,
    title: s.title,
    summary: s.summary,
    content: s.content,
    page_range: s.pageRange,
    order_index: s.orderIndex,
    token_count: s.tokenCount,
    level: s.level,
    parent_section_id: s.parentSectionId,
    is_leaf: s.isLeaf === "true",
  };
}

// Helper to format a section summary (no content)
function formatSectionSummary(s: {
  id: string;
  title: string;
  summary: string | null;
  pageRange: unknown;
  orderIndex: number;
  tokenCount: number;
  level: number;
  isLeaf: string;
}) {
  return {
    section_id: s.id,
    title: s.title,
    summary: s.summary,
    page_range: s.pageRange,
    order_index: s.orderIndex,
    token_count: s.tokenCount,
    level: s.level,
    is_leaf: s.isLeaf === "true",
  };
}

// GET /v1/documents/:id/sections/:sectionId
app.get("/documents/:id/sections/:sectionId", authMiddleware, rateLimitFor("tree_nav"), async (c) => {
  const id = c.req.param("id")!;
  const sectionId = c.req.param("sectionId")!;
  const { projectId } = c.get("auth");

  const doc = await getDocument(id, projectId);
  if (!doc) throw notFound(`Document ${id} not found`);

  const section = await getSection(id, sectionId, projectId);
  if (!section) throw notFound(`Section ${sectionId} not found`);

  return c.json(formatSection(section));
});

// POST /v1/documents/:id/sections/batch
app.post("/documents/:id/sections/batch", authMiddleware, rateLimitFor("tree_nav"), async (c) => {
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
    sections: secs.map(formatSection),
  });
});

// ── Tree Navigation Endpoints ──

// GET /v1/documents/:id/sections/roots
app.get("/documents/:id/sections/roots", authMiddleware, rateLimitFor("tree_nav"), async (c) => {
  const id = c.req.param("id")!;
  const { projectId } = c.get("auth");

  const doc = await getDocument(id, projectId);
  if (!doc) throw notFound(`Document ${id} not found`);

  const roots = await getRootSections(id);

  return c.json({
    sections: roots.map(formatSectionSummary),
  });
});

// GET /v1/documents/:id/sections/:sectionId/children
app.get(
  "/documents/:id/sections/:sectionId/children",
  authMiddleware,
  async (c) => {
    const id = c.req.param("id")!;
    const sectionId = c.req.param("sectionId")!;
    const { projectId } = c.get("auth");

    const doc = await getDocument(id, projectId);
    if (!doc) throw notFound(`Document ${id} not found`);

    const children = await getChildSections(id, sectionId);

    return c.json({
      parent_section_id: sectionId,
      sections: children.map(formatSectionSummary),
    });
  }
);

// GET /v1/documents/:id/sections/:sectionId/siblings
app.get(
  "/documents/:id/sections/:sectionId/siblings",
  authMiddleware,
  async (c) => {
    const id = c.req.param("id")!;
    const sectionId = c.req.param("sectionId")!;
    const { projectId } = c.get("auth");

    const doc = await getDocument(id, projectId);
    if (!doc) throw notFound(`Document ${id} not found`);

    const siblings = await getSiblingSections(id, sectionId);

    return c.json({
      sections: siblings.map((s) => ({
        ...formatSectionSummary(s),
        is_current: s.id === sectionId,
      })),
    });
  }
);

export { app as sectionRoutes };
