import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRoutes } from "./routes/health.js";
import { documentRoutes } from "./routes/documents.js";
import { tocRoutes } from "./routes/toc.js";
import { sectionRoutes } from "./routes/sections.js";
import { queryRoutes } from "./routes/query.js";
import { llmKeyRoutes } from "./routes/llm-keys.js";
import { mcpRoutes } from "./routes/mcp.js";
import { oauthRoutes } from "./routes/oauth.js";
import { ingestWebhookRoutes } from "./routes/webhooks/ingest.js";
import { cleanupRoutes } from "./routes/webhooks/cleanup.js";
import { errorHandler } from "./middleware/error-handler.js";
import type { OAuthScope } from "@vectorless/mcp-tools";

type Variables = {
  auth: {
    projectId: string;
    apiKeyId: string;
    /** OAuth scopes. API keys get all scopes; OAuth tokens get consented scopes. */
    scopes?: OAuthScope[];
    /** User ID (set by OAuth JWT auth, not API key auth). */
    userId?: string;
    /** OAuth client ID (set by OAuth JWT auth). */
    clientId?: string;
    /** User's plan (set by OAuth JWT auth for rate-limit middleware). */
    plan?: string;
  };
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", cors({ origin: "*", credentials: true }));
app.onError(errorHandler);

app.route("/", healthRoutes);
app.route("/v1", documentRoutes);
app.route("/v1", tocRoutes);
app.route("/v1", sectionRoutes);
app.route("/v1", queryRoutes);
app.route("/v1", llmKeyRoutes);
app.route("/v1/webhooks", ingestWebhookRoutes);
app.route("/v1/webhooks", cleanupRoutes);

// MCP — Model Context Protocol endpoint (Streamable HTTP transport)
app.route("/mcp", mcpRoutes);

// OAuth 2.1 — authorization server + well-known metadata
app.route("/", oauthRoutes);

export { app };
export type { Variables };
