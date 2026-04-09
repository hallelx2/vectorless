import type {
  DocumentSummary,
  DocumentDetail,
  ToCManifest,
  AddDocumentResponse,
  ListDocumentsOptions,
  ListDocumentsResponse,
  Section,
  BatchFetchResponse,
} from "@vectorless/shared";

export class VectorlessApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        body?.error?.message || `API error: ${res.status}`,
        body
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  async listDocuments(
    options?: ListDocumentsOptions
  ): Promise<ListDocumentsResponse> {
    const params = new URLSearchParams();
    if (options?.cursor) params.set("cursor", options.cursor);
    if (options?.limit) params.set("limit", String(options.limit));
    const query = params.toString();
    return this.request(`/documents${query ? `?${query}` : ""}`);
  }

  async getDocument(docId: string): Promise<DocumentDetail> {
    return this.request(`/documents/${docId}`);
  }

  async getToC(docId: string): Promise<ToCManifest> {
    return this.request(`/documents/${docId}/toc`);
  }

  async uploadDocument(formData: FormData): Promise<AddDocumentResponse> {
    const url = `${this.baseUrl}/documents`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        body?.error?.message || `Upload failed: ${res.status}`,
        body
      );
    }

    return res.json();
  }

  async deleteDocument(docId: string): Promise<void> {
    await this.request(`/documents/${docId}`, { method: "DELETE" });
  }

  async fetchSection(docId: string, sectionId: string): Promise<Section> {
    return this.request(`/documents/${docId}/sections/${sectionId}`);
  }

  async fetchSections(
    docId: string,
    sectionIds: string[]
  ): Promise<BatchFetchResponse> {
    return this.request(`/documents/${docId}/sections/batch`, {
      method: "POST",
      body: JSON.stringify({ section_ids: sectionIds }),
    });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Singleton helper for server-side use
export function createApiClient(apiKey?: string): VectorlessApiClient {
  const baseUrl = process.env.VECTORLESS_API_URL;
  const key = apiKey || process.env.VECTORLESS_INTERNAL_API_KEY;

  if (!baseUrl) throw new Error("VECTORLESS_API_URL is not configured");
  if (!key) throw new Error("No API key provided");

  return new VectorlessApiClient(baseUrl, key);
}
