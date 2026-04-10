import { Hono } from "hono";
import type { Variables } from "../app.js";
import { authMiddleware } from "../middleware/auth.js";
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
import { notFound, badRequest } from "../middleware/error-handler.js";
import { config } from "../config.js";

const app = new Hono<{ Variables: Variables }>();

// POST /v1/documents — Upload and ingest
app.post("/documents", authMiddleware, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw badRequest("No file uploaded. Send a file via multipart/form-data.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = file.name || "document";

  // Read form fields
  const sourceType =
    (formData.get("source_type") as "pdf" | "docx" | "txt" | "url") ??
    detectSourceType(filename);
  const tocStrategy = (formData.get("toc_strategy") as string) ?? "extract";
  const embedSections = formData.get("embed_sections") === "true";
  const title = (formData.get("title") as string) ?? filename;

  const { projectId } = c.get("auth");

  // Create document record
  const doc = await createDocument({
    projectId,
    title,
    sourceType,
    tocStrategy: tocStrategy as "extract" | "generate" | "hybrid",
  });

  // Upload to R2
  const storagePath = getStoragePath(projectId, doc.id, filename);
  await uploadFile(storagePath, buffer, file.type);

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
      return c.json(
        {
          doc_id: doc.id,
          status: "ready",
        },
        201
      );
    } catch (error) {
      return c.json(
        {
          doc_id: doc.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Ingestion failed",
        },
        202
      );
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
    return c.json(
      {
        doc_id: doc.id,
        status: "processing",
      },
      202
    );
  }
});

// GET /v1/documents — List documents
app.get("/documents", authMiddleware, async (c) => {
  const limitParam = c.req.query("limit");
  const cursor = c.req.query("cursor");
  const limit = limitParam ? parseInt(limitParam, 10) : 20;

  const { projectId } = c.get("auth");
  const result = await listDocuments(projectId, limit, cursor);

  return c.json({
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
  });
});

// GET /v1/documents/:id — Get document
app.get("/documents/:id", authMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const { projectId } = c.get("auth");
  const doc = await getDocument(id, projectId);
  if (!doc) throw notFound(`Document ${id} not found`);

  return c.json({
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
  });
});

// DELETE /v1/documents/:id — Delete document
app.delete("/documents/:id", authMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const { projectId } = c.get("auth");
  const doc = await getDocument(id, projectId);
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

  await deleteDocument(id, projectId);
  return c.body(null, 204);
});

export { app as documentRoutes };
