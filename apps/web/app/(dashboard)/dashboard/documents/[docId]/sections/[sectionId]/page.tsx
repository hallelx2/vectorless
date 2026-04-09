"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Copy, Check, Hash, Layers, FileText } from "lucide-react";
import { use } from "react";

const mockSection = {
  id: "sec_05",
  order: 5,
  title: "Pharmacological Treatment: First-Line Agents",
  pageRange: "29-42",
  tokenCount: 4512,
  summary:
    "Comprehensive review of first-line antihypertensive drug classes including ACE inhibitors, ARBs, calcium channel blockers, and thiazide diuretics. Provides dosing recommendations, contraindications, common side effects, and evidence from major clinical trials supporting their use. Includes decision algorithms for initial drug selection based on patient characteristics.",
  content: `5. Pharmacological Treatment: First-Line Agents

5.1 Overview

When lifestyle modifications alone are insufficient to achieve target blood pressure levels, pharmacological therapy should be initiated. The selection of initial antihypertensive therapy should be individualized based on patient characteristics, comorbidities, potential adverse effects, drug interactions, and cost considerations.

Four major classes of antihypertensive agents are recommended as first-line therapy:
- Angiotensin-Converting Enzyme (ACE) Inhibitors
- Angiotensin II Receptor Blockers (ARBs)
- Calcium Channel Blockers (CCBs)
- Thiazide/Thiazide-type Diuretics

5.2 ACE Inhibitors

Mechanism: ACE inhibitors block the conversion of angiotensin I to angiotensin II, reducing vasoconstriction and aldosterone secretion. They also inhibit the degradation of bradykinin, contributing to vasodilation.

Recommended Agents and Dosing:
- Lisinopril: 10-40 mg once daily
- Enalapril: 5-40 mg daily (in 1-2 divided doses)
- Ramipril: 2.5-20 mg daily (in 1-2 divided doses)
- Perindopril: 4-16 mg once daily

Key Evidence: The HOPE trial demonstrated that ramipril reduced cardiovascular events by 22% in high-risk patients. The EUROPA trial showed perindopril reduced cardiovascular mortality by 14% in patients with stable coronary artery disease.

Contraindications: Pregnancy, history of angioedema, bilateral renal artery stenosis, hyperkalemia (>5.5 mEq/L).

Common Side Effects: Dry cough (5-20% of patients), hyperkalemia, acute kidney injury (especially with volume depletion), angioedema (rare but serious).

5.3 Angiotensin II Receptor Blockers (ARBs)

Mechanism: ARBs selectively block the AT1 receptor, preventing angiotensin II-mediated vasoconstriction and aldosterone release. Unlike ACE inhibitors, they do not affect bradykinin metabolism and have a lower incidence of cough.

Recommended Agents and Dosing:
- Losartan: 50-100 mg once daily
- Valsartan: 80-320 mg once daily
- Irbesartan: 150-300 mg once daily
- Olmesartan: 20-40 mg once daily
- Telmisartan: 20-80 mg once daily

Key Evidence: The LIFE trial demonstrated that losartan was superior to atenolol in reducing cardiovascular morbidity and mortality in hypertensive patients with left ventricular hypertrophy. The VALUE trial showed valsartan was comparable to amlodipine in cardiovascular outcomes.

Contraindications: Pregnancy, bilateral renal artery stenosis, hyperkalemia.

Common Side Effects: Dizziness, hyperkalemia, acute kidney injury (rare).

5.4 Calcium Channel Blockers (CCBs)

Mechanism: CCBs inhibit calcium entry through L-type calcium channels in vascular smooth muscle and cardiac myocytes. Dihydropyridine CCBs (e.g., amlodipine) primarily affect vascular smooth muscle, while non-dihydropyridine CCBs (e.g., diltiazem, verapamil) also affect cardiac conduction.

Recommended Agents and Dosing:
- Amlodipine: 2.5-10 mg once daily (dihydropyridine)
- Nifedipine XL: 30-90 mg once daily (dihydropyridine)
- Diltiazem ER: 180-360 mg once daily (non-dihydropyridine)
- Verapamil SR: 180-480 mg daily in 1-2 doses (non-dihydropyridine)

Key Evidence: The ALLHAT trial demonstrated that amlodipine was comparable to chlorthalidone for primary cardiovascular outcomes. The ASCOT trial showed superior cardiovascular outcomes with amlodipine-based regimens compared to atenolol-based regimens.

Contraindications: Non-dihydropyridine CCBs are contraindicated in patients with heart failure with reduced ejection fraction, second- or third-degree heart block, and severe bradycardia.

Common Side Effects: Peripheral edema (dihydropyridines), constipation (verapamil), bradycardia (non-dihydropyridines), gingival hyperplasia.

5.5 Thiazide and Thiazide-Type Diuretics

Mechanism: Thiazide diuretics inhibit sodium reabsorption in the distal convoluted tubule, promoting natriuresis and reducing blood volume. Long-term, their antihypertensive effect is primarily attributed to reduced peripheral vascular resistance.

Recommended Agents and Dosing:
- Chlorthalidone: 12.5-25 mg once daily (preferred)
- Hydrochlorothiazide: 12.5-50 mg once daily
- Indapamide: 1.25-2.5 mg once daily

Key Evidence: The ALLHAT trial established chlorthalidone as a reference standard for antihypertensive therapy. Chlorthalidone is generally preferred over hydrochlorothiazide based on longer duration of action and stronger evidence for cardiovascular risk reduction.

Contraindications: Severe hyponatremia, symptomatic hyperuricemia/gout (relative), severe renal impairment (eGFR <30 mL/min).

Common Side Effects: Hypokalemia, hyponatremia, hyperuricemia, hyperglycemia, dyslipidemia.

5.6 Initial Drug Selection Algorithm

The selection of the initial antihypertensive agent should be guided by the following considerations:

1. Compelling indications: Certain comorbidities may favor specific drug classes (see Section 7: Special Populations).
2. Age and race: ACE inhibitors and ARBs may be less effective as monotherapy in Black patients; CCBs or thiazide diuretics may be preferred as initial therapy.
3. Cost and adherence: Once-daily dosing is preferred to improve adherence.
4. Prior tolerability: Patient history of drug intolerance should guide selection.

For most patients without compelling indications, any of the four first-line classes may be initiated. If blood pressure remains above target after 1 month at optimal dose, combination therapy should be considered (see Section 6).`,
};

export default function SectionDetailPage({
  params,
}: {
  params: Promise<{ docId: string; sectionId: string }>;
}) {
  const { docId, sectionId } = use(params);
  const [copied, setCopied] = useState(false);

  const section = mockSection;

  async function handleCopy() {
    await navigator.clipboard.writeText(section.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/documents/${docId}/sections`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Sections
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-3">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {section.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Hash className="mr-1 h-3 w-3" />
            Order: {section.order}
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs">
            <FileText className="mr-1 h-3 w-3" />
            pp. {section.pageRange}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Layers className="mr-1 h-3 w-3" />
            {section.tokenCount.toLocaleString()} tokens
          </Badge>
        </div>
      </div>

      {/* Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">
            {section.summary}
          </p>
        </CardContent>
      </Card>

      {/* Full Content */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Full Content</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy Content
              </>
            )}
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {section.content}
              </pre>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
