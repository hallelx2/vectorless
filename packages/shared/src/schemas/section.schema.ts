import { z } from "zod";
import { pageRangeSchema } from "./document.schema.js";

export const sectionSchema = z.object({
  section_id: z.string(),
  doc_id: z.string(),
  title: z.string(),
  summary: z.string().nullable(),
  content: z.string(),
  page_range: pageRangeSchema.nullable(),
  order_index: z.number().int(),
  token_count: z.number().int(),
});

export const batchFetchRequestSchema = z.object({
  section_ids: z.array(z.string()).min(1).max(100),
});

export const vectorSearchRequestSchema = z.object({
  query: z.string().min(1),
  top_k: z.number().int().min(1).max(50).optional().default(5),
  threshold: z.number().min(0).max(1).optional().default(0.5),
});
