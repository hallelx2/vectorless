import { NextResponse } from "next/server";

import { controlPlaneUrl } from "@/lib/control-plane";

/**
 * RFC 8414 — OAuth 2.0 Authorization Server Metadata.
 *
 * The authorization server lives on the control plane; this endpoint
 * just redirects MCP clients there. (Some MCP clients fetch this
 * directly off the resource origin instead of following the
 * authorization_servers pointer in /oauth-protected-resource.)
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.redirect(
    `${controlPlaneUrl()}/.well-known/oauth-authorization-server`,
    { status: 302 },
  );
}
