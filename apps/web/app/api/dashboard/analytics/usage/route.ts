import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const getApiConfig = () => ({
  url: process.env.VECTORLESS_API_URL || "https://api.vectorless.store",
  key: process.env.VECTORLESS_INTERNAL_API_KEY || "",
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";
  const { url: apiUrl, key: apiKey } = getApiConfig();

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${apiUrl}/v1/analytics/usage?range=${range}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.error(`Vectorless analytics API error: ${res.status}`);
      return NextResponse.json(
        { error: `Failed to fetch usage data: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Failed to fetch analytics from Vectorless API:", err);
    return NextResponse.json(
      { error: "Failed to fetch usage analytics" },
      { status: 500 }
    );
  }
}
