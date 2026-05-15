import { NextRequest, NextResponse } from "next/server";
import { forwardToCP } from "@/lib/cp-proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const { ok, status, data } = await forwardToCP(
    `/v1/analytics/usage?range=${encodeURIComponent(range)}`,
  );
  if (!ok) {
    return NextResponse.json(data ?? { error: "Upstream error" }, { status });
  }
  return NextResponse.json(data);
}
