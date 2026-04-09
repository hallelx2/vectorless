"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Hash,
  FileText,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { use } from "react";

interface Section {
  id: string;
  order: number;
  title: string;
  summary: string;
  pageRange: string;
  tokenCount: number;
}

const mockSections: Section[] = [
  {
    id: "sec_01",
    order: 1,
    title: "Introduction and Scope",
    summary:
      "This section defines the scope and objectives of the clinical guidelines for the management of hypertension in adult patients. It outlines the target population, the clinical settings in which the guidelines apply, and the methodology used for evidence grading. The guidelines are intended for primary care physicians, cardiologists, and allied health professionals involved in cardiovascular care.",
    pageRange: "1-4",
    tokenCount: 1842,
  },
  {
    id: "sec_02",
    order: 2,
    title: "Definition and Classification of Hypertension",
    summary:
      "Covers the diagnostic criteria and classification stages of hypertension based on systolic and diastolic blood pressure readings. Includes tables for normal, elevated, Stage 1, Stage 2, and hypertensive crisis thresholds according to the latest ACC/AHA guidelines. Discusses white-coat hypertension and masked hypertension as special categories.",
    pageRange: "5-11",
    tokenCount: 2356,
  },
  {
    id: "sec_03",
    order: 3,
    title: "Risk Assessment and Cardiovascular Risk Factors",
    summary:
      "Details the comprehensive risk assessment framework including modifiable and non-modifiable risk factors. Covers the ASCVD risk calculator, the role of comorbidities such as diabetes, chronic kidney disease, and obesity. Provides a structured approach to patient risk stratification for guiding treatment intensity.",
    pageRange: "12-19",
    tokenCount: 3104,
  },
  {
    id: "sec_04",
    order: 4,
    title: "Non-Pharmacological Interventions",
    summary:
      "Reviews lifestyle modifications as first-line interventions for blood pressure management. Includes evidence-based recommendations for dietary changes (DASH diet, sodium reduction), physical activity guidelines, weight management, alcohol moderation, and stress reduction techniques. Discusses the expected blood pressure reductions achievable through each intervention.",
    pageRange: "20-28",
    tokenCount: 2890,
  },
  {
    id: "sec_05",
    order: 5,
    title: "Pharmacological Treatment: First-Line Agents",
    summary:
      "Comprehensive review of first-line antihypertensive drug classes including ACE inhibitors, ARBs, calcium channel blockers, and thiazide diuretics. Provides dosing recommendations, contraindications, common side effects, and evidence from major clinical trials supporting their use. Includes decision algorithms for initial drug selection based on patient characteristics.",
    pageRange: "29-42",
    tokenCount: 4512,
  },
  {
    id: "sec_06",
    order: 6,
    title: "Combination Therapy and Resistant Hypertension",
    summary:
      "Addresses the rationale and evidence for combination antihypertensive therapy, preferred drug combinations, and the management of resistant hypertension. Defines true resistant hypertension versus pseudo-resistance and outlines a stepwise approach including mineralocorticoid receptor antagonists and device-based therapies.",
    pageRange: "43-52",
    tokenCount: 3248,
  },
  {
    id: "sec_07",
    order: 7,
    title: "Special Populations",
    summary:
      "Provides tailored treatment recommendations for special populations including elderly patients, pregnant women, patients with diabetes, chronic kidney disease, heart failure, and post-stroke patients. Discusses racial and ethnic considerations in drug selection and response. Includes pediatric hypertension screening recommendations.",
    pageRange: "53-64",
    tokenCount: 3876,
  },
  {
    id: "sec_08",
    order: 8,
    title: "Blood Pressure Monitoring and Follow-Up",
    summary:
      "Covers recommended monitoring strategies including office-based measurement, ambulatory blood pressure monitoring (ABPM), and home blood pressure monitoring (HBPM). Discusses appropriate follow-up intervals, target BP thresholds, and criteria for treatment adjustment. Includes patient education recommendations for self-monitoring.",
    pageRange: "65-72",
    tokenCount: 2634,
  },
  {
    id: "sec_09",
    order: 9,
    title: "Hypertensive Emergencies and Urgencies",
    summary:
      "Differentiates between hypertensive emergencies and urgencies, providing acute management protocols for each. Covers target organ damage assessment, IV antihypertensive agents and dosing, recommended rate of blood pressure reduction, and disposition criteria. Includes specific management for common presentations such as acute aortic dissection and eclampsia.",
    pageRange: "73-80",
    tokenCount: 2198,
  },
  {
    id: "sec_10",
    order: 10,
    title: "Quality Metrics and Implementation",
    summary:
      "Outlines quality performance measures for hypertension management, including recommended documentation standards, reporting metrics, and clinical audit criteria. Discusses strategies for guideline implementation at the practice and health system level, addressing barriers to adherence and the role of clinical decision support tools.",
    pageRange: "81-86",
    tokenCount: 1956,
  },
];

export default function SectionsPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(sectionId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/documents/${docId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Document
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mockSections.length} sections in Clinical Guidelines for
            Hypertension
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            <Hash className="mr-1 h-3 w-3" />
            {docId}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Layers className="mr-1 h-3 w-3" />
            {mockSections.length} sections
          </Badge>
        </div>
      </div>

      {/* Section list */}
      <div className="space-y-3">
        {mockSections.map((section) => {
          const isExpanded = expandedIds.has(section.id);
          const summaryPreview =
            section.summary.length > 120
              ? section.summary.slice(0, 120) + "..."
              : section.summary;

          return (
            <Card key={section.id}>
              <CardContent className="p-0">
                <button
                  onClick={() => toggleExpanded(section.id)}
                  className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {section.order}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <h3 className="text-sm font-medium text-foreground">
                        {section.title}
                      </h3>
                    </div>

                    {!isExpanded && (
                      <p className="mt-1 pl-6 text-sm text-muted-foreground">
                        {summaryPreview}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs"
                    >
                      pp. {section.pageRange}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {section.tokenCount.toLocaleString()} tokens
                    </Badge>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t px-5 pb-5 pt-4">
                    <div className="pl-9 space-y-4">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {section.summary}
                      </p>
                      <Button size="sm" asChild>
                        <Link
                          href={`/dashboard/documents/${docId}/sections/${section.id}`}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Full Content
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
