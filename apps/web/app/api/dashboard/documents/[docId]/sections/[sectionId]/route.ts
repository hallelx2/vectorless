import { NextRequest, NextResponse } from "next/server";

// TODO: When Fastify API is running, proxy to it with real auth

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string; sectionId: string }> }
) {
  const { docId, sectionId } = await params;

  // Mock section data until Fastify API is ready
  return NextResponse.json({
    doc_id: docId,
    section_id: sectionId,
    order: 5,
    title: "Pharmacological Treatment: First-Line Agents",
    summary:
      "Comprehensive review of first-line antihypertensive drug classes including ACE inhibitors, ARBs, calcium channel blockers, and thiazide diuretics. Provides dosing recommendations, contraindications, common side effects, and evidence from major clinical trials.",
    page_range: "29-42",
    token_count: 4512,
    content:
      "5. Pharmacological Treatment: First-Line Agents\n\n5.1 Overview\n\nWhen lifestyle modifications alone are insufficient to achieve target blood pressure levels, pharmacological therapy should be initiated. The selection of initial antihypertensive therapy should be individualized based on patient characteristics, comorbidities, potential adverse effects, drug interactions, and cost considerations.\n\nFour major classes of antihypertensive agents are recommended as first-line therapy:\n- Angiotensin-Converting Enzyme (ACE) Inhibitors\n- Angiotensin II Receptor Blockers (ARBs)\n- Calcium Channel Blockers (CCBs)\n- Thiazide/Thiazide-type Diuretics\n\n5.2 ACE Inhibitors\n\nMechanism: ACE inhibitors block the conversion of angiotensin I to angiotensin II, reducing vasoconstriction and aldosterone secretion.\n\nRecommended Agents and Dosing:\n- Lisinopril: 10-40 mg once daily\n- Enalapril: 5-40 mg daily (in 1-2 divided doses)\n- Ramipril: 2.5-20 mg daily (in 1-2 divided doses)\n\nKey Evidence: The HOPE trial demonstrated that ramipril reduced cardiovascular events by 22% in high-risk patients.\n\nContraindications: Pregnancy, history of angioedema, bilateral renal artery stenosis.",
    metadata: {
      doc_title: "Clinical Guidelines for Hypertension",
      source_type: "pdf",
    },
  });
}
