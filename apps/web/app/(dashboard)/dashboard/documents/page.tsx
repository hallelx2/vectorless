"use client";

import { useState, useEffect, useCallback } from "react";
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
  Upload,
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react";

interface Document {
  doc_id: string;
  title: string;
  source_type: string;
  section_count: number;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processing: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
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
    }
    fetchDocuments();
  }, []);

  const handleDelete = useCallback(
    async (docId: string) => {
      if (!confirm("Are you sure you want to delete this document?")) return;
      setDeletingId(docId);
      try {
        const res = await fetch(`/api/dashboard/documents/${docId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setDocuments((prev) => prev.filter((d) => d.doc_id !== docId));
        }
      } catch {
        // Silently fail — user can retry
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Documents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your uploaded documents and their processing status.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/documents/upload">
            <Upload className="h-4 w-4" />
            Upload Document
          </Link>
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Documents</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading documents..."
              : `${filteredDocuments.length} document${filteredDocuments.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-5 w-[40px]" />
                  <Skeleton className="h-5 w-[70px]" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">
                No documents found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Try adjusting your search query."
                  : "Upload your first document to get started."}
              </p>
              {!search && (
                <Button className="mt-4" asChild>
                  <Link href="/dashboard/documents/upload">
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.doc_id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/documents/${doc.doc_id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {doc.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs uppercase">
                        {doc.source_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.section_count}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[doc.status] || ""}
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/documents/${doc.doc_id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(doc.doc_id)}
                          disabled={deletingId === doc.doc_id}
                        >
                          {deletingId === doc.doc_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
