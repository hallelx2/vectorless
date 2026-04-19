import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { toolDefinitions, handlers } from "@vectorless/mcp-tools";
import { VectorlessClient } from "vectorless";

// ── Configuration ──

const apiKey = process.env.VECTORLESS_API_KEY;
if (!apiKey) {
  console.error(
    "[vectorless-mcp] VECTORLESS_API_KEY environment variable is required.\n" +
      "Get one at https://vectorless.store/dashboard/api-keys"
  );
  process.exit(1);
}

const baseUrl =
  process.env.VECTORLESS_API_URL ?? "https://api.vectorless.store";

// ── Client ──

const client = new VectorlessClient({ apiKey, baseUrl });

// ── MCP Server ──

const server = new Server(
  { name: "vectorless", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

/**
 * Handle tools/list — return all available tool definitions with JSON Schema.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema) as Record<string, unknown>,
  })),
}));

/**
 * Handle tools/call — validate input, dispatch to the handler, return result.
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

  // Validate arguments against the tool's Zod schema
  const parsed = tool.inputSchema.safeParse(req.params.arguments ?? {});
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i: { path: (string | number)[]; message: string }) => `  - ${i.path.join(".")}: ${i.message}`)
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
    // NEVER include the API key in error messages
    const scrubbed = message.replace(
      /vl_[a-z_]+_[A-Za-z0-9]{20,}/g,
      "vl_***"
    );
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

// ── Start ──

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[vectorless-mcp] Connected over stdio. Ready for requests.");
}

main().catch((err) => {
  console.error("[vectorless-mcp] Fatal error:", err);
  process.exit(1);
});
