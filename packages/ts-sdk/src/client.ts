import { resolveConfig } from "./config.js";
import { HttpTransport } from "./http.js";
import { prepareUpload } from "./upload.js";
import { ServerError, VectorlessError } from "./errors.js";
import type {
  VectorlessConfig,
  AddDocumentOptions,
  AddDocumentResponse,
  ToCManifest,
  Section,
  DocumentDetail,
  ListDocumentsOptions,
  ListDocumentsResponse,
  WaitForReadyOptions,
} from "./types.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class VectorlessClient {
  private readonly http: HttpTransport;

  constructor(config?: Partial<VectorlessConfig>) {
    const resolved = resolveConfig(config);
    this.http = new HttpTransport(resolved);
  }

  /**
   * Upload and ingest a document. Returns when the document is ready.
   * For large documents, this may take 10-60 seconds as it waits for processing.
   */
  async addDocument(
    source: Buffer | ArrayBuffer | Blob | string,
    options?: AddDocumentOptions
  ): Promise<{ doc_id: string; toc: ToCManifest }> {
    const formData = await prepareUpload(source, {
      source_type: options?.sourceType,
      toc_strategy: options?.tocStrategy,
      embed_sections: options?.embedSections,
      title: options?.title,
    });

    const initial = await this.http.post<AddDocumentResponse>(
      "/v1/documents",
      formData,
      { isMultipart: true }
    );

    if (initial.status === "ready" && initial.toc) {
      return { doc_id: initial.doc_id, toc: initial.toc };
    }

    // Poll until ready
    return this.waitForReady(initial.doc_id);
  }

  /**
   * Get the Table of Contents manifest for a document.
   */
  async getToC(docId: string): Promise<ToCManifest> {
    return this.http.get<ToCManifest>(`/v1/documents/${docId}/toc`);
  }

  /**
   * Fetch a single section by ID.
   */
  async fetchSection(docId: string, sectionId: string): Promise<Section> {
    return this.http.get<Section>(
      `/v1/documents/${docId}/sections/${sectionId}`
    );
  }

  /**
   * Fetch multiple sections in parallel. Returns in document order.
   */
  async fetchSections(
    docId: string,
    sectionIds: string[]
  ): Promise<Section[]> {
    const response = await this.http.post<{ sections: Section[] }>(
      `/v1/documents/${docId}/sections/batch`,
      { section_ids: sectionIds }
    );
    return response.sections;
  }

  /**
   * Get document details including processing status.
   */
  async getDocument(docId: string): Promise<DocumentDetail> {
    return this.http.get<DocumentDetail>(`/v1/documents/${docId}`);
  }

  /**
   * List all documents in the project.
   */
  async listDocuments(
    options?: ListDocumentsOptions
  ): Promise<ListDocumentsResponse> {
    const params = new URLSearchParams();
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));

    const qs = params.toString();
    const path = qs ? `/v1/documents?${qs}` : "/v1/documents";
    return this.http.get<ListDocumentsResponse>(path);
  }

  /**
   * Delete a document and all its sections.
   */
  async deleteDocument(docId: string): Promise<void> {
    await this.http.delete(`/v1/documents/${docId}`);
  }

  /**
   * Wait for a document to finish processing.
   */
  async waitForReady(
    docId: string,
    options?: WaitForReadyOptions
  ): Promise<{ doc_id: string; toc: ToCManifest }> {
    const maxWait = options?.timeout ?? 300_000; // 5 minutes
    let pollInterval = options?.pollInterval ?? 2_000;
    const deadline = Date.now() + maxWait;

    while (Date.now() < deadline) {
      await sleep(pollInterval);

      const doc = await this.getDocument(docId);

      if (doc.status === "ready") {
        const toc = await this.getToC(docId);
        return { doc_id: docId, toc };
      }

      if (doc.status === "failed") {
        throw new ServerError(
          `Document processing failed: ${doc.error_message ?? "Unknown error"}`
        );
      }

      // Exponential backoff (cap at 10s)
      pollInterval = Math.min(pollInterval * 1.5, 10_000);
    }

    throw new VectorlessError(
      "Document processing timed out",
      408,
      "timeout"
    );
  }
}
