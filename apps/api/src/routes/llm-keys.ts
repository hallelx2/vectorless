import type { FastifyInstance } from "fastify";
import { authenticateApiKey } from "../plugins/auth.js";
import {
  createLLMKey,
  listLLMKeys,
  getLLMKey,
  updateLLMKey,
  deleteLLMKey,
} from "../services/llm-keys.service.js";
import { badRequest, notFound } from "../plugins/error-handler.js";

const VALID_PROVIDERS = ["gemini", "anthropic", "openai"] as const;

export async function llmKeyRoutes(app: FastifyInstance) {
  // POST /v1/llm-keys — Store a new LLM API key (encrypted)
  app.post(
    "/llm-keys",
    { preHandler: [authenticateApiKey] },
    async (request, reply) => {
      const body = request.body as {
        provider?: string;
        label?: string;
        api_key?: string;
      };

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

      const key = await createLLMKey({
        projectId: request.auth.projectId,
        provider: body.provider as "gemini" | "anthropic" | "openai",
        label: body.label.trim(),
        apiKey: body.api_key.trim(),
      });

      return reply.status(201).send(key);
    }
  );

  // GET /v1/llm-keys — List all LLM keys for the project
  app.get(
    "/llm-keys",
    { preHandler: [authenticateApiKey] },
    async (request) => {
      const keys = await listLLMKeys(request.auth.projectId);
      return { keys };
    }
  );

  // GET /v1/llm-keys/:id — Get a specific LLM key
  app.get(
    "/llm-keys/:id",
    { preHandler: [authenticateApiKey] },
    async (request) => {
      const { id } = request.params as { id: string };
      const key = await getLLMKey(id, request.auth.projectId);
      if (!key) throw notFound(`LLM key ${id} not found`);
      return key;
    }
  );

  // PATCH /v1/llm-keys/:id — Update label, key, or active status
  app.patch(
    "/llm-keys/:id",
    { preHandler: [authenticateApiKey] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        label?: string;
        api_key?: string;
        is_active?: boolean;
      };

      const updated = await updateLLMKey(id, request.auth.projectId, {
        label: body.label,
        apiKey: body.api_key,
        isActive: body.is_active,
      });

      if (!updated) throw notFound(`LLM key ${id} not found`);
      return updated;
    }
  );

  // DELETE /v1/llm-keys/:id — Delete an LLM key
  app.delete(
    "/llm-keys/:id",
    { preHandler: [authenticateApiKey] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const existing = await getLLMKey(id, request.auth.projectId);
      if (!existing) throw notFound(`LLM key ${id} not found`);

      await deleteLLMKey(id, request.auth.projectId);
      return reply.status(204).send();
    }
  );
}
