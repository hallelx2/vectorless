import type { ParsedDocument } from "../parser/types.js";
import type { ToCManifest, ToCTreeManifest } from "@vectorless/shared";
import type { LLMProvider } from "../llm/types.js";
import { extractToC } from "./extract.strategy.js";
import { hybridToC } from "./hybrid.strategy.js";
import { generateToC } from "./generate.strategy.js";

export type ToCStrategy = "extract" | "generate" | "hybrid";

export interface ToCResultSection {
  id: string;
  title: string;
  summary: string;
  content: string;
  level: number;
  orderIndex: number;
  pageRange: { start: number; end: number } | null;
  parentId: string | null;
  childIds: string[];
  isLeaf: boolean;
}

export interface ToCResult {
  toc: ToCManifest;
  treeToc: ToCTreeManifest;
  sections: ToCResultSection[];
}

export async function generateDocumentToC(
  doc: ParsedDocument,
  docId: string,
  strategy: ToCStrategy,
  llmProvider?: LLMProvider
): Promise<ToCResult> {
  switch (strategy) {
    case "extract":
      return extractToC(doc, docId);
    case "hybrid": {
      if (!llmProvider) {
        throw new Error(
          "LLM provider is required for hybrid ToC strategy. " +
            "Configure an LLM key in the dashboard or set platform LLM env vars."
        );
      }
      return hybridToC(doc, docId, llmProvider);
    }
    case "generate": {
      if (!llmProvider) {
        throw new Error(
          "LLM provider is required for generate ToC strategy. " +
            "Configure an LLM key in the dashboard or set platform LLM env vars."
        );
      }
      return generateToC(doc, docId, llmProvider);
    }
    default:
      throw new Error(`Unknown ToC strategy: ${strategy}`);
  }
}
