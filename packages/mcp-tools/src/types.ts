import type { z } from "zod";

/**
 * OAuth scopes that map to MCP tool permissions.
 * - documents:read  → list_documents, get_toc, fetch_section
 * - documents:write → add_document, delete_document
 * - query           → query
 */
export type OAuthScope = "documents:read" | "documents:write" | "query";

/**
 * Shape of a single MCP tool definition.
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}

/**
 * Result returned from an MCP tool handler.
 * JSON-serializable — the transport layer wraps this in the MCP response envelope.
 */
export type ToolResult = Record<string, unknown> | unknown[] | string | void;
