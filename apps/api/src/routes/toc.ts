import type { FastifyInstance } from "fastify";
import { authenticateApiKey } from "../plugins/auth.js";
import { getDocument } from "../services/document.service.js";
import { notFound, conflict } from "../plugins/error-handler.js";

export async function tocRoutes(app: FastifyInstance) {
  app.get(
    "/documents/:id/toc",
    { preHandler: [authenticateApiKey] },
    async (request) => {
      const { id } = request.params as { id: string };
      const doc = await getDocument(id, request.auth.projectId);

      if (!doc) throw notFound(`Document ${id} not found`);
      if (doc.status === "processing") {
        throw conflict("Document is still being processed");
      }
      if (doc.status === "failed") {
        throw conflict(`Document processing failed: ${doc.errorMessage}`);
      }
      if (!doc.toc) throw notFound("ToC not available for this document");

      return doc.toc;
    }
  );
}
