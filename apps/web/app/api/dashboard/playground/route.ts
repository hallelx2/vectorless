import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const getApiConfig = () => ({
  url: process.env.VECTORLESS_API_URL || "https://api.vectorless.store",
  key: process.env.VECTORLESS_INTERNAL_API_KEY || "",
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { doc_id, query } = body;

  if (!doc_id || !query?.trim()) {
    return NextResponse.json(
      { error: { message: "doc_id and query are required" } },
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

  const authHeaders = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  try {
    const startTime = Date.now();

    // Step 1: Get the ToC manifest
    const tocRes = await fetch(`${apiUrl}/v1/documents/${doc_id}/toc`, {
      headers: authHeaders,
    });

    if (!tocRes.ok) {
      return NextResponse.json(
        { error: { message: `Failed to get ToC: ${tocRes.status}` } },
        { status: tocRes.status }
      );
    }

    const toc = await tocRes.json();
    const tocTime = Date.now() - startTime;

    // Step 2: Select sections based on query (simple keyword matching for now)
    // In production, this would be done by the user's LLM
    const queryLower = query.toLowerCase();
    const selectedSections = toc.sections.filter((s: any) => {
      const text = `${s.title} ${s.summary || ""}`.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter((w: string) => w.length > 2);
      return queryWords.some((word: string) => text.includes(word));
    });

    // If no keyword matches, return all sections
    const sectionIds =
      selectedSections.length > 0
        ? selectedSections.map((s: any) => s.section_id)
        : toc.sections.slice(0, 3).map((s: any) => s.section_id);

    const selectTime = Date.now() - startTime - tocTime;

    // Step 3: Fetch the selected sections
    const sectionsRes = await fetch(
      `${apiUrl}/v1/documents/${doc_id}/sections/batch`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ section_ids: sectionIds }),
      }
    );

    const sectionsData = sectionsRes.ok
      ? await sectionsRes.json()
      : { sections: [] };
    const fetchTime = Date.now() - startTime - tocTime - selectTime;

    return NextResponse.json({
      toc,
      selected_section_ids: sectionIds,
      sections: sectionsData.sections || [],
      reasoning: `Matched ${sectionIds.length} sections for query "${query}" using keyword matching. In production, your LLM would reason over the ToC manifest to select relevant sections.`,
      timing: {
        toc_ms: tocTime,
        select_ms: selectTime,
        fetch_ms: fetchTime,
        total_ms: Date.now() - startTime,
      },
    });
  } catch (err) {
    console.error("Playground query failed:", err);
    return NextResponse.json(
      { error: { message: "Failed to run query" } },
      { status: 500 }
    );
  }
}
