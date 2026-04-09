export interface VectorlessConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface AddDocumentOptions {
  sourceType?: "pdf" | "docx" | "txt" | "url";
  tocStrategy?: "extract" | "generate" | "hybrid";
  embedSections?: boolean;
  title?: string;
}

export interface AddDocumentResponse {
  doc_id: string;
  status: "processing" | "ready" | "failed";
  toc?: ToCManifest;
}

export interface PageRange {
  start: number;
  end: number;
}

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
  source_type: string;
  section_count: number;
  created_at: string;
  sections: ToCEntry[];
}

export interface Section {
  section_id: string;
  doc_id: string;
  title: string;
  summary: string | null;
  content: string;
  page_range: PageRange | null;
  order_index: number;
  token_count: number;
}

export interface DocumentSummary {
  doc_id: string;
  title: string;
  source_type: string;
  section_count: number | null;
  status: "processing" | "ready" | "failed";
  created_at: string;
}

export interface DocumentDetail extends DocumentSummary {
  toc_strategy: string;
  toc: ToCManifest | null;
  original_file_url: string | null;
  error_message: string | null;
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

export interface WaitForReadyOptions {
  timeout?: number;
  pollInterval?: number;
}
