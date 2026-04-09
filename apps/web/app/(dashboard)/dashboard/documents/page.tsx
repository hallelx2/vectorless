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
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

const mockDocuments = [
  {
    id: "doc_1",
    title: "Q4 2025 Annual Report",
    type: "PDF",
    sections: 42,
    status: "ready" as const,
    createdAt: "Apr 6, 2026",
  },
  {
    id: "doc_2",
    title: "Technical Architecture Overview",
    type: "PDF",
    sections: 18,
    status: "ready" as const,
    createdAt: "Apr 6, 2026",
  },
  {
    id: "doc_3",
    title: "Product Requirements Document",
    type: "DOCX",
    sections: 0,
    status: "processing" as const,
    createdAt: "Apr 5, 2026",
  },
  {
    id: "doc_4",
    title: "API Integration Guide",
    type: "TXT",
    sections: 12,
    status: "ready" as const,
    createdAt: "Apr 4, 2026",
  },
  {
    id: "doc_5",
    title: "Meeting Notes - Sprint Review",
    type: "TXT",
    sections: 0,
    status: "failed" as const,
    createdAt: "Apr 3, 2026",
  },
  {
    id: "doc_6",
    title: "Employee Handbook v3.2",
    type: "PDF",
    sections: 56,
    status: "ready" as const,
    createdAt: "Apr 1, 2026",
  },
];

const statusColors: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processing: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

export default function DocumentsPage() {
  const [search, setSearch] = useState("");

  const filteredDocuments = mockDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

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
            {filteredDocuments.length} document
            {filteredDocuments.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
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
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {doc.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{doc.sections}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[doc.status]}
                      >
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/documents/${doc.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
