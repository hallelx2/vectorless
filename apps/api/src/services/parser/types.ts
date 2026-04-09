export interface NativeHeading {
  title: string;
  level: number;
  startOffset: number;
  endOffset: number;
  pageStart?: number;
  pageEnd?: number;
  children: NativeHeading[];
}

export interface ParsedDocument {
  title: string;
  sourceType: "pdf" | "docx" | "txt" | "url";
  fullText: string;
  nativeStructure: NativeHeading[] | null;
  pageMap?: { pageNumber: number; startOffset: number; endOffset: number }[];
  metadata: Record<string, unknown>;
}
