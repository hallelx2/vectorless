import { z } from "zod";

export const sourceTypeSchema = z.enum(["pdf", "docx", "txt", "url"]);
export const tocStrategySchema = z.enum(["extract", "generate", "hybrid"]);
export const documentStatusSchema = z.enum(["processing", "ready", "failed"]);
export const retrievalModeSchema = z.enum(["vectorless", "hybrid", "vector"]);

export const pageRangeSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
});

export const tocEntrySchema = z.object({
  section_id: z.string(),
  title: z.string(),
  summary: z.string(),
  page_range: pageRangeSchema.nullable(),
  link: z.string(),
});

export const tocManifestSchema = z.object({
  doc_id: z.string(),
  title: z.string(),
  source_type: sourceTypeSchema,
  section_count: z.number().int(),
  created_at: z.string(),
  sections: z.array(tocEntrySchema),
});

export const addDocumentOptionsSchema = z.object({
  source_type: sourceTypeSchema.optional(),
  toc_strategy: tocStrategySchema.optional(),
  embed_sections: z.boolean().optional(),
  title: z.string().optional(),
});

export const listDocumentsOptionsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
});
