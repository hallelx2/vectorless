import type { ToCResult } from "../toc/index.js";

const MAX_TOKENS = 15_000;
const MIN_TOKENS = 100;

// Rough token estimation: ~4 chars per token
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function processSections(tocResult: ToCResult): ToCResult {
  const processedSections: ToCResult["sections"] = [];

  for (const section of tocResult.sections) {
    const tokenCount = estimateTokens(section.content);

    if (tokenCount > MAX_TOKENS) {
      // Split oversized sections at paragraph boundaries
      const subSections = splitOversizedSection(section);
      processedSections.push(...subSections);
    } else if (tokenCount < MIN_TOKENS && processedSections.length > 0) {
      // Merge undersized sections with previous
      const prev = processedSections[processedSections.length - 1]!;
      prev.content += "\n\n" + section.content;
      prev.summary += " " + section.summary;
    } else {
      processedSections.push({ ...section });
    }
  }

  // Re-index and update token counts
  processedSections.forEach((s, i) => {
    s.orderIndex = i;
  });

  // Rebuild ToC entries
  const tocEntries = processedSections.map((s) => ({
    section_id: s.id,
    title: s.title,
    summary: s.summary,
    page_range: s.pageRange,
    link: `/v1/documents/${tocResult.toc.doc_id}/sections/${s.id}`,
  }));

  return {
    toc: {
      ...tocResult.toc,
      section_count: processedSections.length,
      sections: tocEntries,
    },
    sections: processedSections,
  };
}

function splitOversizedSection(
  section: ToCResult["sections"][0]
): ToCResult["sections"] {
  const paragraphs = section.content.split(/\n\n+/);

  if (paragraphs.length <= 1) {
    // Can't split further, return as-is
    return [section];
  }

  const targetSize = MAX_TOKENS;
  const parts: string[] = [];
  let currentPart = "";

  for (const para of paragraphs) {
    if (
      estimateTokens(currentPart + "\n\n" + para) > targetSize &&
      currentPart.length > 0
    ) {
      parts.push(currentPart.trim());
      currentPart = para;
    } else {
      currentPart += (currentPart ? "\n\n" : "") + para;
    }
  }
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }

  return parts.map((content, i) => ({
    id: `${section.id}-p${i}`,
    title:
      parts.length > 1
        ? `${section.title} (Part ${i + 1} of ${parts.length})`
        : section.title,
    summary: section.summary,
    content,
    level: section.level,
    orderIndex: section.orderIndex + i,
    pageRange: section.pageRange,
  }));
}
