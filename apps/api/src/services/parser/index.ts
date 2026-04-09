import type { ParsedDocument } from "./types.js";
import { parsePdf } from "./pdf.parser.js";
import { parseDocx } from "./docx.parser.js";
import { parseTxt } from "./txt.parser.js";
import { parseUrl } from "./url.parser.js";

export type { ParsedDocument, NativeHeading } from "./types.js";

export function detectSourceType(
  filename: string
): "pdf" | "docx" | "txt" | "url" {
  const ext = filename.toLowerCase().split(".").pop();
  switch (ext) {
    case "pdf":
      return "pdf";
    case "docx":
    case "doc":
      return "docx";
    case "md":
    case "markdown":
    case "txt":
      return "txt";
    default:
      return "txt";
  }
}

export async function parseDocument(
  source: Buffer | string,
  sourceType: "pdf" | "docx" | "txt" | "url"
): Promise<ParsedDocument> {
  if (sourceType === "url") {
    if (typeof source !== "string") {
      throw new Error("URL source must be a string");
    }
    return parseUrl(source);
  }

  const buffer = typeof source === "string" ? Buffer.from(source) : source;

  switch (sourceType) {
    case "pdf":
      return parsePdf(buffer);
    case "docx":
      return parseDocx(buffer);
    case "txt": {
      // Auto-detect markdown from content
      const text = buffer.toString("utf-8", 0, 500);
      const isMarkdown = /^#{1,6}\s/m.test(text);
      return parseTxt(buffer, isMarkdown);
    }
    default:
      throw new Error(`Unsupported source type: ${sourceType}`);
  }
}
