import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import type { LLMProviderName } from "../llm/types.js";
import { config } from "../../config.js";
import { getDecryptedKeyForProvider } from "../llm-keys.service.js";

/**
 * Select an AI SDK model for a project.
 *
 * Priority:
 * 1. BYOK key (user's own key stored encrypted in DB) — if exists for this provider
 * 2. Platform key (from env vars) — fallback
 *
 * Maps the existing LLMProvider config to Vercel AI SDK model references.
 */
export async function getAISDKModelForProject(
  projectId: string
): Promise<LanguageModel> {
  const providerName = config.LLM_PROVIDER as LLMProviderName;

  // Try BYOK first
  const byokKey = await getDecryptedKeyForProvider(projectId, providerName);
  const apiKey = byokKey?.apiKey;

  return selectAISDKModel(providerName, apiKey);
}

/**
 * Create an AI SDK model reference from a provider name and optional API key.
 */
export function selectAISDKModel(
  provider: LLMProviderName,
  apiKey?: string
): LanguageModel {
  switch (provider) {
    case "anthropic": {
      const key = apiKey ?? config.ANTHROPIC_API_KEY;
      if (!key) {
        throw new Error(
          "ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic"
        );
      }
      return anthropic("claude-sonnet-4-20250514", { apiKey: key });
    }
    case "gemini": {
      const key = apiKey ?? config.GEMINI_API_KEY;
      if (!key) {
        throw new Error(
          "GEMINI_API_KEY is required when LLM_PROVIDER=gemini"
        );
      }
      return google("gemini-2.5-flash", { apiKey: key });
    }
    default:
      throw new Error(`Unsupported AI SDK provider: ${provider}`);
  }
}
