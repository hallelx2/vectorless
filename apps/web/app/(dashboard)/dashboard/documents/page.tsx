"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/dashboard/PageHeader";

interface Document {
  doc_id: string;
  title: string;
  source_type: string;
  section_count: number;
  status: string;
  created_at: string;
}

const STATUS_TONE: Record<string, string> = {
  ready: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  processing: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  failed: "bg-red-500/10 text-red-600 border-red-500/20",
};

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "ready", label: "Ready" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard/documents");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch {
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleDelete = useCallback(async (docId: string) => {
    if (!confirm("Delete this document? This can't be undone.")) return;
    setDeletingId(docId);
    try {
      const res = await fetch(`/api/dashboard/documents/${docId}`, { method: "DELETE" });
      if (res.ok) setDocuments((prev) => prev.filter((d) => d.doc_id !== docId));
    } catch {
      // retry silently
    } finally {
      setDeletingId(null);
    }
  }, []);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchesQuery = d.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [documents, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: documents.length,
      ready: documents.filter((d) => d.status === "ready").length,
      processing: documents.filter((d) => d.status === "processing").length,
      failed: documents.filter((d) => d.status === "failed").length,
    };
  }, [documents]);

  const showEmpty = !isLoading && filtered.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library"
        title="Documents"
        description="Upload, structure, and inspect every document available to your agents."
        actions={
          <Button size="sm" className="h-9" asChild>
            <Link href="/dashboard/documents/upload">
              <Upload className="size-3.5" />
              Upload document
            </Link>
          </Button>
        }
      />

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          const count = counts[f.value as keyof typeof counts] ?? 0;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {f.label}
              <span
                className={`font-data text-[10px] tracking-[0.1em] ${active ? "text-background/70" : "text-muted-foreground/70"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
            <Search className="size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-0 shadow-none focus-visible:ring-0 px-0 text-[13px]"
            />
            <Button variant="ghost" size="sm" className="h-7 text-[12px] gap-1.5 text-muted-foreground">
              <Filter className="size-3.5" />
              Filters
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : showEmpty ? (
            <EmptyState hasQuery={search.length > 0 || statusFilter !== "all"} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="font-data text-[10px] uppercase tracking-[0.14em] pl-6">Title</TableHead>
                  <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Type</TableHead>
                  <TableHead className="font-data text-[10px] uppercase tracking-[0.14em] text-right">Sections</TableHead>
                  <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Status</TableHead>
                  <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Created</TableHead>
                  <TableHead className="font-data text-[10px] uppercase tracking-[0.14em] text-right pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.doc_id} className="border-border/60 group">
                    <TableCell className="font-medium pl-6">
                      <Link
                        href={`/dashboard/documents/${doc.doc_id}`}
                        className="hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <FileText className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[280px]">{doc.title}</span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-data text-[10px] uppercase tracking-[0.14em] h-5 px-1.5"
                      >
                        {doc.source_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-data text-[12px] text-right">
                      {doc.section_count}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-data text-[10px] uppercase tracking-[0.14em] h-5 px-1.5 ${STATUS_TONE[doc.status] || ""}`}
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-data text-[12px] text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          asChild
                        >
                          <Link href={`/dashboard/documents/${doc.doc_id}`}>
                            <Eye className="size-3.5" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="size-3.5" />
                              <span className="sr-only">More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-[13px]">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/documents/${doc.doc_id}`}>
                                <Eye className="size-3.5" /> View detail
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/documents/${doc.doc_id}/sections`}>
                                <FileText className="size-3.5" /> Browse sections
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(doc.doc_id)}
                              disabled={deletingId === doc.doc_id}
                              className="text-destructive focus:text-destructive"
                            >
                              {deletingId === doc.doc_id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="size-3.5" />
                              )}
                              Delete document
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border/60 text-[12px] text-muted-foreground">
              <span>
                Showing <span className="font-medium text-foreground">{filtered.length}</span>{" "}
                of <span className="font-medium text-foreground">{documents.length}</span> documents
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-[12px] gap-1.5">
                Sort by date
                <ChevronDown className="size-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted/60 border border-border mb-4">
        <FileText className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-display text-[18px] font-medium mb-1.5">
        {hasQuery ? "Nothing matches that filter." : "No documents yet."}
      </h3>
      <p className="text-[13px] text-muted-foreground max-w-[360px] mx-auto mb-6">
        {hasQuery
          ? "Try clearing the search or changing the status filter to see more results."
          : "Drop in a PDF, DOCX, URL, or paste raw text. We'll structure it in seconds."}
      </p>
      {!hasQuery && (
        <Button size="sm" className="h-9" asChild>
          <Link href="/dashboard/documents/upload">
            <Upload className="size-3.5" />
            Upload your first document
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      )}
    </div>
  );
}
