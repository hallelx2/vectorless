"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Hash,
  FileText,
  Layers,
} from "lucide-react";
import { use } from "react";

interface Section {
  section_id: string;
  order: number;
  title: string;
  summary: string;
  page_range: string;
  token_count: number;
}

interface TocData {
  doc_id: string;
  title: string;
  toc_strategy: string;
  section_count: number;
  sections: Section[];
}

export default function SectionsPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [toc, setToc] = useState<TocData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToc() {
      try {
        const res = await fetch(`/api/dashboard/documents/${docId}/toc`);
        if (!res.ok) {
          setError("Failed to load sections");
          return;
        }
        const data = await res.json();
        setToc(data);
      } catch {
        setError("Failed to load sections");
      } finally {
        setIsLoading(false);
      }
    }
    fetchToc();
  }, [docId]);

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

  const sections = toc?.sections || [];
  const docTitle = toc?.title || "Document";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[150px]" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-5 w-[250px]" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/documents/${docId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Document
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-lg font-medium text-foreground">{error}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The sections could not be loaded. The document may still be processing.
          </p>
        </div>
      </div>
    );
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
            {sections.length} sections in {docTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            <Hash className="mr-1 h-3 w-3" />
            {docId}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Layers className="mr-1 h-3 w-3" />
            {sections.length} sections
          </Badge>
        </div>
      </div>

      {/* Section list */}
      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Layers className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-medium text-foreground">
            No sections available
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This document may still be processing.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section) => {
            const isExpanded = expandedIds.has(section.section_id);
            const summaryPreview =
              section.summary && section.summary.length > 120
                ? section.summary.slice(0, 120) + "..."
                : section.summary;

            return (
              <Card key={section.section_id}>
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleExpanded(section.section_id)}
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

                      {!isExpanded && summaryPreview && (
                        <p className="mt-1 pl-6 text-sm text-muted-foreground">
                          {summaryPreview}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {section.page_range && (
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          pp. {section.page_range}
                        </Badge>
                      )}
                      {section.token_count != null && (
                        <Badge variant="outline" className="text-xs">
                          {section.token_count.toLocaleString()} tokens
                        </Badge>
                      )}
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
                            href={`/dashboard/documents/${docId}/sections/${section.section_id}`}
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
      )}
    </div>
  );
}
