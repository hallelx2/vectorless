/**
 * MCP tool handlers.
 *
 * Each handler forwards an MCP tool call to the control plane's /v1/*
 * proxy with the user's OAuth bearer token. The control plane validates
 * the token, attributes the call to the user's org (via the JWT's
 * org_id claim), and proxies to vectorless-server.
 *
 * No SDK dependency — these are plain fetch calls.
 */
import { controlPlaneUrl } from "@/lib/control-plane";

export interface HandlerContext {
  /** OAuth bearer token from the MCP request. Forwarded to control plane. */
  bearerToken: string;
}

class HandlerError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function callV1<T = unknown>(
  ctx: HandlerContext,
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const url = `${controlPlaneUrl()}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${ctx.bearerToken}`,
    ...init.headers,
  };

  let body: BodyInit | undefined;
  if (init.body !== undefined) {
    if (init.body instanceof FormData) {
      body = init.body;
    } else if (init.body instanceof Uint8Array) {
      // Wrap in a Blob to satisfy BodyInit across Node 20's lib.dom
      // + lib.webworker type collision.
      body = new Blob([init.body as BlobPart]);
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(init.body);
    }
  }

  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body,
  });

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const errBody = await res.json();
      detail =
        (errBody?.error_description as string | undefined) ??
        (errBody?.error as string | undefined) ??
        (errBody?.message as string | undefined);
    } catch {
      // ignore
    }
    throw new HandlerError(
      res.status,
      detail ?? `${init.method ?? "GET"} ${path} failed: ${res.status}`,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Handlers ───────────────────────────────────────────────────────

interface ListDocumentsArgs {
  limit?: number;
  cursor?: string;
  status?: string;
}

export async function handleListDocuments(
  ctx: HandlerContext,
  args: ListDocumentsArgs,
) {
  const params = new URLSearchParams();
  if (args.limit != null) params.set("limit", String(args.limit));
  if (args.cursor) params.set("cursor", args.cursor);
  if (args.status) params.set("status", args.status);

  const qs = params.toString();
  const path = qs ? `/v1/documents?${qs}` : "/v1/documents";
  return callV1(ctx, path, { method: "GET" });
}

interface IngestDocumentArgs {
  source_url?: string;
  content_base64?: string;
  filename: string;
  content_type?: string;
  wait_for_ready?: boolean;
}

export async function handleIngestDocument(
  ctx: HandlerContext,
  args: IngestDocumentArgs,
) {
  if (!args.source_url && !args.content_base64) {
    throw new HandlerError(400, "Provide either source_url or content_base64");
  }

  // Resolve content
  let bytes: Uint8Array;
  let contentType = args.content_type ?? "application/octet-stream";

  if (args.source_url) {
    const res = await fetch(args.source_url);
    if (!res.ok) {
      throw new HandlerError(
        res.status,
        `Failed to fetch source_url: HTTP ${res.status}`,
      );
    }
    const ct = res.headers.get("content-type");
    if (ct && !args.content_type) contentType = ct;
    bytes = new Uint8Array(await res.arrayBuffer());
  } else {
    bytes = Uint8Array.from(atob(args.content_base64!), (c) => c.charCodeAt(0));
  }

  // Build multipart upload — vectorless-server's /v1/documents accepts
  // multipart/form-data with a "file" part.
  const fd = new FormData();
  const blob = new Blob([bytes as BlobPart], { type: contentType });
  fd.append("file", blob, args.filename);
  if (args.content_type) fd.append("content_type", args.content_type);

  const created = await callV1<{ document_id: string; status: string }>(
    ctx,
    "/v1/documents",
    { method: "POST", body: fd },
  );

  if (!args.wait_for_ready) return created;

  // Poll until ready (capped at 120s)
  const deadline = Date.now() + 120_000;
  let interval = 2_000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval));
    const doc = await callV1<{ id: string; status: string }>(ctx, `/v1/documents/${created.document_id}`);
    if (doc.status === "ready") return doc;
    if (doc.status === "failed") {
      throw new HandlerError(422, "document processing failed");
    }
    interval = Math.min(interval * 1.5, 10_000);
  }
  // Timed out waiting; return the latest known status
  return created;
}

export async function handleGetDocument(
  ctx: HandlerContext,
  args: { document_id: string },
) {
  return callV1(ctx, `/v1/documents/${encodeURIComponent(args.document_id)}`);
}

export async function handleGetTree(
  ctx: HandlerContext,
  args: { document_id: string },
) {
  return callV1(ctx, `/v1/documents/${encodeURIComponent(args.document_id)}/tree`);
}

export async function handleGetSection(
  ctx: HandlerContext,
  args: { section_id: string },
) {
  return callV1(ctx, `/v1/sections/${encodeURIComponent(args.section_id)}`);
}

interface QueryArgs {
  document_id: string;
  query: string;
  max_sections?: number;
  max_tokens?: number;
}

export async function handleQuery(ctx: HandlerContext, args: QueryArgs) {
  return callV1(ctx, "/v1/query", {
    method: "POST",
    body: {
      document_id: args.document_id,
      query: args.query,
      max_sections: args.max_sections,
      max_tokens: args.max_tokens,
    },
  });
}

export async function handleDeleteDocument(
  ctx: HandlerContext,
  args: { document_id: string },
) {
  await callV1(ctx, `/v1/documents/${encodeURIComponent(args.document_id)}`, {
    method: "DELETE",
  });
  return { document_id: args.document_id, deleted: true };
}

// ── Dispatcher ─────────────────────────────────────────────────────

export const TOOL_HANDLERS: Record<
  string,
  (ctx: HandlerContext, args: any) => Promise<unknown>
> = {
  vectorless_list_documents: handleListDocuments,
  vectorless_ingest_document: handleIngestDocument,
  vectorless_get_document: handleGetDocument,
  vectorless_get_tree: handleGetTree,
  vectorless_get_section: handleGetSection,
  vectorless_query: handleQuery,
  vectorless_delete_document: handleDeleteDocument,
};

export { HandlerError };
