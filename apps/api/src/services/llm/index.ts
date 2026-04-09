import type { LLMProvider, LLMProviderName } from "./types.js";
import { AnthropicProvider } from "./anthropic.provider.js";
import { GeminiProvider } from "./gemini.provider.js";
import { config } from "../../config.js";
import { getDecryptedKeyForProvider } from "../llm-keys.service.js";

// Cache for platform-level provider (no BYOK — uses env var keys)
let _platformProvider: LLMProvider | null = null;

/**
 * Get an LLM provider for a specific project.
 *
 * Priority:
 * 1. BYOK key (user's own key stored encrypted in DB) — if exists for this provider
 * 2. Platform key (from env vars) — fallback
 *
 * BYOK providers are NOT cached — each project gets its own instance.
 * Platform provider IS cached — shared across all projects.
 */
export async function getLLMProviderForProject(
  projectId: string
): Promise<LLMProvider> {
  const providerName = config.LLM_PROVIDER as LLMProviderName;

  // Try BYOK first
  const byokKey = await getDecryptedKeyForProvider(projectId, providerName);

  if (byokKey) {
    // User has their own key — create a fresh provider instance with it
    return createProviderWithApiKey(providerName, byokKey.apiKey);
  }

  // Fall back to platform key
  return getPlatformProvider();
}

/**
 * Get the platform-level LLM provider (from env vars).
 * Used when no BYOK key exists for the project.
 */
export function getPlatformProvider(): LLMProvider {
  if (_platformProvider) return _platformProvider;

  const providerName = config.LLM_PROVIDER as LLMProviderName;

  switch (providerName) {
    case "anthropic": {
      if (!config.ANTHROPIC_API_KEY) {
        throw new Error(
          "ANTHROPIC_API_KEY is required when LLM_PROVIDER=anthropic and no BYOK key is configured"
        );
      }
      _platformProvider = new AnthropicProvider(config.ANTHROPIC_API_KEY);
      break;
    }
    case "gemini": {
      if (!config.GOOGLE_CLOUD_PROJECT) {
        throw new Error(
          "GOOGLE_CLOUD_PROJECT is required when LLM_PROVIDER=gemini and no BYOK key is configured"
        );
      }
      _platformProvider = new GeminiProvider({
        project: config.GOOGLE_CLOUD_PROJECT,
        location: config.GOOGLE_CLOUD_LOCATION ?? "us-central1",
      });
      break;
    }
    default:
      throw new Error(`Unknown LLM provider: ${providerName}`);
  }

  return _platformProvider;
}

/**
 * Create a provider instance with a user-provided API key (BYOK).
 */
function createProviderWithApiKey(
  provider: LLMProviderName,
  apiKey: string
): LLMProvider {
  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "gemini":
      // BYOK Gemini uses API key mode (AI Studio), not Vertex AI
      return new GeminiProvider({ apiKey });
    case "openai":
      // Future: OpenAI provider
      throw new Error("OpenAI BYOK provider not yet implemented");
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

// Keep the old sync function for backward compat (uses platform key only)
export function getLLMProvider(): LLMProvider {
  return getPlatformProvider();
}

export type { LLMProvider, LLMOptions, LLMProviderName } from "./types.js";
