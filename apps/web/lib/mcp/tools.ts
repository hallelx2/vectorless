/**
 * MCP tool definitions for the Vectorless remote MCP server.
 *
 * Aligned with the vectorless-server REST API:
 *   GET    /v1/documents
 *   POST   /v1/documents
 *   GET    /v1/documents/{id}
 *   DELETE /v1/documents/{id}
 *   GET    /v1/documents/{id}/tree
 *   GET    /v1/sections/{id}
 *   POST   /v1/query
 *
 * The MCP route forwards each call to the control plane's /v1/* proxy
 * with the user's OAuth bearer token. The control plane attributes the
 * call to the user's org (from the JWT's org_id claim) and forwards to
 * vectorless-server.
 */
export interface MCPTool {
  name: string;
  description: string;
  /** JSON Schema (draft 7) describing the tool's input. */
  inputSchema: Record<string, unknown>;
}

export const TOOLS: MCPTool[] = [
  {
    name: "vectorless_list_documents",
    description:
      "List documents the authenticated user has uploaded. Returns metadata only — call vectorless_get_tree for structure or vectorless_query to retrieve relevant content.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 200,
          description: "Max documents to return (default 50).",
        },
        cursor: {
          type: "string",
          description: "Cursor from a previous page.",
        },
        status: {
          type: "string",
          enum: ["pending", "parsing", "summarizing", "ready", "failed"],
          description: "Filter by processing status.",
        },
      },
    },
  },

  {
    name: "vectorless_ingest_document",
    description:
      "Upload a document (PDF, DOCX, MD, HTML, plain text) from a public URL or base64-encoded content. Returns immediately with a document_id; processing runs in the background. Use vectorless_get_document to check status.",
    inputSchema: {
      type: "object",
      properties: {
        source_url: {
          type: "string",
          description: "Publicly accessible URL to fetch the document from.",
        },
        content_base64: {
          type: "string",
          description: "Base64-encoded document content (alternative to source_url).",
        },
        filename: {
          type: "string",
          description: "Original filename (helps with format detection).",
        },
        content_type: {
          type: "string",
          description:
            "MIME type override (e.g. \"application/pdf\"). Auto-detected from filename if omitted.",
        },
        wait_for_ready: {
          type: "boolean",
          description:
            "If true, wait until processing completes (up to 2 minutes). Default false.",
        },
      },
      required: ["filename"],
    },
  },

  {
    name: "vectorless_get_document",
    description:
      "Get metadata and processing status for a specific document.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string" },
      },
      required: ["document_id"],
    },
  },

  {
    name: "vectorless_get_tree",
    description:
      "Get the hierarchical structure of a document — sections with titles, summaries, depth, and token counts. Use this to understand what's in a document before querying it.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string" },
      },
      required: ["document_id"],
    },
  },

  {
    name: "vectorless_get_section",
    description:
      "Fetch the full text content of a specific section by ID.",
    inputSchema: {
      type: "object",
      properties: {
        section_id: { type: "string" },
      },
      required: ["section_id"],
    },
  },

  {
    name: "vectorless_query",
    description:
      "Ask a natural-language question about a document. The server runs an LLM agent that navigates the document tree to find the most relevant sections and returns them with full content, retrieval strategy, timing, and cost.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string" },
        query: { type: "string", description: "The question to ask." },
        max_sections: {
          type: "integer",
          minimum: 0,
          description: "Cap on sections returned (0 = no cap, default).",
        },
        max_tokens: {
          type: "integer",
          description: "Max context window tokens for retrieval (default 100000).",
        },
      },
      required: ["document_id", "query"],
    },
  },

  {
    name: "vectorless_delete_document",
    description:
      "Permanently delete a document and all its sections. This action is irreversible.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "string" },
      },
      required: ["document_id"],
    },
  },
];
