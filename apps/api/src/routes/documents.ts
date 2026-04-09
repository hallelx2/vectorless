import type { FastifyInstance } from "fastify";
import { authenticateApiKey } from "../plugins/auth.js";
import {
  createDocument,
  getDocument,
  listDocuments,
  deleteDocument,
} from "../services/document.service.js";
import {
  uploadFile,
  getStoragePath,
  deleteFile,
} from "../services/storage.service.js";
import { enqueueIngest } from "../services/queue.service.js";
import { runIngestPipeline } from "../services/ingest.service.js";
import { detectSourceType } from "../services/parser/index.js";
import { notFound, badRequest } from "../plugins/error-handler.js";
import { config } from "../config.js";

export async function documentRoutes(app: FastifyInstance) {
  // POST /v1/documents — Upload and ingest
  app.post(
    "/documents",
    { preHandler: [authenticateApiKey] },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        throw badRequest(
          "No file uploaded. Send a file via multipart/form-data."
        );
      }

      const buffer = await data.toBuffer();
      const filename = data.filename || "document";

      // Read form fields
      const fields = data.fields as Record<
        string,
        { value: string } | undefined
      >;
      const sourceType =
        (fields.source_type?.value as "pdf" | "docx" | "txt" | "url") ??
        detectSourceType(filename);
      const tocStrategy = fields.toc_strategy?.value ?? "extract";
      const embedSections = fields.embed_sections?.value === "true";
      const title = fields.title?.value ?? filename;

      const { projectId } = request.auth;

      // Create document record
      const doc = await createDocument({
        projectId,
        title,
        sourceType,
        tocStrategy: tocStrategy as "extract" | "generate" | "hybrid",
      });

      // Upload to R2
      const storagePath = getStoragePath(projectId, doc.id, filename);
      await uploadFile(storagePath, buffer, data.mimetype);

      const ingestPayload = {
        docId: doc.id,
        projectId,
        storagePath,
        sourceType,
        tocStrategy,
        embedSections,
      };

      // In local dev, run ingestion inline (QStash can't reach localhost)
      // In production, enqueue via QStash for async background processing
      const isLocalDev = config.API_BASE_URL.includes("localhost");

      if (isLocalDev) {
        try {
          await runIngestPipeline(ingestPayload);
          return reply.status(201).send({
            doc_id: doc.id,
            status: "ready",
          });
        } catch (error) {
          return reply.status(202).send({
            doc_id: doc.id,
            status: "failed",
            error:
              error instanceof Error ? error.message : "Ingestion failed",
          });
        }
      } else {
        await enqueueIngest({
          doc_id: doc.id,
          project_id: projectId,
          storage_path: storagePath,
          source_type: sourceType,
          toc_strategy: tocStrategy,
          embed_sections: embedSections,
        });
        return reply.status(202).send({
          doc_id: doc.id,
          status: "processing",
        });
      }
    }
  );

  // GET /v1/documents — List documents
  app.get(
    "/documents",
    { preHandler: [authenticateApiKey] },
    async (request) => {
      const query = request.query as { limit?: string; cursor?: string };
      const limit = query.limit ? parseInt(query.limit, 10) : 20;
      const cursor = query.cursor;

      const result = await listDocuments(
        request.auth.projectId,
        limit,
        cursor
      );

      return {
        documents: result.documents.map((doc) => ({
          doc_id: doc.id,
          title: doc.title,
          source_type: doc.sourceType,
          section_count: doc.sectionCount,
          status: doc.status,
          created_at: doc.createdAt.toISOString(),
        })),
        next_cursor: result.next_cursor,
        has_more: result.has_more,
      };
    }
  );

  // GET /v1/documents/:id — Get document
  app.get(
    "/documents/:id",
    { preHandler: [authenticateApiKey] },
    async (request) => {
      const { id } = request.params as { id: string };
      const doc = await getDocument(id, request.auth.projectId);
      if (!doc) throw notFound(`Document ${id} not found`);

      return {
        doc_id: doc.id,
        title: doc.title,
        source_type: doc.sourceType,
        toc_strategy: doc.tocStrategy,
        status: doc.status,
        section_count: doc.sectionCount,
        original_file_url: doc.originalFileUrl,
        error_message: doc.errorMessage,
        metadata: doc.metadata,
        created_at: doc.createdAt.toISOString(),
        updated_at: doc.updatedAt.toISOString(),
      };
    }
  );

  // DELETE /v1/documents/:id — Delete document
  app.delete(
    "/documents/:id",
    { preHandler: [authenticateApiKey] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const doc = await getDocument(id, request.auth.projectId);
      if (!doc) throw notFound(`Document ${id} not found`);

      // Delete file from R2 if exists
      if (doc.originalFileUrl) {
        try {
          const path = doc.originalFileUrl.replace(/^r2:\/\/[^/]+\//, "");
          await deleteFile(path);
        } catch {
          // Non-critical, continue with DB deletion
        }
      }

      await deleteDocument(id, request.auth.projectId);
      return reply.status(204).send();
    }
  );
}
