import { parseDocument, detectSourceType } from "./parser/index.js";
import { generateDocumentToC, type ToCStrategy } from "./toc/index.js";
import { processSections } from "./splitter/index.js";
import { getLLMProviderForProject } from "./llm/index.js";
import { createSections, type CreateSectionInput } from "./section.service.js";
import {
  updateDocumentReady,
  updateDocumentFailed,
} from "./document.service.js";
import { downloadFile } from "./storage.service.js";

export interface IngestOptions {
  docId: string;
  projectId: string;
  storagePath: string;
  sourceType: string;
  tocStrategy: string;
  embedSections: boolean;
}

// Rough token estimation: ~4 chars per token
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function runIngestPipeline(
  options: IngestOptions
): Promise<void> {
  const { docId, projectId, storagePath, sourceType, tocStrategy } = options;

  try {
    // Step 1: Resolve LLM provider (BYOK key → platform key fallback)
    const llmProvider = await getLLMProviderForProject(projectId);

    // Step 2: Download file from R2
    const fileBuffer = await downloadFile(storagePath);

    // Step 3: Parse document
    const parsed = await parseDocument(
      fileBuffer,
      sourceType as "pdf" | "docx" | "txt" | "url"
    );

    // Step 4: Generate ToC (uses project-specific LLM provider)
    const tocResult = await generateDocumentToC(
      parsed,
      docId,
      tocStrategy as ToCStrategy,
      llmProvider
    );

    // Step 4: Process sections (split oversized, merge undersized)
    const processed = processSections(tocResult);

    // Step 5: Store sections in database
    const sectionInputs: CreateSectionInput[] = processed.sections.map(
      (s) => ({
        id: s.id,
        docId,
        title: s.title,
        summary: s.summary,
        content: s.content,
        pageRange: s.pageRange,
        orderIndex: s.orderIndex,
        level: s.level,
        tokenCount: estimateTokens(s.content),
      })
    );

    await createSections(sectionInputs);

    // Step 6: Update document status to ready
    await updateDocumentReady(docId, processed.toc, processed.sections.length);

    console.log(
      `✅ Ingest complete: ${docId} (${processed.sections.length} sections)`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error during ingestion";
    console.error(`❌ Ingest failed: ${docId}`, error);
    await updateDocumentFailed(docId, message);
    throw error;
  }
}
