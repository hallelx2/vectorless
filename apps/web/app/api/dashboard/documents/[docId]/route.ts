import { NextRequest, NextResponse } from "next/server";

// TODO: When Fastify API is running, proxy to it with real auth

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  // Mock data until Fastify API is ready
  return NextResponse.json({
    doc_id: docId,
    title: "Clinical Guidelines for Hypertension",
    source_type: "pdf",
    toc_strategy: "hybrid",
    status: "ready",
    section_count: 10,
    token_count: 28616,
    created_at: "2025-04-08T10:22:00Z",
    updated_at: "2025-04-08T10:24:30Z",
    metadata: {
      pages: 86,
      author: "National Heart, Lung, and Blood Institute",
      language: "en",
    },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  // TODO: Proxy DELETE to Fastify API
  // const session = await auth.api.getSession({ headers: await headers() });
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }
  // await fetch(`${process.env.VECTORLESS_API_URL}/documents/${docId}`, {
  //   method: "DELETE",
  //   headers: { Authorization: `Bearer ${apiKey}` },
  // });

  return NextResponse.json({
    success: true,
    doc_id: docId,
    message: `Document ${docId} deleted successfully.`,
  });
}
