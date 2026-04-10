import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health.js";
import { documentRoutes } from "./routes/documents.js";
import { tocRoutes } from "./routes/toc.js";
import { sectionRoutes } from "./routes/sections.js";
import { llmKeyRoutes } from "./routes/llm-keys.js";
import { ingestWebhookRoutes } from "./routes/webhooks/ingest.js";
import { errorHandler } from "./middleware/error-handler.js";

type Variables = {
  auth: { projectId: string; apiKeyId: string };
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", cors({ origin: "*", credentials: true }));
app.onError(errorHandler);

app.route("/", healthRoutes);
app.route("/v1", documentRoutes);
app.route("/v1", tocRoutes);
app.route("/v1", sectionRoutes);
app.route("/v1", llmKeyRoutes);
app.route("/v1/webhooks", ingestWebhookRoutes);

export { app };
export type { Variables };
