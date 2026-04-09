export type SourceType = "pdf" | "docx" | "txt" | "url";
export type ToCStrategy = "extract" | "generate" | "hybrid";
export type DocumentStatus = "processing" | "ready" | "failed";
export type RetrievalMode = "vectorless" | "hybrid" | "vector";

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
  source_type: SourceType;
  section_count: number;
  created_at: string;
  sections: ToCEntry[];
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
