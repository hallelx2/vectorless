import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const getApiConfig = () => ({
  url: process.env.VECTORLESS_API_URL || "https://api.vectorless.store",
  key: process.env.VECTORLESS_INTERNAL_API_KEY || "",
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docId } = await params;
  const { url: apiUrl, key: apiKey } = getApiConfig();

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${apiUrl}/v1/documents/${docId}/toc`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody?.error || `ToC not found: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch ToC from Vectorless API:", err);
    return NextResponse.json(
      { error: "Failed to fetch table of contents" },
      { status: 500 }
    );
  }
}
