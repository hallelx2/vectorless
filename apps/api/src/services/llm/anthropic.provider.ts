import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, LLMOptions } from "./types.js";
import type { ZodSchema } from "zod";

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateText(prompt: string, options?: LLMOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options?.model ?? "claude-sonnet-4-20250514",
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const block = response.content[0];
    if (block?.type !== "text") throw new Error("Unexpected response type");
    return block.text;
  }

  async generateStructuredOutput<T>(
    prompt: string,
    schema: ZodSchema<T>,
    options?: LLMOptions
  ): Promise<T> {
    const jsonPrompt = `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation, just the JSON object.`;
    const text = await this.generateText(jsonPrompt, options);

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Failed to extract JSON from LLM response");

    const parsed = JSON.parse(jsonMatch[0]);
    return schema.parse(parsed);
  }
}
