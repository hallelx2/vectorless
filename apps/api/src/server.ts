import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { config } from "./config.js";
import { errorHandler } from "./plugins/error-handler.js";
import { healthRoutes } from "./routes/health.js";
import { documentRoutes } from "./routes/documents.js";
import { tocRoutes } from "./routes/toc.js";
import { sectionRoutes } from "./routes/sections.js";
import { llmKeyRoutes } from "./routes/llm-keys.js";
import { ingestWebhookRoutes } from "./routes/webhooks/ingest.js";

const app = Fastify({
  logger: {
    level: "info",
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  },
  requestTimeout: 300_000, // 5 min for webhook ingest
});

// Plugins
await app.register(cors, {
  origin: true,
  credentials: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Error handler
app.setErrorHandler(errorHandler);

// Routes
await app.register(healthRoutes);
await app.register(documentRoutes, { prefix: "/v1" });
await app.register(tocRoutes, { prefix: "/v1" });
await app.register(sectionRoutes, { prefix: "/v1" });
await app.register(llmKeyRoutes, { prefix: "/v1" });
await app.register(ingestWebhookRoutes, { prefix: "/v1/webhooks" });

// Start
const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
    console.log(`🚀 Vectorless API running on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

export { app };
