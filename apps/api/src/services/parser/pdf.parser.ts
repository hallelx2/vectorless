import pdfParse from "pdf-parse";
import type { ParsedDocument, NativeHeading } from "./types.js";

export async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  const data = await pdfParse(buffer);

  // Extract text
  const fullText = data.text;
  const title = data.info?.Title || extractTitleFromText(fullText);

  // Attempt to extract heading structure from text patterns
  const nativeStructure = extractHeadingsFromText(fullText);

  return {
    title,
    sourceType: "pdf",
    fullText,
    nativeStructure: nativeStructure.length > 0 ? nativeStructure : null,
    metadata: {
      pageCount: data.numpages,
      info: data.info,
    },
  };
}

function extractTitleFromText(text: string): string {
  const firstLine = text.trim().split("\n")[0]?.trim() ?? "Untitled Document";
  return firstLine.length > 200 ? firstLine.slice(0, 200) : firstLine;
}

function extractHeadingsFromText(text: string): NativeHeading[] {
  const headings: NativeHeading[] = [];
  const lines = text.split("\n");
  let offset = 0;

  // Heuristic patterns for headings
  const patterns = [
    { regex: /^(?:Chapter|CHAPTER)\s+\d+[.:]\s*(.+)$/i, level: 1 },
    { regex: /^(\d+)\.\s+([A-Z][^\n]{2,80})$/, level: 1 },
    { regex: /^(\d+\.\d+)\s+([A-Z][^\n]{2,80})$/, level: 2 },
    { regex: /^(\d+\.\d+\.\d+)\s+(.+)$/, level: 3 },
    { regex: /^([A-Z][A-Z\s]{4,60})$/, level: 1 }, // ALL CAPS lines
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    for (const pattern of patterns) {
      const match = trimmed.match(pattern.regex);
      if (match) {
        const title = match[2] || match[1] || trimmed;
        headings.push({
          title: title.trim(),
          level: pattern.level,
          startOffset: offset,
          endOffset: offset + line.length,
          children: [],
        });
        break;
      }
    }

    offset += line.length + 1; // +1 for newline
  }

  // Set endOffset for each heading to the start of the next heading
  for (let i = 0; i < headings.length - 1; i++) {
    headings[i]!.endOffset = headings[i + 1]!.startOffset;
  }
  if (headings.length > 0) {
    headings[headings.length - 1]!.endOffset = text.length;
  }

  return buildHeadingTree(headings);
}

function buildHeadingTree(headings: NativeHeading[]): NativeHeading[] {
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
