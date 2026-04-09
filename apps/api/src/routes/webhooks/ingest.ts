import type { FastifyInstance } from "fastify";
import { verifyQStashSignature } from "../../plugins/qstash.js";
import { runIngestPipeline } from "../../services/ingest.service.js";

export async function ingestWebhookRoutes(app: FastifyInstance) {
  app.post(
    "/ingest",
    {
      preHandler: [verifyQStashSignature],
      config: {
        // Increase timeout for ingest operations
        requestTimeout: 300_000,
      },
    },
    async (request, reply) => {
      const payload = request.body as {
        doc_id: string;
        project_id: string;
        storage_path: string;
        source_type: string;
        toc_strategy: string;
        embed_sections: boolean;
      };

      app.log.info(
        { docId: payload.doc_id },
        "Starting document ingestion"
      );

      await runIngestPipeline({
        docId: payload.doc_id,
        projectId: payload.project_id,
        storagePath: payload.storage_path,
        sourceType: payload.source_type,
        tocStrategy: payload.toc_strategy,
        embedSections: payload.embed_sections,
      });

      return reply.status(200).send({ ok: true });
    }
  );
}
