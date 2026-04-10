import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";

let app;

async function getApp() {
  if (app) return app;

  app = Fastify({ logger: false });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });

  // Import routes dynamically to isolate errors
  try {
    const { errorHandler } = await import("../src/plugins/error-handler.js");
    app.setErrorHandler(errorHandler);

    const { healthRoutes } = await import("../src/routes/health.js");
    await app.register(healthRoutes);

    const { documentRoutes } = await import("../src/routes/documents.js");
    await app.register(documentRoutes, { prefix: "/v1" });

    const { tocRoutes } = await import("../src/routes/toc.js");
    await app.register(tocRoutes, { prefix: "/v1" });

    const { sectionRoutes } = await import("../src/routes/sections.js");
    await app.register(sectionRoutes, { prefix: "/v1" });

    const { llmKeyRoutes } = await import("../src/routes/llm-keys.js");
    await app.register(llmKeyRoutes, { prefix: "/v1" });

    const { ingestWebhookRoutes } = await import("../src/routes/webhooks/ingest.js");
    await app.register(ingestWebhookRoutes, { prefix: "/v1/webhooks" });
  } catch (err) {
    // If route imports fail, add a catch-all error route
    app.all("/*", async (req, reply) => {
      return reply.status(500).send({
        error: "Failed to initialize routes",
        message: err.message,
        stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      });
    });
  }

  await app.ready();
  return app;
}

export default async function handler(req, res) {
  try {
    const fastify = await getApp();
    fastify.server.emit("request", req, res);
  } catch (err) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Init failed", message: err.message }));
  }
}
