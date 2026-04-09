import type { PageRange } from "./document.js";

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

export interface SectionSummary {
  section_id: string;
  title: string;
  summary: string | null;
  page_range: PageRange | null;
  order_index: number;
}

export interface BatchFetchRequest {
  section_ids: string[];
}

export interface BatchFetchResponse {
  sections: Section[];
}

export interface VectorSearchRequest {
  query: string;
  top_k?: number;
  threshold?: number;
}

export interface VectorSearchResponse {
  sections: (Section & { similarity: number })[];
}
