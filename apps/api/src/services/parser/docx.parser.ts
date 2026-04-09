import mammoth from "mammoth";
import type { ParsedDocument, NativeHeading } from "./types.js";

export async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  // Extract plain text
  const textResult = await mammoth.extractRawText({ buffer });
  const fullText = textResult.value;

  // Extract headings from HTML
  const nativeStructure = extractHeadingsFromHtml(html, fullText);
  const title = nativeStructure[0]?.title ?? extractTitle(fullText);

  return {
    title,
    sourceType: "docx",
    fullText,
    nativeStructure: nativeStructure.length > 0 ? nativeStructure : null,
    metadata: {
      warnings: result.messages,
    },
  };
}

function extractTitle(text: string): string {
  const firstLine = text.trim().split("\n")[0]?.trim() ?? "Untitled";
  return firstLine.length > 200 ? firstLine.slice(0, 200) : firstLine;
}

function extractHeadingsFromHtml(
  html: string,
  fullText: string
): NativeHeading[] {
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  const headings: NativeHeading[] = [];
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]!, 10);
    const title = match[2]!.replace(/<[^>]+>/g, "").trim();

    // Find approximate offset in plain text
    const offset = fullText.indexOf(title);

    headings.push({
      title,
      level,
      startOffset: offset >= 0 ? offset : 0,
      endOffset: 0,
      children: [],
    });
  }

  // Set endOffsets
  for (let i = 0; i < headings.length - 1; i++) {
    headings[i]!.endOffset = headings[i + 1]!.startOffset;
  }
  if (headings.length > 0) {
    headings[headings.length - 1]!.endOffset = fullText.length;
  }

  // Build tree
  const root: NativeHeading[] = [];
  const stack: NativeHeading[] = [];

  for (const heading of headings) {
    while (stack.length > 0 && stack[stack.length - 1]!.level >= heading.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(heading);
    } else {
      stack[stack.length - 1]!.children.push(heading);
    }
    stack.push(heading);
  }

  return root;
}
