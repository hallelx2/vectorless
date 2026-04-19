import { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Variables } from "../app.js";
import { authMiddleware } from "../middleware/auth.js";
import { rateLimitFor } from "../middleware/rate-limit.js";
import { createMcpServer } from "../services/mcp-server.js";
import type { OAuthScope } from "@vectorless/mcp-tools";

const app = new Hono<{ Variables: Variables }>();

/**
 * All scopes granted to API key auth.
 * OAuth tokens will have limited scopes.
 */
const ALL_SCOPES: OAuthScope[] = [
  "documents:read",
  "documents:write",
  "query",
];

/**
 * POST /mcp
 *
 * Main MCP endpoint. Accepts JSON-RPC envelopes (Streamable HTTP transport).
 *
 * STATELESS: A fresh Server + Transport is created per request.
 * This is safe because our MCP handlers are idempotent and hold no
 * per-session state. It also avoids the serverless problem where
 * sessions stored in process memory disappear across lambda instances.
 */
app.post("/", authMiddleware, rateLimitFor("tree_nav"), async (c) => {
  const auth = c.get("auth");
  const sessionId = c.req.header("mcp-session-id") ?? randomUUID();

  // Create a fresh transport + server per request (stateless)
  const transport = new StreamableHTTPServerTransport({
    sessionId,
    onsessioninitialized: () => {},
  });

  const server = createMcpServer({
    projectId: auth.projectId,
    authId: auth.apiKeyId,
    scopes: auth.scopes ?? ALL_SCOPES,
  });

  await server.connect(transport);

  // Read the request body as JSON
  const body = await c.req.json();

  // Process the JSON-RPC request through the transport
  const response = await handleMcpRequest(transport, body, sessionId);
  return response;
});

/**
 * GET /mcp
 *
 * SSE endpoint for server-initiated events (notifications, progress).
 * Not yet implemented — returns 405 per spec until we need server push.
 */
app.get("/", authMiddleware, async (c) => {
  return c.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message:
          "SSE stream not supported in this version. Use POST for request-response.",
      },
      id: null,
    },
    405
  );
});

/**
 * DELETE /mcp
 *
 * Session termination. Since we're now stateless (no server-side session store),
 * this is a no-op that always returns 200.
 */
app.delete("/", authMiddleware, async (c) => {
  return c.json({ ok: true }, 200);
});

// ── Helpers ──

/**
 * Process a JSON-RPC request through the MCP transport.
 *
 * This is a thin adapter since StreamableHTTPServerTransport is designed
 * for Express-style req/res. We simulate the interface it expects.
 */
async function handleMcpRequest(
  transport: StreamableHTTPServerTransport,
  body: unknown,
  sessionId: string
): Promise<Response> {
  return new Promise((resolve) => {
    // Create a mock Node.js-style response to capture the output
    const chunks: Buffer[] = [];
    let statusCode = 200;
    const headers: Record<string, string> = {};

    const mockRes = {
      statusCode: 200,
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = value;
      },
      getHeader(name: string) {
        return headers[name.toLowerCase()];
      },
      writeHead(code: number, hdrs?: Record<string, string>) {
        statusCode = code;
        if (hdrs) {
          for (const [k, v] of Object.entries(hdrs)) {
            headers[k.toLowerCase()] = v;
          }
        }
        return mockRes;
      },
      write(chunk: string | Buffer) {
        chunks.push(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
        );
        return true;
      },
      end(chunk?: string | Buffer) {
        if (chunk) {
          chunks.push(
            Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string)
          );
        }

        const responseBody = Buffer.concat(chunks).toString("utf-8");
        const contentType =
          headers["content-type"] ?? "application/json";

        resolve(
          new Response(responseBody, {
            status: statusCode,
            headers: {
              "content-type": contentType,
              "mcp-session-id": sessionId,
              ...headers,
            },
          })
        );
      },
      on() {
        return mockRes;
      },
      once() {
        return mockRes;
      },
      emit() {
        return false;
      },
      removeListener() {
        return mockRes;
      },
      flushHeaders() {},
    };

    const mockReq = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "mcp-session-id": sessionId,
      },
      body: JSON.stringify(body),
      on(event: string, handler: (...args: unknown[]) => void) {
        if (event === "data") {
          handler(JSON.stringify(body));
        }
        if (event === "end") {
          handler();
        }
        return mockReq;
      },
      removeListener() {
        return mockReq;
      },
    };

    // Use the transport's handleRequest method
    transport
      .handleRequest(mockReq as any, mockRes as any, body)
      .catch((err: Error) => {
        resolve(
          new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: {
                code: -32603,
                message: `Internal error: ${err.message}`,
              },
              id: null,
            }),
            {
              status: 500,
              headers: {
                "content-type": "application/json",
                "mcp-session-id": sessionId,
              },
            }
          )
        );
      });
  });
}

export { app as mcpRoutes };
