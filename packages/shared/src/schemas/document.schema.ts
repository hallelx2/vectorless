import { z } from "zod";

export const sourceTypeSchema = z.enum(["pdf", "docx", "txt", "url"]);
export const tocStrategySchema = z.enum(["extract", "generate", "hybrid"]);
export const documentStatusSchema = z.enum(["processing", "ready", "failed"]);
export const retrievalModeSchema = z.enum(["vectorless", "hybrid", "vector"]);

export const pageRangeSchema = z.object({
  start: z.number().int().min(0),
  end: z.number().int().min(0),
});

// ── Flat ToC (backward-compatible) ──

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

// ── Hierarchical Tree ToC (PageIndex-style) ──

export const tocTreeNodeSchema: z.ZodType<{
  section_id: string;
  title: string;
  summary: string;
  level: number;
  page_range: { start: number; end: number } | null;
  token_count: number;
  child_count: number;
  is_leaf: boolean;
  link: string;
  children: unknown[];
}> = z.lazy(() =>
  z.object({
    section_id: z.string(),
    title: z.string(),
    summary: z.string(),
    level: z.number().int(),
    page_range: pageRangeSchema.nullable(),
    token_count: z.number().int(),
    child_count: z.number().int(),
    is_leaf: z.boolean(),
    link: z.string(),
    children: z.array(tocTreeNodeSchema),
  })
);

export const tocTreeManifestSchema = z.object({
  doc_id: z.string(),
  title: z.string(),
  source_type: sourceTypeSchema,
  section_count: z.number().int(),
  depth: z.number().int(),
  created_at: z.string(),
  tree: z.array(tocTreeNodeSchema),
});

// ── Agentic Retrieval ──

export const traversalStepSchema = z.object({
  step: z.number().int(),
  tool_called: z.string(),
  arguments: z.record(z.unknown()),
  result_summary: z.string(),
  reasoning: z.string(),
  tokens_used: z.number().int(),
});

export const treeQueryOptionsSchema = z.object({
  max_steps: z.number().int().min(1).max(50).optional().default(10),
  token_budget: z.number().int().min(1000).optional().default(50000),
});

export const treeQueryRequestSchema = z.object({
  query: z.string().min(1),
  max_steps: z.number().int().min(1).max(50).optional(),
  token_budget: z.number().int().min(1000).optional(),
});

// ── Existing ──

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
