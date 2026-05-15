import { NextRequest, NextResponse } from "next/server";
import { forwardToCP } from "@/lib/cp-proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { doc_id, query } = body;

  if (!doc_id || !query?.trim()) {
    return NextResponse.json(
      { error: { message: "doc_id and query are required" } },
      { status: 400 },
    );
  }

  try {
    const startTime = Date.now();

    // Step 1: Get the ToC manifest
    const tocResp = await forwardToCP(`/v1/documents/${doc_id}/toc`);
    if (!tocResp.ok) {
      return NextResponse.json(
        {
          error: {
            message: `Failed to get ToC: ${tocResp.status}`,
            detail: tocResp.data,
          },
        },
        { status: tocResp.status },
      );
    }
    const toc = tocResp.data as {
      sections: Array<{ section_id: string; title: string; summary?: string }>;
    };
    const tocTime = Date.now() - startTime;

    // Step 2: Select sections based on query (simple keyword match)
    const queryLower = query.toLowerCase();
    const selectedSections = toc.sections.filter((s) => {
      const text = `${s.title} ${s.summary || ""}`.toLowerCase();
      const queryWords = queryLower
        .split(/\s+/)
        .filter((w: string) => w.length > 2);
      return queryWords.some((word: string) => text.includes(word));
    });

    const sectionIds =
      selectedSections.length > 0
        ? selectedSections.map((s) => s.section_id)
        : toc.sections.slice(0, 3).map((s) => s.section_id);

    const selectTime = Date.now() - startTime - tocTime;

    // Step 3: Fetch the selected sections
    const sectionsResp = await forwardToCP(
      `/v1/documents/${doc_id}/sections/batch`,
      { method: "POST", body: { section_ids: sectionIds } },
    );

    const sectionsData = sectionsResp.ok
      ? (sectionsResp.data as { sections?: unknown[] })
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
      { status: 500 },
    );
  }
}
