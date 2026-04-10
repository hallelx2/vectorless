import type { IncomingMessage, ServerResponse } from "node:http";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { errorHandler } from "../src/plugins/error-handler.js";
import { healthRoutes } from "../src/routes/health.js";
import { documentRoutes } from "../src/routes/documents.js";
import { tocRoutes } from "../src/routes/toc.js";
import { sectionRoutes } from "../src/routes/sections.js";
import { llmKeyRoutes } from "../src/routes/llm-keys.js";
import { ingestWebhookRoutes } from "../src/routes/webhooks/ingest.js";

const app = Fastify({ logger: false });

app.register(cors, { origin: true, credentials: true });
app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });
app.setErrorHandler(errorHandler);

app.register(healthRoutes);
app.register(documentRoutes, { prefix: "/v1" });
app.register(tocRoutes, { prefix: "/v1" });
app.register(sectionRoutes, { prefix: "/v1" });
app.register(llmKeyRoutes, { prefix: "/v1" });
app.register(ingestWebhookRoutes, { prefix: "/v1/webhooks" });

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  await app.ready();
  app.server.emit("request", req, res);
}
