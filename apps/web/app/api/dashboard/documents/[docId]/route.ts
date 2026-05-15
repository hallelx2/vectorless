import { NextRequest, NextResponse } from "next/server";
import { forwardToCP } from "@/lib/cp-proxy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const { ok, status, data } = await forwardToCP(`/v1/documents/${docId}`);
  if (!ok) {
    return NextResponse.json(data ?? { error: "Upstream error" }, { status });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const { ok, status, data } = await forwardToCP(`/v1/documents/${docId}`, {
    method: "DELETE",
  });
  if (!ok) {
    return NextResponse.json(data ?? { error: "Upstream error" }, { status });
  }
  return NextResponse.json(data ?? { success: true });
}
