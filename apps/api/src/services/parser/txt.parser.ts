import type { ParsedDocument, NativeHeading } from "./types.js";

export async function parseTxt(
  buffer: Buffer,
  isMarkdown: boolean
): Promise<ParsedDocument> {
  const fullText = buffer.toString("utf-8");
  const title = extractTitle(fullText, isMarkdown);
  const nativeStructure = isMarkdown
    ? extractMarkdownHeadings(fullText)
    : extractTxtHeadings(fullText);

  return {
    title,
    sourceType: "txt",
    fullText,
    nativeStructure: nativeStructure.length > 0 ? nativeStructure : null,
    metadata: {
      isMarkdown,
      characterCount: fullText.length,
    },
  };
}

function extractTitle(text: string, isMarkdown: boolean): string {
  if (isMarkdown) {
    const match = text.match(/^#\s+(.+)$/m);
    if (match) return match[1]!.trim();
  }
  const firstLine = text.trim().split("\n")[0]?.trim() ?? "Untitled";
  return firstLine.length > 200 ? firstLine.slice(0, 200) : firstLine;
}

function extractMarkdownHeadings(text: string): NativeHeading[] {
  const headings: NativeHeading[] = [];
  const lines = text.split("\n");
  let offset = 0;

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        title: match[2]!.trim(),
        level: match[1]!.length,
        startOffset: offset,
        endOffset: offset + line.length,
        children: [],
      });
    }
    offset += line.length + 1;
  }

  // Fix endOffsets
  for (let i = 0; i < headings.length - 1; i++) {
    headings[i]!.endOffset = headings[i + 1]!.startOffset;
  }
  if (headings.length > 0) {
    headings[headings.length - 1]!.endOffset = text.length;
  }

  return buildTree(headings);
}

function extractTxtHeadings(text: string): NativeHeading[] {
  const headings: NativeHeading[] = [];
  const lines = text.split("\n");
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    const nextLine = lines[i + 1]?.trim() ?? "";

    // Setext-style headings
    if (trimmed.length > 0 && /^={3,}$/.test(nextLine)) {
      headings.push({
        title: trimmed,
        level: 1,
        startOffset: offset,
        endOffset: offset + line.length,
        children: [],
      });
    } else if (trimmed.length > 0 && /^-{3,}$/.test(nextLine)) {
      headings.push({
        title: trimmed,
        level: 2,
        startOffset: offset,
        endOffset: offset + line.length,
        children: [],
      });
    }
    // ALL CAPS detection
    else if (
      trimmed.length > 4 &&
      trimmed.length < 80 &&
      /^[A-Z][A-Z\s\d.:]+$/.test(trimmed)
    ) {
      headings.push({
        title: trimmed,
        level: 1,
        startOffset: offset,
        endOffset: offset + line.length,
        children: [],
      });
    }

    offset += line.length + 1;
  }

  for (let i = 0; i < headings.length - 1; i++) {
    headings[i]!.endOffset = headings[i + 1]!.startOffset;
  }
  if (headings.length > 0) {
    headings[headings.length - 1]!.endOffset = text.length;
  }

  return buildTree(headings);
}

function buildTree(headings: NativeHeading[]): NativeHeading[] {
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
