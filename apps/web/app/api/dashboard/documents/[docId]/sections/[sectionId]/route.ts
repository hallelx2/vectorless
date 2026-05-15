import { NextRequest, NextResponse } from "next/server";
import { forwardToCP } from "@/lib/cp-proxy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string; sectionId: string }> },
) {
  const { docId, sectionId } = await params;
  const { ok, status, data } = await forwardToCP(
    `/v1/documents/${docId}/sections/${sectionId}`,
  );
  if (!ok) {
    return NextResponse.json(data ?? { error: "Upstream error" }, { status });
  }
  return NextResponse.json(data);
}
