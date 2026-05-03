import { NextResponse } from "next/server";

import { controlPlaneUrl } from "@/lib/control-plane";

/**
 * RFC 9728 — OAuth 2.0 Protected Resource Metadata.
 *
 * MCP clients (Claude Desktop, Cursor, etc.) fetch this first to learn
 * which authorization server to use. We point them at the control plane.
 */
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  // Use the requesting host so the metadata works whether the client
  // hit mcp.vectorless.store or vectorless.store.
  const url = new URL(req.url);
  const resource = `${url.origin}/api/mcp`;

  return NextResponse.json({
    resource,
    authorization_servers: [controlPlaneUrl()],
    bearer_methods_supported: ["header"],
    resource_documentation: "https://docs.vectorless.store/mcp",
  });
}
