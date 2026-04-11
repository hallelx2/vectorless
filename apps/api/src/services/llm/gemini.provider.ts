import { GoogleGenAI } from "@google/genai";
import type { LLMProvider, LLMOptions } from "./types.js";
import type { ZodSchema } from "zod";

type GeminiProviderOptions =
  | { project: string; location: string } // Vertex AI mode (platform)
  | { apiKey: string }; // API key mode (BYOK)

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI;

  constructor(options: GeminiProviderOptions) {
    if ("apiKey" in options) {
      this.client = new GoogleGenAI({ apiKey: options.apiKey });
    } else {
      this.client = new GoogleGenAI({
        vertexai: true,
        project: options.project,
        location: options.location,
      });
    }
  }

  async generateText(prompt: string, options?: LLMOptions): Promise<string> {
    const response = await this.client.models.generateContent({
      model: options?.model ?? "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.3,
        // Disable thinking mode to get full output in text
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return response.text ?? "";
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: LLMOptions
  ): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation, just the JSON object.`;
    const text = await this.generateText(jsonPrompt, options);

    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch)
      throw new Error("Failed to extract JSON from LLM response");

    const parsed = JSON.parse(jsonMatch[0]);
    return schema.parse(parsed);
  }
}
