import type { ParsedDocument } from "../parser/types.js";
import type { LLMProvider } from "../llm/types.js";
import type { ToCResult } from "./index.js";
import { extractToC } from "./extract.strategy.js";
import { recursiveSummarize } from "./summarize.js";
import { buildTreeToCFromSections } from "./tree-builder.js";

/**
 * Hybrid strategy: Extract native structure + LLM-powered recursive summarization.
 *
 * 1. Uses extract strategy to preserve the document's heading tree
 * 2. Runs recursive summarization bottom-up:
 *    - Leaf summaries: precision retrieval summaries naming entities and concepts
 *    - Branch summaries: scope summaries synthesized from children's summaries
 * 3. Rebuilds both flat and tree ToC with the new summaries
 */
export async function hybridToC(
  doc: ParsedDocument,
  docId: string,
  llm: LLMProvider
): Promise<ToCResult> {
  // Start with extract strategy for structure
  const extracted = extractToC(doc, docId);

  // Run recursive summarization (mutates section summaries in place)
  await recursiveSummarize(extracted.sections, llm);

  // Rebuild ToC manifests with new summaries
  const flatEntries = extracted.sections.map((s) => ({
    section_id: s.id,
    title: s.title,
    summary: s.summary,
    page_range: s.pageRange,
    link: `/v1/documents/${docId}/sections/${s.id}`,
  }));

  const treeToc = buildTreeToCFromSections(extracted.sections, docId, doc);

  return {
    toc: {
      ...extracted.toc,
      sections: flatEntries,
    },
    treeToc,
    sections: extracted.sections,
  };
}
