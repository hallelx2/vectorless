// ── @vectorless/mcp-tools ──
// Single source of truth for MCP tool definitions shared by
// the local stdio server (apps/mcp-stdio) and remote HTTP server (apps/api /mcp routes).

export { toolDefinitions, scopeForTool } from "./tools.js";
export { handlers } from "./handlers.js";
export {
  listDocumentsSchema,
  addDocumentSchema,
  querySchema,
  getTocSchema,
  fetchSectionSchema,
  deleteDocumentSchema,
} from "./schemas.js";
export type { OAuthScope, McpToolDefinition, ToolResult } from "./types.js";
