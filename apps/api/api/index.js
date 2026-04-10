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

let app;

async function getApp() {
  if (app) return app;

  app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });
  app.setErrorHandler(errorHandler);

  await app.register(healthRoutes);
  await app.register(documentRoutes, { prefix: "/v1" });
  await app.register(tocRoutes, { prefix: "/v1" });
  await app.register(sectionRoutes, { prefix: "/v1" });
  await app.register(llmKeyRoutes, { prefix: "/v1" });
  await app.register(ingestWebhookRoutes, { prefix: "/v1/webhooks" });

  await app.ready();
  return app;
}

export default async function handler(req, res) {
  const fastify = await getApp();
  fastify.server.emit("request", req, res);
}
