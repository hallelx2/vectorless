import { z } from "zod";
import type { ParsedDocument } from "../parser/types.js";
import type { ToCManifest } from "@vectorless/shared";
import type { LLMProvider } from "../llm/types.js";

const generatedToCSchema = z.object({
  sections: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      start_phrase: z.string(),
      end_phrase: z.string(),
    })
  ),
});

interface GeneratedSection {
  id: string;
  title: string;
  summary: string;
  content: string;
  level: number;
  orderIndex: number;
  pageRange: null;
}

export async function generateToC(
  doc: ParsedDocument,
  docId: string,
  llm: LLMProvider
): Promise<{ toc: ToCManifest; sections: GeneratedSection[] }> {

  const truncatedText =
    doc.fullText.length > 100_000
      ? doc.fullText.slice(0, 100_000) + "\n\n[Document truncated...]"
      : doc.fullText;

  const prompt = `You are analyzing a document to produce a structured table of contents. The document has no clear heading structure, so you must identify the logical sections yourself.

Read the entire document below and:
1. Identify 3-20 logical sections based on topic boundaries
2. Give each section a clear, descriptive title
3. Write a precise retrieval summary for each section (name specific entities, concepts, and findings)
4. Identify the start and end of each section by citing a unique phrase from the text

For each section, provide:
- title: A clear heading for this section
- summary: A 1-3 sentence retrieval summary naming specific entities and concepts
- start_phrase: A unique phrase (5-15 words) from the beginning of this section
- end_phrase: A unique phrase (5-15 words) from the end of this section

Document:
${truncatedText}

Respond with a JSON object in this exact format:
{
  "sections": [
    {
      "title": "Section Title",
      "summary": "Precise retrieval summary...",
      "start_phrase": "unique phrase from start",
      "end_phrase": "unique phrase from end"
    }
  ]
}`;

  const result = await llm.generateStructuredOutput(
    prompt,
    generatedToCSchema,
    { maxTokens: 4096 }
  );

  const sections: GeneratedSection[] = [];

  result.sections.forEach((s, index) => {
    const sectionId = `${docId}-s${index}`;

    // Find content boundaries using phrases
    const startIdx = doc.fullText.indexOf(s.start_phrase);
    const endIdx = doc.fullText.indexOf(s.end_phrase);

    let content: string;
    if (startIdx >= 0 && endIdx >= 0) {
      content = doc.fullText.slice(
        startIdx,
        endIdx + s.end_phrase.length
      );
    } else if (startIdx >= 0) {
      // Fallback: take ~2000 chars from start
      content = doc.fullText.slice(startIdx, startIdx + 2000);
    } else {
      content = `[Section content could not be precisely located]\n\n${s.summary}`;
    }

    sections.push({
      id: sectionId,
      title: s.title,
      summary: s.summary,
      content,
      level: 1,
      orderIndex: index,
      pageRange: null,
    });
  });

  const tocEntries = sections.map((s) => ({
    section_id: s.id,
    title: s.title,
    summary: s.summary,
    page_range: null,
    link: `/v1/documents/${docId}/sections/${s.id}`,
  }));

  return {
    toc: {
      doc_id: docId,
      title: doc.title,
      source_type: doc.sourceType,
      section_count: sections.length,
      created_at: new Date().toISOString(),
      sections: tocEntries,
    },
    sections,
  };
}
