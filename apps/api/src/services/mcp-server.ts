import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  toolDefinitions,
  handlers,
  scopeForTool,
} from "@vectorless/mcp-tools";
import type { OAuthScope } from "@vectorless/mcp-tools";
import { VectorlessClient } from "vectorless";

export interface McpServerContext {
  /** The project the authenticated user/key belongs to */
  projectId: string;
  /** API key or OAuth token ID */
  authId: string;
  /** Scopes the auth context has access to */
  scopes: OAuthScope[];
}

/**
 * Create a configured MCP Server instance for a given auth context.
 *
 * The server is stateless per request — each HTTP request gets its own
 * VectorlessClient pointed at the internal API (or external, depending on config).
 * This keeps the remote MCP server as a thin adapter over the existing REST API.
 */
export function createMcpServer(ctx: McpServerContext): Server {
  const server = new Server(
    { name: "vectorless", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  // Build a VectorlessClient configured for this project's internal access.
  // In the remote server context, we use the API key that was already authenticated
  // by the auth middleware, so the client talks to our own API.
  const baseUrl =
    process.env.VECTORLESS_INTERNAL_API_URL ??
    process.env.VECTORLESS_API_URL ??
    "https://api.vectorless.store";

  // The client will use a special internal header to bypass re-authentication
  // since the user is already authenticated via the MCP route's auth middleware.
  // For now, we pass the original API key through — the middleware already validated it.
  const client = new VectorlessClient({
    apiKey: ctx.authId,
    baseUrl,
  });

  /**
   * tools/list — return all tools the caller has scope for.
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const visibleTools = toolDefinitions.filter((t) => {
      const required = scopeForTool[t.name];
      return !required || ctx.scopes.includes(required);
    });

    return {
      tools: visibleTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: zodToJsonSchema(t.inputSchema) as Record<string, unknown>,
      })),
    };
  });

  /**
   * tools/call — validate scope, parse input, dispatch to handler.
   */
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const toolName = req.params.name;
    const tool = toolDefinitions.find((t) => t.name === toolName);

    if (!tool) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${toolName}. Use tools/list to see available tools.`,
          },
        ],
      };
    }

    // Scope enforcement
    const requiredScope = scopeForTool[toolName];
    if (requiredScope && !ctx.scopes.includes(requiredScope)) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Insufficient permissions: tool "${toolName}" requires scope "${requiredScope}".`,
          },
        ],
      };
    }

    // Validate arguments
    const parsed = tool.inputSchema.safeParse(req.params.arguments ?? {});
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map(
          (i: { path: (string | number)[]; message: string }) =>
            `  - ${i.path.join(".")}: ${i.message}`
        )
        .join("\n");
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Invalid arguments for ${toolName}:\n${issues}`,
          },
        ],
      };
    }

    try {
      const handler = handlers[toolName];
      if (!handler) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `No handler registered for tool: ${toolName}`,
            },
          ],
        };
      }

      const result = await handler(client, parsed.data);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Scrub secrets from error messages
      const scrubbed = message
        .replace(/vl_[a-z_]+_[A-Za-z0-9]{20,}/g, "vl_***")
        .replace(/eyJ[A-Za-z0-9_-]{20,}/g, "***jwt***");
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Vectorless error: ${scrubbed}`,
          },
        ],
      };
    }
  });

  return server;
}
