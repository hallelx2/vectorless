import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const getApiConfig = () => ({
  url: process.env.VECTORLESS_API_URL || "https://api.vectorless.store",
  key: process.env.VECTORLESS_INTERNAL_API_KEY || "",
});

interface PlaygroundRequest {
  query: string;
  doc_id?: string;
  strategy: "extract" | "generate" | "hybrid";
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PlaygroundRequest;
  const { query, doc_id, strategy } = body;

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: { message: "Query is required" } },
      { status: 400 }
    );
  }

  const { url: apiUrl, key: apiKey } = getApiConfig();

  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "API key not configured" } },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${apiUrl}/v1/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        doc_id: doc_id || undefined,
        strategy,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: { message: errBody?.error || `Query failed: ${res.status}` } },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to run playground query on Vectorless API:", err);
    return NextResponse.json(
      { error: { message: "Failed to run query" } },
      { status: 500 }
    );
  }
}
