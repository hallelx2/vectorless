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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Trash2,
  Layers,
  Calendar,
  Hash,
  FileType,
  GitBranch,
} from "lucide-react";

// Mock data - will be replaced with real API call
const mockDocument = {
  id: "doc_1",
  title: "Q4 2025 Annual Report",
  source_type: "PDF",
  toc_strategy: "hybrid",
  status: "ready" as const,
  created_at: "2026-04-06T14:30:00Z",
  section_count: 42,
  sections: [
    {
      id: "sec_1",
      title: "Executive Summary",
      summary: "High-level overview of Q4 performance and key achievements.",
      page_range: "1-3",
    },
    {
      id: "sec_2",
      title: "Financial Highlights",
      summary:
        "Revenue, net income, and operating margins for the quarter.",
      page_range: "4-12",
    },
    {
      id: "sec_3",
      title: "Product & Engineering",
      summary:
        "Major product launches, platform improvements, and engineering milestones.",
      page_range: "13-21",
    },
    {
      id: "sec_4",
      title: "Go-to-Market & Growth",
      summary:
        "Customer acquisition metrics, marketing campaigns, and partnerships.",
      page_range: "22-30",
    },
    {
      id: "sec_5",
      title: "People & Culture",
      summary: "Headcount growth, diversity metrics, and team highlights.",
      page_range: "31-36",
    },
    {
      id: "sec_6",
      title: "Outlook & Strategy",
      summary: "Forward-looking guidance and strategic priorities for 2026.",
      page_range: "37-42",
    },
  ],
};

const statusColors: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processing: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  const doc = mockDocument; // Will be fetched by docId

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/documents">
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {doc.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {doc.source_type}
            </Badge>
            <Badge variant="outline" className={statusColors[doc.status]}>
              {doc.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/documents/${docId}/sections`}>
              <Layers className="h-4 w-4" />
              Explore Sections
            </Link>
          </Button>
          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ToC Manifest */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Table of Contents</CardTitle>
              <CardDescription>
                {doc.sections.length} sections extracted from this document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {doc.sections.map((section, index) => (
                <Link
                  key={section.id}
                  href={`/dashboard/documents/${docId}/sections/${section.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                          {index + 1}
                        </span>
                        <h3 className="text-sm font-medium text-foreground">
                          {section.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground pl-8">
                        {section.summary}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs font-mono"
                    >
                      pp. {section.page_range}
                    </Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Metadata panel */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Document ID</p>
                <p className="text-sm font-mono text-foreground">{docId}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <FileType className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Source Type</p>
                <p className="text-sm text-foreground">{doc.source_type}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">ToC Strategy</p>
                <p className="text-sm capitalize text-foreground">
                  {doc.toc_strategy}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm text-foreground">
                  {new Date(doc.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Section Count</p>
                <p className="text-sm text-foreground">{doc.section_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
