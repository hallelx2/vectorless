import { z } from "zod";

// ── Tool Input Schemas ──

export const listDocumentsSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(25)
    .describe("Maximum number of documents to return (1-100). Defaults to 25."),
  cursor: z
    .string()
    .optional()
    .describe(
      "Pagination cursor from a previous response. Omit for the first page."
    ),
});

export const addDocumentSchema = z.object({
  source: z
    .union([
      z.object({
        url: z.string().url().describe("A publicly accessible URL to the document."),
      }),
      z.object({
        filename: z.string().describe("The filename including extension (e.g. report.pdf)."),
        base64: z.string().describe("The file content as a base64-encoded string."),
      }),
    ])
    .describe(
      "The document source — either a public URL or a base64-encoded file."
    ),
  toc_strategy: z
    .enum(["extract", "hybrid", "generate"])
    .optional()
    .default("hybrid")
    .describe(
      "How to build the table of contents. 'extract' uses headings from the document, 'generate' uses an LLM, 'hybrid' combines both. Defaults to 'hybrid'."
    ),
});

export const querySchema = z.object({
  doc_id: z.string().describe("The document ID to query against."),
  query: z
    .string()
    .min(3)
    .describe(
      "A natural-language question. The server runs an agentic tree traversal to find the most relevant sections."
    ),
  max_steps: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe(
      "Maximum number of tree-traversal steps the agent may take. Higher values allow deeper exploration."
    ),
  token_budget: z
    .number()
    .int()
    .min(500)
    .max(128000)
    .optional()
    .describe(
      "Maximum number of tokens the agent may retrieve in total across all selected sections."
    ),
});

export const getTocSchema = z.object({
  doc_id: z.string().describe("The document ID to fetch the table of contents for."),
});

export const fetchSectionSchema = z.object({
  doc_id: z.string().describe("The document ID that contains the section."),
  section_id: z
    .string()
    .describe(
      "The section ID to fetch. Use the table of contents to discover available section IDs."
    ),
});

export const deleteDocumentSchema = z.object({
  doc_id: z
    .string()
    .describe(
      "The document ID to delete. This is irreversible — all sections and metadata will be permanently removed."
    ),
});
