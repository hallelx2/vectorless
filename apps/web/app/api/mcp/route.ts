import { NextRequest, NextResponse } from "next/server";

import { controlPlane } from "@/lib/control-plane";
import { TOOLS } from "@/lib/mcp/tools";
import { TOOL_HANDLERS, HandlerError } from "@/lib/mcp/handlers";
import { TOOL_SCOPE_MAP } from "@/lib/mcp/scope-map";

/**
 * Vectorless MCP — Streamable HTTP endpoint.
 *
 * Mounted at https://mcp.vectorless.store/api/mcp.
 *
 * Authentication: OAuth 2.1 bearer token, validated via control plane
 * introspection on every request. Tokens are issued by the control
 * plane after the user approves the consent screen on
 * https://vectorless.store/oauth/consent.
 *
 * Stateless: a fresh dispatch happens per request. No in-memory session
 * state, so the route scales to zero on serverless.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export async function POST(req: NextRequest) {
  // ── Authenticate ────────────────────────────────────────────────
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return wwwAuthenticate("missing_token");
  }
  const token = auth.slice("Bearer ".length).trim();

  let claims: Awaited<ReturnType<typeof controlPlane.oauth.introspect>>;
  try {
    claims = await controlPlane.oauth.introspect(token);
  } catch {
    return wwwAuthenticate("introspection_failed");
  }
  if (!claims.active) {
    return wwwAuthenticate("invalid_token");
  }

  const scopes = claims.scope.split(" ").filter(Boolean);

  // ── Parse JSON-RPC body ─────────────────────────────────────────
  let body: JsonRpcRequest;
  try {
    body = (await req.json()) as JsonRpcRequest;
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  if (!body || typeof body !== "object" || body.jsonrpc !== "2.0") {
    return jsonRpcError(body?.id ?? null, -32600, "Invalid request");
  }

  // ── Dispatch ────────────────────────────────────────────────────
  try {
    return NextResponse.json(await dispatch(body, { scopes, bearerToken: token }));
  } catch (e) {
    return jsonRpcError(
      body.id ?? null,
      -32603,
      "Internal error",
      e instanceof Error ? e.message : String(e),
    );
  }
}

/** GET is reserved for SSE in some MCP clients. We don't use it (stateless). */
export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}

/** DELETE terminates a session. We're stateless — always 200. */
export function DELETE() {
  return new NextResponse(null, { status: 200 });
}

// ── JSON-RPC dispatcher ───────────────────────────────────────────

interface DispatchContext {
  scopes: string[];
  bearerToken: string;
}

async function dispatch(req: JsonRpcRequest, ctx: DispatchContext) {
  const { id, method, params } = req;

  switch (method) {
    case "initialize": {
      // MCP handshake response. Return our protocol version + caps.
      return {
        jsonrpc: "2.0" as const,
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "vectorless", version: "1.0.0" },
        },
      };
    }

    case "notifications/initialized": {
      // Notification — no response body needed, but JSON-RPC requires
      // we return something for the HTTP wrapper. Use a no-op result.
      return { jsonrpc: "2.0" as const, id, result: {} };
    }

    case "ping": {
      return { jsonrpc: "2.0" as const, id, result: {} };
    }

    case "tools/list": {
      // Filter tools by the user's granted scopes
      const allowed = TOOLS.filter((t) => {
        const required = TOOL_SCOPE_MAP[t.name];
        return required && ctx.scopes.includes(required);
      });
      return {
        jsonrpc: "2.0" as const,
        id,
        result: { tools: allowed },
      };
    }

    case "tools/call": {
      const { name, arguments: args } = (params ?? {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      if (!name) {
        return rpcError(id, -32602, "Missing tool name");
      }
      const requiredScope = TOOL_SCOPE_MAP[name];
      if (!requiredScope) {
        return toolErrorResult(id, `Unknown tool: ${name}`);
      }
      if (!ctx.scopes.includes(requiredScope)) {
        return toolErrorResult(
          id,
          `Scope "${requiredScope}" was not granted for this tool.`,
        );
      }
      const handler = TOOL_HANDLERS[name];
      if (!handler) {
        return toolErrorResult(id, `No handler registered for tool: ${name}`);
      }

      try {
        const result = await handler({ bearerToken: ctx.bearerToken }, args ?? {});
        return {
          jsonrpc: "2.0" as const,
          id,
          result: {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } catch (e) {
        const message =
          e instanceof HandlerError
            ? `${e.message} (status ${e.status})`
            : e instanceof Error
              ? e.message
              : String(e);
        return toolErrorResult(id, scrubSecrets(message));
      }
    }

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ── Response helpers ──────────────────────────────────────────────

function jsonRpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: string,
) {
  return NextResponse.json(
    {
      jsonrpc: "2.0",
      id: id ?? null,
      error: data ? { code, message, data } : { code, message },
    },
    // JSON-RPC errors return HTTP 200 with the error in the body.
    { status: 200 },
  );
}

function rpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
) {
  return {
    jsonrpc: "2.0" as const,
    id: id ?? null,
    error: { code, message },
  };
}

function toolErrorResult(
  id: string | number | null | undefined,
  message: string,
) {
  // Tool errors are returned as `result.isError: true` per the MCP spec
  // so the AI client can surface them to the user.
  return {
    jsonrpc: "2.0" as const,
    id: id ?? null,
    result: {
      content: [{ type: "text", text: JSON.stringify({ error: message }) }],
      isError: true,
    },
  };
}

function wwwAuthenticate(error: string) {
  return new NextResponse(JSON.stringify({ error }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": `Bearer realm="vectorless-mcp", error="${error}"`,
    },
  });
}

function scrubSecrets(s: string): string {
  return s
    .replace(/vl_[a-zA-Z0-9_]+/g, "vl_***")
    .replace(/Bearer [^\s,;]+/g, "Bearer ***")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "eyJ***");
}
