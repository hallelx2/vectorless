import { NextResponse } from "next/server";
import { forwardToCP, getPrimaryOrgId } from "@/lib/cp-proxy";

// DELETE /api/dashboard/stores/{storeId} — delete a store (not the default).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId } = await params;
  const orgId = await getPrimaryOrgId();
  if (!orgId) {
    return NextResponse.json(
      { error: "No org found on your account." },
      { status: 400 },
    );
  }
  const { ok, status, data } = await forwardToCP(
    `/admin/v1/orgs/${orgId}/stores/${storeId}`,
    { method: "DELETE", orgId },
  );
  return NextResponse.json(data ?? {}, { status: ok ? 200 : status });
}
