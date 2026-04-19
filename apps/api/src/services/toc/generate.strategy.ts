import { z } from "zod";
import type { ParsedDocument } from "../parser/types.js";
import type { ToCManifest } from "@vectorless/shared";
import type { LLMProvider } from "../llm/types.js";
import type { ToCResult, ToCResultSection } from "./index.js";
import { buildTreeToCFromSections } from "./tree-builder.js";

const generatedSectionSchema: z.ZodType<{
  title: string;
  summary: string;
  start_phrase: string;
  end_phrase: string;
  children: unknown[];
}> = z.lazy(() =>
  z.object({
    title: z.string(),
    summary: z.string(),
    start_phrase: z.string(),
    end_phrase: z.string(),
    children: z.array(generatedSectionSchema).default([]),
  })
);

const generatedToCSchema = z.object({
  sections: z.array(generatedSectionSchema),
});

type GeneratedSection = z.infer<typeof generatedSectionSchema>;

export async function generateToC(
  doc: ParsedDocument,
  docId: string,
  llm: LLMProvider
): Promise<ToCResult> {
  const truncatedText =
    doc.fullText.length > 100_000
      ? doc.fullText.slice(0, 100_000) + "\n\n[Document truncated...]"
      : doc.fullText;

  const prompt = `You are analyzing a document to produce a structured, hierarchical table of contents. The document has no clear heading structure, so you must identify the logical sections yourself.

Read the entire document below and:
1. Identify 3-15 top-level logical sections based on major topic boundaries
2. For sections that cover multiple distinct sub-topics, nest 2-5 sub-sections under them
3. Give each section a clear, descriptive title
4. Write a precise retrieval summary for each section (name specific entities, concepts, and findings)
5. Identify the start and end of each section by citing a unique phrase from the text

For each section, provide:
- title: A clear heading for this section
- summary: A 1-3 sentence retrieval summary naming specific entities and concepts
- start_phrase: A unique phrase (5-15 words) from the beginning of this section
- end_phrase: A unique phrase (5-15 words) from the end of this section
- children: An array of sub-sections (same structure), or empty array if none

Document:
${truncatedText}

Respond with a JSON object in this exact format:
{
  "sections": [
    {
      "title": "Section Title",
      "summary": "Precise retrieval summary...",
      "start_phrase": "unique phrase from start",
      "end_phrase": "unique phrase from end",
      "children": [
        {
          "title": "Sub-section Title",
          "summary": "Sub-section summary...",
          "start_phrase": "unique phrase",
          "end_phrase": "unique phrase",
          "children": []
        }
      ]
    }
  ]
}`;

  const result = await llm.generateStructuredOutput(
    prompt,
    generatedToCSchema,
    { maxTokens: 8192 }
  );

  // Convert hierarchical LLM output to ToCResultSection[]
  const counter = { value: 0 };
  const sections = convertGeneratedSections(
    result.sections as GeneratedSection[],
    docId,
    doc.fullText,
    null,
    1,
    counter
  );

  // Re-index
  sections.forEach((s, i) => {
    s.orderIndex = i;
  });

  // Build flat ToC
  const tocEntries = sections.map((s) => ({
    section_id: s.id,
    title: s.title,
    summary: s.summary,
    page_range: s.pageRange,
    link: `/v1/documents/${docId}/sections/${s.id}`,
  }));

  // Build tree ToC
  const treeToc = buildTreeToCFromSections(sections, docId, doc);

  return {
    toc: {
      doc_id: docId,
      title: doc.title,
      source_type: doc.sourceType,
      section_count: sections.length,
      created_at: new Date().toISOString(),
      sections: tocEntries,
    },
    treeToc,
    sections,
  };
}

function convertGeneratedSections(
  generated: GeneratedSection[],
  docId: string,
  fullText: string,
  parentId: string | null,
  level: number,
  counter: { value: number }
): ToCResultSection[] {
  const sections: ToCResultSection[] = [];

  for (const s of generated) {
    const sectionId = `${docId}-s${counter.value++}`;
    const children = (s.children ?? []) as GeneratedSection[];
    const isLeaf = children.length === 0;

    // Find content boundaries using phrases
    const startIdx = fullText.indexOf(s.start_phrase);
    const endIdx = fullText.indexOf(s.end_phrase);

    let content: string;
    if (startIdx >= 0 && endIdx >= 0) {
      content = fullText.slice(startIdx, endIdx + s.end_phrase.length);
    } else if (startIdx >= 0) {
      content = fullText.slice(startIdx, startIdx + 2000);
    } else {
      content = `[Section content could not be precisely located]\n\n${s.summary}`;
    }

    // If branch node, extract just the intro before first child
    let sectionContent = content;
    if (!isLeaf && children.length > 0) {
      const firstChildStart = fullText.indexOf(children[0]!.start_phrase);
      if (firstChildStart >= 0 && startIdx >= 0 && firstChildStart > startIdx) {
        sectionContent = fullText.slice(startIdx, firstChildStart);
      }
    }

    // Recursively convert children
    const childSections = convertGeneratedSections(
      children,
      docId,
      fullText,
      sectionId,
      level + 1,
      counter
    );

    const directChildIds = childSections
      .filter((cs) => cs.parentId === sectionId)
      .map((cs) => cs.id);

    sections.push(
      {
        id: sectionId,
        title: s.title,
        summary: s.summary,
        content: sectionContent,
        level,
        orderIndex: 0,
        pageRange: null, // Generate strategy cannot determine page numbers
        parentId,
        childIds: directChildIds,
        isLeaf,
      },
      ...childSections
    );
  }

  return sections;
}
