import { NextResponse } from "next/server";
import { forwardToCP, getPrimaryOrgId } from "@/lib/cp-proxy";

// GET /api/dashboard/stores — list the org's stores.
export async function GET() {
  const orgId = await getPrimaryOrgId();
  if (!orgId) return NextResponse.json([]);
  const { ok, status, data } = await forwardToCP(
    `/admin/v1/orgs/${orgId}/stores`,
    { orgId },
  );
  if (!ok) {
    if (status === 404 || status === 400) return NextResponse.json([]);
    return NextResponse.json(data ?? { error: "Upstream error" }, { status });
  }
  return NextResponse.json(data);
}

// POST /api/dashboard/stores — create a store ({name, slug, description, profile}).
export async function POST(request: Request) {
  const orgId = await getPrimaryOrgId();
  if (!orgId) {
    return NextResponse.json(
      { error: "No org found on your account." },
      { status: 400 },
    );
  }
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    /* empty body */
  }
  const { ok, status, data } = await forwardToCP(
    `/admin/v1/orgs/${orgId}/stores`,
    { method: "POST", body, orgId },
  );
  return NextResponse.json(data ?? {}, { status: ok ? 201 : status });
}
