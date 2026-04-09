import { NextRequest, NextResponse } from "next/server";

// TODO: When Fastify API is running, proxy to it with real auth

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  // Mock ToC manifest data until Fastify API is ready
  return NextResponse.json({
    doc_id: docId,
    title: "Clinical Guidelines for Hypertension",
    toc_strategy: "hybrid",
    section_count: 10,
    sections: [
      {
        section_id: "sec_01",
        order: 1,
        title: "Introduction and Scope",
        summary: "Defines the scope and objectives of the clinical guidelines for hypertension management.",
        page_range: "1-4",
        token_count: 1842,
      },
      {
        section_id: "sec_02",
        order: 2,
        title: "Definition and Classification of Hypertension",
        summary: "Diagnostic criteria and classification stages based on blood pressure readings.",
        page_range: "5-11",
        token_count: 2356,
      },
      {
        section_id: "sec_03",
        order: 3,
        title: "Risk Assessment and Cardiovascular Risk Factors",
        summary: "Comprehensive risk assessment framework including modifiable and non-modifiable risk factors.",
        page_range: "12-19",
        token_count: 3104,
      },
      {
        section_id: "sec_04",
        order: 4,
        title: "Non-Pharmacological Interventions",
        summary: "Lifestyle modifications as first-line interventions for blood pressure management.",
        page_range: "20-28",
        token_count: 2890,
      },
      {
        section_id: "sec_05",
        order: 5,
        title: "Pharmacological Treatment: First-Line Agents",
        summary: "Comprehensive review of first-line antihypertensive drug classes.",
        page_range: "29-42",
        token_count: 4512,
      },
      {
        section_id: "sec_06",
        order: 6,
        title: "Combination Therapy and Resistant Hypertension",
        summary: "Rationale and evidence for combination therapy and management of resistant hypertension.",
        page_range: "43-52",
        token_count: 3248,
      },
      {
        section_id: "sec_07",
        order: 7,
        title: "Special Populations",
        summary: "Tailored treatment recommendations for elderly, pregnant, diabetic, and CKD patients.",
        page_range: "53-64",
        token_count: 3876,
      },
      {
        section_id: "sec_08",
        order: 8,
        title: "Blood Pressure Monitoring and Follow-Up",
        summary: "Monitoring strategies including ABPM and HBPM with follow-up interval recommendations.",
        page_range: "65-72",
        token_count: 2634,
      },
      {
        section_id: "sec_09",
        order: 9,
        title: "Hypertensive Emergencies and Urgencies",
        summary: "Acute management protocols for hypertensive emergencies and urgencies.",
        page_range: "73-80",
        token_count: 2198,
      },
      {
        section_id: "sec_10",
        order: 10,
        title: "Quality Metrics and Implementation",
        summary: "Quality performance measures and guideline implementation strategies.",
        page_range: "81-86",
        token_count: 1956,
      },
    ],
  });
}
