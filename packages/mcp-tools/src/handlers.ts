import type { VectorlessClient } from "vectorless";
import type { z } from "zod";
import type {
  listDocumentsSchema,
  addDocumentSchema,
  querySchema,
  getTocSchema,
  fetchSectionSchema,
  deleteDocumentSchema,
} from "./schemas.js";

// ── Handler input types (inferred from Zod schemas) ──

type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
type AddDocumentInput = z.infer<typeof addDocumentSchema>;
type QueryInput = z.infer<typeof querySchema>;
type GetTocInput = z.infer<typeof getTocSchema>;
type FetchSectionInput = z.infer<typeof fetchSectionSchema>;
type DeleteDocumentInput = z.infer<typeof deleteDocumentSchema>;

/**
 * Handler functions for each MCP tool.
 *
 * Each handler receives a VectorlessClient (configured with the user's API key)
 * and the validated, parsed arguments from the tool call.
 *
 * Returns a JSON-serializable result that the MCP server wraps in a text content block.
 */
export const handlers: Record<
  string,
  (client: VectorlessClient, args: any) => Promise<unknown>
> = {
  /**
   * List documents in the authenticated project.
   */
  vectorless_list_documents: async (
    client: VectorlessClient,
    args: ListDocumentsInput
  ) => {
    return client.listDocuments({
      limit: args.limit,
      cursor: args.cursor,
    });
  },

  /**
   * Upload a document from a URL or base64-encoded file.
   */
  vectorless_add_document: async (
    client: VectorlessClient,
    args: AddDocumentInput
  ) => {
    if ("url" in args.source) {
      // URL source — fetch and upload
      const response = await fetch(args.source.url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch document from URL: ${response.status} ${response.statusText}`
        );
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      return client.addDocument(buffer, {
        tocStrategy: args.toc_strategy,
        sourceType: guessSourceType(args.source.url),
      });
    }

    // Base64 source — decode and upload
    const buffer = Buffer.from(args.source.base64, "base64");
    return client.addDocument(buffer, {
      tocStrategy: args.toc_strategy,
      sourceType: guessSourceType(args.source.filename),
      title: args.source.filename,
    });
  },

  /**
   * Run an agentic query against a document.
   */
  vectorless_query: async (
    client: VectorlessClient,
    args: QueryInput
  ) => {
    return client.query(args.doc_id, args.query, {
      max_steps: args.max_steps,
      token_budget: args.token_budget,
    });
  },

  /**
   * Get the table of contents for a document.
   */
  vectorless_get_toc: async (
    client: VectorlessClient,
    args: GetTocInput
  ) => {
    return client.getToC(args.doc_id);
  },

  /**
   * Fetch the full content of a specific section.
   */
  vectorless_fetch_section: async (
    client: VectorlessClient,
    args: FetchSectionInput
  ) => {
    return client.fetchSection(args.doc_id, args.section_id);
  },

  /**
   * Delete a document and all its sections.
   */
  vectorless_delete_document: async (
    client: VectorlessClient,
    args: DeleteDocumentInput
  ) => {
    await client.deleteDocument(args.doc_id);
    return { success: true, doc_id: args.doc_id, message: "Document deleted." };
  },
};

// ── Helpers ──

/**
 * Guess the source type from a filename or URL.
 */
function guessSourceType(
  filenameOrUrl: string
): "pdf" | "docx" | "txt" | "url" | undefined {
  const lower = filenameOrUrl.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt") || lower.endsWith(".md")) return "txt";
  if (lower.startsWith("http://") || lower.startsWith("https://")) return "url";
  return undefined;
}
