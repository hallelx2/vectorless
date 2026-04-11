"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Trash2,
  Layers,
  Calendar,
  Hash,
  FileType,
  GitBranch,
  Loader2,
} from "lucide-react";

interface DocumentDetail {
  doc_id: string;
  title: string;
  source_type: string;
  toc_strategy: string;
  status: string;
  section_count: number;
  token_count?: number;
  created_at: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

interface TocSection {
  section_id: string;
  order: number;
  title: string;
  summary: string;
  page_range: string;
  token_count?: number;
}

interface TocData {
  doc_id: string;
  title: string;
  toc_strategy: string;
  section_count: number;
  sections: TocSection[];
}

const statusColors: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processing: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

export default function DocumentDetailPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);
  const router = useRouter();

  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [toc, setToc] = useState<TocData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [docRes, tocRes] = await Promise.all([
          fetch(`/api/dashboard/documents/${docId}`),
          fetch(`/api/dashboard/documents/${docId}/toc`),
        ]);

        if (!docRes.ok) {
          setError("Document not found");
          return;
        }

        const docData = await docRes.json();
        setDoc(docData);

        if (tocRes.ok) {
          const tocData = await tocRes.json();
          setToc(tocData);
        }
      } catch {
        setError("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [docId]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/dashboard/documents/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/dashboard/documents");
      }
    } catch {
      setIsDeleting(false);
    }
  }, [docId, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[150px]" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-5 w-[200px]" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/documents">
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-lg font-medium text-foreground">
            {error || "Document not found"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The document may have been deleted or does not exist.
          </p>
        </div>
      </div>
    );
  }

  const sections = toc?.sections || [];

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
            <Badge variant="secondary" className="font-mono text-xs uppercase">
              {doc.source_type}
            </Badge>
            <Badge variant="outline" className={statusColors[doc.status] || ""}>
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
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
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
                {sections.length > 0
                  ? `${sections.length} sections extracted from this document`
                  : "No sections available yet"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sections.length === 0 && doc.status === "processing" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Document is still being processed...
                </div>
              )}
              {sections.map((section, index) => (
                <Link
                  key={section.section_id}
                  href={`/dashboard/documents/${docId}/sections/${section.section_id}`}
                  className="block rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
                          {section.order ?? index + 1}
                        </span>
                        <h3 className="text-sm font-medium text-foreground">
                          {section.title}
                        </h3>
                      </div>
                      {section.summary && (
                        <p className="text-sm text-muted-foreground pl-8">
                          {section.summary}
                        </p>
                      )}
                    </div>
                    {section.page_range && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs font-mono"
                      >
                        pp. {section.page_range}
                      </Badge>
                    )}
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
                <p className="text-sm text-foreground uppercase">{doc.source_type}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">ToC Strategy</p>
                <p className="text-sm capitalize text-foreground">
                  {doc.toc_strategy || "N/A"}
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
