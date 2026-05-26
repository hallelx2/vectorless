import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPrimaryOrgId } from "@/lib/cp-proxy";

const CP_BASE =
  process.env.CONTROL_PLANE_URL ||
  process.env.VECTORLESS_API_URL ||
  "https://api.vectorless.store";

// GET /api/dashboard/documents/{docId}/llms-txt — the document's llms.txt
// map (Markdown). Proxies to the CP /v1/documents/{id}/llms.txt and returns
// the raw text (forwardToCP can't be used — it parses JSON).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const cookie = (await headers()).get("cookie") ?? "";
  if (!cookie) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const orgId = await getPrimaryOrgId();
  if (!orgId) {
    return new NextResponse("No org found on your account.", { status: 400 });
  }

  const h: Record<string, string> = { cookie, "X-Vectorless-Org": orgId };
  const m = cookie.match(/(?:^|;\s*)vls_store=([^;]+)/);
  if (m) h["X-Vectorless-Store"] = decodeURIComponent(m[1]);

  const res = await fetch(`${CP_BASE}/v1/documents/${docId}/llms.txt`, {
    headers: h,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
