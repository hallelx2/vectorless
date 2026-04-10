import { Hono } from "hono";
import type { Variables } from "../../app.js";
import { qstashMiddleware } from "../../middleware/qstash.js";
import { runIngestPipeline } from "../../services/ingest.service.js";

const app = new Hono<{ Variables: Variables }>();

app.post("/ingest", qstashMiddleware, async (c) => {
  const payload = await c.req.json<{
    doc_id: string;
    project_id: string;
    storage_path: string;
    source_type: string;
    toc_strategy: string;
    embed_sections: boolean;
  }>();

  console.log(`Starting document ingestion for docId: ${payload.doc_id}`);

  await runIngestPipeline({
    docId: payload.doc_id,
    projectId: payload.project_id,
    storagePath: payload.storage_path,
    sourceType: payload.source_type,
    tocStrategy: payload.toc_strategy,
    embedSections: payload.embed_sections,
  });

  return c.json({ ok: true }, 200);
});

export { app as ingestWebhookRoutes };
