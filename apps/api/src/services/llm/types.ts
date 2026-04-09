import type { z, ZodSchema } from "zod";

export interface LLMProvider {
  generateText(prompt: string, options?: LLMOptions): Promise<string>;
  generateStructuredOutput<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: LLMOptions
  ): Promise<T>;
}

export interface LLMOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export type LLMProviderName = "anthropic" | "gemini";
