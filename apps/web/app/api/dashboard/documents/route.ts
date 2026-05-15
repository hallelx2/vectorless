import { NextResponse } from "next/server";
import { forwardToCP } from "@/lib/cp-proxy";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const qs = url.searchParams.toString();
  const path = qs ? `/v1/documents?${qs}` : "/v1/documents";
  const { ok, status, data } = await forwardToCP(path);
  if (!ok) {
    // The list endpoint historically returned an empty list rather
    // than a hard error so the UI can render a "no docs yet" state.
    if (status === 404 || status === 400) {
      return NextResponse.json({
        documents: [],
        next_cursor: null,
        has_more: false,
      });
    }
    return NextResponse.json(data ?? { error: "Upstream error" }, { status });
  }
  return NextResponse.json(data);
}

// Note: POST is intentionally NOT proxied here.
// The upload page bypasses Vercel and posts directly to the CP at
// api.vectorless.store/v1/documents because Vercel's serverless
// functions cap request bodies at 4.5 MB.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Document uploads must POST directly to api.vectorless.store/v1/documents — Vercel's body-size cap is too small for documents.",
    },
    { status: 410 },
  );
}
