import type { ParsedDocument } from "../parser/types.js";
import type { ToCEntry, ToCManifest } from "@vectorless/shared";
import type { LLMProvider } from "../llm/types.js";
import { extractToC } from "./extract.strategy.js";

export async function hybridToC(
  doc: ParsedDocument,
  docId: string,
  llm: LLMProvider
): Promise<{
  toc: ToCManifest;
  sections: ReturnType<typeof extractToC>["sections"];
}> {
  // Start with extract strategy for structure
  const extracted = extractToC(doc, docId);

  // Generate LLM-powered summaries for each section
  const CONCURRENCY = 5;

  const sectionsWithSummaries = [...extracted.sections];

  // Process in batches
  for (let i = 0; i < sectionsWithSummaries.length; i += CONCURRENCY) {
    const batch = sectionsWithSummaries.slice(i, i + CONCURRENCY);
    const summaryPromises = batch.map(async (section) => {
      try {
        const summary = await generatePrecisionSummary(
          llm,
          section.title,
          section.content
        );
        return { ...section, summary };
      } catch {
        // Fall back to excerpt summary on LLM failure
        return section;
      }
    });

    const results = await Promise.allSettled(summaryPromises);
    results.forEach((result, j) => {
      if (result.status === "fulfilled") {
        sectionsWithSummaries[i + j] = result.value;
      }
    });
  }

  // Rebuild ToC with new summaries
  const tocEntries: ToCEntry[] = sectionsWithSummaries.map((s) => ({
    section_id: s.id,
    title: s.title,
    summary: s.summary,
    page_range: s.pageRange,
    link: `/v1/documents/${docId}/sections/${s.id}`,
  }));

  return {
    toc: {
      ...extracted.toc,
      sections: tocEntries,
    },
    sections: sectionsWithSummaries,
  };
}

async function generatePrecisionSummary(
  llm: LLMProvider,
  title: string,
  content: string
): Promise<string> {
  const truncatedContent =
    content.length > 8000 ? content.slice(0, 8000) + "..." : content;

  const prompt = `You are generating a retrieval summary for a section of a document. This summary will be read by another LLM at query time to decide whether this section is relevant to a user's question.

Write a summary that:
- Names every specific entity, concept, method, finding, or claim in the section
- Uses precise terminology, not vague descriptions
- Mentions the scope boundaries (what this section covers AND what it does not)
- Is 1-3 sentences long
- Anticipates the types of questions this section would answer

Do NOT use phrases like "this section discusses" or "various aspects of". Be specific.

Section title: ${title}
Section content:
${truncatedContent}

Write the retrieval summary (1-3 sentences, no prefix):`;

  const summary = await llm.generateText(prompt, {
    maxTokens: 300,
    temperature: 0.2,
  });

  return summary.trim();
}
