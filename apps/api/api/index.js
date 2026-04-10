let app = null;
let initError = null;

async function getApp() {
  if (app) return app;
  if (initError) throw initError;

  try {
    const Fastify = (await import("fastify")).default;
    const cors = (await import("@fastify/cors")).default;
    const multipart = (await import("@fastify/multipart")).default;

    app = Fastify({ logger: false });
    await app.register(cors, { origin: true, credentials: true });
    await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });

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

    await app.ready();
    return app;
  } catch (err) {
    initError = err;
    throw err;
  }
}

export default async function handler(req, res) {
  try {
    const fastify = await getApp();
    fastify.server.emit("request", req, res);
  } catch (err) {
    res.setHeader("Content-Type", "application/json");
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: "API initialization failed",
        message: err.message,
        stack: err.stack?.split("\n").slice(0, 8),
      })
    );
  }
}
