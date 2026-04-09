import { NextRequest, NextResponse } from "next/server";

// TODO: When Fastify API is running, proxy to it with real auth

interface PlaygroundRequest {
  query: string;
  doc_id?: string;
  strategy: "extract" | "generate" | "hybrid";
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PlaygroundRequest;
  const { query, doc_id, strategy } = body;

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: { message: "Query is required" } },
      { status: 400 }
    );
  }

  // TODO: Proxy to Fastify API
  // const session = await auth.api.getSession({ headers: await headers() });
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  // Mock playground response
  return NextResponse.json({
    query,
    doc_id: doc_id || null,
    strategy,
    timing: {
      total_ms: 342,
      toc_retrieval_ms: 28,
      section_selection_ms: 185,
      content_fetch_ms: 129,
    },
    reasoning:
      "Analyzed the query against the document's table of contents. Identified 3 sections with high relevance based on semantic similarity between the query and section summaries. The 'Pharmacological Treatment' section scored highest due to direct keyword and concept overlap. 'Non-Pharmacological Interventions' was included for comprehensive treatment context. 'Risk Assessment' provides foundational patient stratification information relevant to treatment decisions.",
    selected_sections: [
      {
        section_id: "sec_05",
        title: "Pharmacological Treatment: First-Line Agents",
        relevance_score: 0.94,
        page_range: "29-42",
        summary:
          "Comprehensive review of first-line antihypertensive drug classes including ACE inhibitors, ARBs, calcium channel blockers, and thiazide diuretics.",
        content_preview:
          "When lifestyle modifications alone are insufficient to achieve target blood pressure levels, pharmacological therapy should be initiated. Four major classes of antihypertensive agents are recommended as first-line therapy: ACE Inhibitors, ARBs, CCBs, and Thiazide Diuretics...",
      },
      {
        section_id: "sec_04",
        title: "Non-Pharmacological Interventions",
        relevance_score: 0.82,
        page_range: "20-28",
        summary:
          "Lifestyle modifications as first-line interventions for blood pressure management including DASH diet, sodium reduction, and physical activity.",
        content_preview:
          "Lifestyle modifications remain the cornerstone of hypertension prevention and management. The DASH diet has been shown to reduce systolic blood pressure by 8-14 mmHg. Sodium restriction to less than 2,300 mg/day provides an additional 2-8 mmHg reduction...",
      },
      {
        section_id: "sec_03",
        title: "Risk Assessment and Cardiovascular Risk Factors",
        relevance_score: 0.71,
        page_range: "12-19",
        summary:
          "Comprehensive risk assessment framework including the ASCVD risk calculator and patient risk stratification for guiding treatment intensity.",
        content_preview:
          "A comprehensive cardiovascular risk assessment should be performed for all patients with confirmed hypertension. The 10-year ASCVD risk score should guide the intensity of blood pressure lowering therapy...",
      },
    ],
  });
}
