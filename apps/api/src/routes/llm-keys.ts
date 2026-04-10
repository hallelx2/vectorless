import { Hono } from "hono";
import type { Variables } from "../app.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  createLLMKey,
  listLLMKeys,
  getLLMKey,
  updateLLMKey,
  deleteLLMKey,
} from "../services/llm-keys.service.js";
import { badRequest, notFound } from "../middleware/error-handler.js";

const VALID_PROVIDERS = ["gemini", "anthropic", "openai"] as const;

const app = new Hono<{ Variables: Variables }>();

// POST /v1/llm-keys — Store a new LLM API key (encrypted)
app.post("/llm-keys", authMiddleware, async (c) => {
  const body = await c.req.json<{
    provider?: string;
    label?: string;
    api_key?: string;
  }>();

  if (!body.provider || !VALID_PROVIDERS.includes(body.provider as any)) {
    throw badRequest(
      `provider is required and must be one of: ${VALID_PROVIDERS.join(", ")}`
    );
  }
  if (!body.label || body.label.trim().length === 0) {
    throw badRequest("label is required");
  }
  if (!body.api_key || body.api_key.trim().length < 10) {
    throw badRequest("api_key is required (min 10 characters)");
  }

  const { projectId } = c.get("auth");
  const key = await createLLMKey({
    projectId,
    provider: body.provider as "gemini" | "anthropic" | "openai",
    label: body.label.trim(),
    apiKey: body.api_key.trim(),
  });

  return c.json(key, 201);
});

// GET /v1/llm-keys — List all LLM keys for the project
app.get("/llm-keys", authMiddleware, async (c) => {
  const { projectId } = c.get("auth");
  const keys = await listLLMKeys(projectId);
  return c.json({ keys });
});

// GET /v1/llm-keys/:id — Get a specific LLM key
app.get("/llm-keys/:id", authMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const { projectId } = c.get("auth");
  const key = await getLLMKey(id, projectId);
  if (!key) throw notFound(`LLM key ${id} not found`);
  return c.json(key);
});

// PATCH /v1/llm-keys/:id — Update label, key, or active status
app.patch("/llm-keys/:id", authMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<{
    label?: string;
    api_key?: string;
    is_active?: boolean;
  }>();

  const { projectId } = c.get("auth");
  const updated = await updateLLMKey(id, projectId, {
    label: body.label,
    apiKey: body.api_key,
    isActive: body.is_active,
  });

  if (!updated) throw notFound(`LLM key ${id} not found`);
  return c.json(updated);
});

// DELETE /v1/llm-keys/:id — Delete an LLM key
app.delete("/llm-keys/:id", authMiddleware, async (c) => {
  const id = c.req.param("id")!;
  const { projectId } = c.get("auth");

  const existing = await getLLMKey(id, projectId);
  if (!existing) throw notFound(`LLM key ${id} not found`);

  await deleteLLMKey(id, projectId);
  return c.body(null, 204);
});

export { app as llmKeyRoutes };
