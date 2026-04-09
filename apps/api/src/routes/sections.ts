import type { FastifyInstance } from "fastify";
import { authenticateApiKey } from "../plugins/auth.js";
import { getDocument } from "../services/document.service.js";
import {
  getSection,
  getSectionsByIds,
} from "../services/section.service.js";
import { notFound, badRequest } from "../plugins/error-handler.js";

export async function sectionRoutes(app: FastifyInstance) {
  // GET /v1/documents/:id/sections/:sectionId
  app.get(
    "/documents/:id/sections/:sectionId",
    { preHandler: [authenticateApiKey] },
    async (request) => {
      const { id, sectionId } = request.params as {
        id: string;
        sectionId: string;
      };

      const doc = await getDocument(id, request.auth.projectId);
      if (!doc) throw notFound(`Document ${id} not found`);

      const section = await getSection(id, sectionId, request.auth.projectId);
      if (!section) throw notFound(`Section ${sectionId} not found`);

      return {
        section_id: section.id,
        doc_id: section.docId,
        title: section.title,
        summary: section.summary,
        content: section.content,
        page_range: section.pageRange,
        order_index: section.orderIndex,
        token_count: section.tokenCount,
      };
    }
  );

  // POST /v1/documents/:id/sections/batch
  app.post(
    "/documents/:id/sections/batch",
    { preHandler: [authenticateApiKey] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as { section_ids?: string[] };

      if (!body.section_ids || !Array.isArray(body.section_ids)) {
        throw badRequest("section_ids array is required");
      }
      if (body.section_ids.length === 0) {
        throw badRequest("section_ids must not be empty");
      }
      if (body.section_ids.length > 100) {
        throw badRequest("Cannot fetch more than 100 sections at once");
      }

      const doc = await getDocument(id, request.auth.projectId);
      if (!doc) throw notFound(`Document ${id} not found`);

      const secs = await getSectionsByIds(id, body.section_ids);

      return {
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
      };
    }
  );
}
