import type { OAuthScope, McpToolDefinition } from "./types.js";
import {
  listDocumentsSchema,
  addDocumentSchema,
  querySchema,
  getTocSchema,
  fetchSectionSchema,
  deleteDocumentSchema,
} from "./schemas.js";

/**
 * All MCP tool definitions exposed by the Vectorless MCP server.
 *
 * These are the single source of truth — both the local stdio server
 * and the remote HTTP server import from here.
 */
export const toolDefinitions: McpToolDefinition[] = [
  {
    name: "vectorless_list_documents",
    description:
      "List all documents the authenticated project has uploaded to Vectorless. Returns doc_id, title, status, and page count for each document.",
    inputSchema: listDocumentsSchema,
  },
  {
    name: "vectorless_add_document",
    description:
      "Upload a document to Vectorless. Accepts a public URL or a base64-encoded file. The server parses the document, builds a hierarchical table of contents, and returns a doc_id once processing is complete. Supported formats: PDF, DOCX, TXT, and web URLs.",
    inputSchema: addDocumentSchema,
  },
  {
    name: "vectorless_query",
    description:
      "Ask a natural-language question against a document. The server runs an agentic tree-traversal to intelligently navigate the document's structure and retrieve the most relevant sections. Returns the selected sections along with a complete reasoning trace showing how the agent explored the document. This is the primary retrieval tool.",
    inputSchema: querySchema,
  },
  {
    name: "vectorless_get_toc",
    description:
      "Fetch the structured table of contents for a document. Returns a hierarchical tree of sections with titles, summaries, and IDs. Lightweight — does not include full section content. Use this to understand a document's structure before querying or fetching specific sections.",
    inputSchema: getTocSchema,
  },
  {
    name: "vectorless_fetch_section",
    description:
      "Fetch the full content of a specific section by ID. Use after reading the table of contents to retrieve the complete text of a section you're interested in. Returns the section title, summary, content, page range, and token count.",
    inputSchema: fetchSectionSchema,
  },
  {
    name: "vectorless_delete_document",
    description:
      "Delete a document and all of its sections from the project. This action is irreversible — the document, its table of contents, and all section data will be permanently removed.",
    inputSchema: deleteDocumentSchema,
  },
];

/**
 * Maps each tool name to the OAuth scope required to call it.
 * API keys implicitly have all scopes. OAuth tokens must include the required scope.
 */
export const scopeForTool: Record<string, OAuthScope> = {
  vectorless_list_documents: "documents:read",
  vectorless_get_toc: "documents:read",
  vectorless_fetch_section: "documents:read",
  vectorless_query: "query",
  vectorless_add_document: "documents:write",
  vectorless_delete_document: "documents:write",
};
