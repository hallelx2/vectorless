import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const getApiConfig = () => ({
  url: process.env.VECTORLESS_API_URL || "https://api.vectorless.store",
  key: process.env.VECTORLESS_INTERNAL_API_KEY || "",
});

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url: apiUrl, key: apiKey } = getApiConfig();
  if (!apiKey) {
    return NextResponse.json({ documents: [], next_cursor: null, has_more: false });
  }

  try {
    const url = new URL(request.url);
    const res = await fetch(`${apiUrl}/v1/documents?${url.searchParams}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Vectorless API error: ${res.status} ${res.statusText}`);
      return NextResponse.json({ documents: [], next_cursor: null, has_more: false });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch documents from Vectorless API:", err);
    return NextResponse.json({ documents: [], next_cursor: null, has_more: false });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url: apiUrl, key: apiKey } = getApiConfig();
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    let res: Response;

    if (contentType.includes("multipart/form-data")) {
      // File upload — forward the form data as-is
      const formData = await request.formData();
      res = await fetch(`${apiUrl}/v1/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });
    } else {
      // JSON body (e.g. URL-based ingestion)
      const body = await request.json();
      res = await fetch(`${apiUrl}/v1/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errBody?.error || `Upload failed: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to upload document to Vectorless API:", err);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
