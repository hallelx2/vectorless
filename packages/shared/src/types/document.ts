export type SourceType = "pdf" | "docx" | "txt" | "url";
export type ToCStrategy = "extract" | "generate" | "hybrid";
export type DocumentStatus = "processing" | "ready" | "failed";
export type RetrievalMode = "vectorless" | "hybrid" | "vector";

export interface PageRange {
  start: number;
  end: number;
}

// ── Flat ToC (backward-compatible) ──

export interface ToCEntry {
  section_id: string;
  title: string;
  summary: string;
  page_range: PageRange | null;
  link: string;
}

export interface ToCManifest {
  doc_id: string;
  title: string;
  source_type: SourceType;
  section_count: number;
  created_at: string;
  sections: ToCEntry[];
}

// ── Hierarchical Tree ToC (PageIndex-style) ──

export interface ToCTreeNode {
  section_id: string;
  title: string;
  summary: string;
  level: number;
  page_range: PageRange | null;
  token_count: number;
  child_count: number;
  is_leaf: boolean;
  link: string;
  children: ToCTreeNode[];
}

export interface ToCTreeManifest {
  doc_id: string;
  title: string;
  source_type: SourceType;
  section_count: number;
  depth: number;
  created_at: string;
  tree: ToCTreeNode[];
}

// ── Agentic Retrieval Types ──

export interface TraversalStep {
  step: number;
  tool_called: string;
  arguments: Record<string, unknown>;
  result_summary: string;
  reasoning: string;
  tokens_used: number;
}

export interface TreeQueryOptions {
  max_steps?: number;
  token_budget?: number;
}

export interface TreeQueryResult {
  sections: import("./section.js").Section[];
  traversal_trace: TraversalStep[];
  total_steps: number;
  tokens_retrieved: number;
  reasoning_summary: string;
}

export interface AddDocumentOptions {
  source_type?: SourceType;
  toc_strategy?: ToCStrategy;
  embed_sections?: boolean;
  title?: string;
}

export interface AddDocumentResponse {
  doc_id: string;
  status: DocumentStatus;
  toc?: ToCManifest;
}

export interface DocumentSummary {
  doc_id: string;
  title: string;
  source_type: SourceType;
  section_count: number | null;
  status: DocumentStatus;
  created_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  toc_strategy: ToCStrategy;
  toc: ToCManifest | null;
  original_file_url: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
}

export interface ListDocumentsOptions {
  cursor?: string;
  limit?: number;
}

export interface ListDocumentsResponse {
  documents: DocumentSummary[];
  next_cursor: string | null;
  has_more: boolean;
}
