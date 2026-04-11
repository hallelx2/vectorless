"use client";

import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Copy, Check, Hash, Layers, FileText } from "lucide-react";
import { use } from "react";

interface SectionDetail {
  doc_id: string;
  section_id: string;
  order: number;
  title: string;
  summary: string;
  page_range: string;
  token_count: number;
  content: string;
  metadata?: {
    doc_title?: string;
    source_type?: string;
  };
}

export default function SectionDetailPage({
  params,
}: {
  params: Promise<{ docId: string; sectionId: string }>;
}) {
  const { docId, sectionId } = use(params);
  const [copied, setCopied] = useState(false);
  const [section, setSection] = useState<SectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSection() {
      try {
        const res = await fetch(
          `/api/dashboard/documents/${docId}/sections/${sectionId}`
        );
        if (!res.ok) {
          setError("Section not found");
          return;
        }
        const data = await res.json();
        setSection(data);
      } catch {
        setError("Failed to load section");
      } finally {
        setIsLoading(false);
      }
    }
    fetchSection();
  }, [docId, sectionId]);

  async function handleCopy() {
    if (!section) return;
    await navigator.clipboard.writeText(section.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[150px]" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[350px]" />
          <Skeleton className="h-5 w-[200px]" />
        </div>
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/documents/${docId}/sections`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Sections
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-lg font-medium text-foreground">
            {error || "Section not found"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The section could not be loaded.
          </p>
        </div>
      </div>
    );
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
          {section.page_range && (
            <Badge variant="secondary" className="font-mono text-xs">
              <FileText className="mr-1 h-3 w-3" />
              pp. {section.page_range}
            </Badge>
          )}
          {section.token_count != null && (
            <Badge variant="outline" className="text-xs">
              <Layers className="mr-1 h-3 w-3" />
              {section.token_count.toLocaleString()} tokens
            </Badge>
          )}
        </div>
      </div>

      {/* Summary */}
      {section.summary && (
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
      )}

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
