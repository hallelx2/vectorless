/**
 * Maps each MCP tool to the OAuth scope required to call it.
 *
 * - documents:read  → list, get, tree, section
 * - documents:write → ingest, delete
 * - query           → query
 *
 * The MCP server filters `tools/list` to only those scopes the user
 * granted, and rejects `tools/call` for any tool whose scope wasn't
 * approved.
 */
export type Scope = "documents:read" | "documents:write" | "query";

export const TOOL_SCOPE_MAP: Record<string, Scope> = {
  vectorless_list_documents: "documents:read",
  vectorless_get_document: "documents:read",
  vectorless_get_tree: "documents:read",
  vectorless_get_section: "documents:read",
  vectorless_query: "query",
  vectorless_ingest_document: "documents:write",
  vectorless_delete_document: "documents:write",
};
