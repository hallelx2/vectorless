"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  FileText,
  Layers,
  Activity,
  Key,
  Upload,
  FlaskConical,
  Plus,
  ArrowRight,
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

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Derive stats from real data
  const totalDocuments = documents.length;
  const totalSections = documents.reduce((sum, d) => sum + (d.section_count || 0), 0);
  const readyCount = documents.filter((d) => d.status === "ready").length;
  const processingCount = documents.filter((d) => d.status === "processing").length;

  const recentDocuments = documents.slice(0, 5);

  const stats = [
    {
      label: "Total Documents",
      value: isLoading ? "--" : totalDocuments.toLocaleString(),
      icon: FileText,
      description: `${readyCount} ready, ${processingCount} processing`,
    },
    {
      label: "Total Sections",
      value: isLoading ? "--" : totalSections.toLocaleString(),
      icon: Layers,
      description: "across all documents",
    },
    {
      label: "Ready Documents",
      value: isLoading ? "--" : readyCount.toLocaleString(),
      icon: Activity,
      description: "available for querying",
    },
    {
      label: "Processing",
      value: isLoading ? "--" : processingCount.toLocaleString(),
      icon: Key,
      description: "currently being processed",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your Vectorless workspace.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                {isLoading ? (
                  <Skeleton className="h-8 w-[60px]" />
                ) : (
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Documents */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Documents</CardTitle>
              <CardDescription>
                Your latest uploaded and processed documents
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/documents">
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
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
                    <Skeleton className="h-5 w-[80px]" />
                  </div>
                ))}
              </div>
            ) : recentDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No documents yet. Upload your first document to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDocuments.map((doc) => (
                    <TableRow key={doc.doc_id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/documents/${doc.doc_id}`}
                          className="hover:text-primary transition-colors"
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
                      <TableCell className="text-right text-muted-foreground">
                        {formatRelativeTime(doc.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/dashboard/documents/upload">
                <Upload className="h-4 w-4" />
                Upload Document
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/playground">
                <FlaskConical className="h-4 w-4" />
                Open Playground
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/api-keys">
                <Plus className="h-4 w-4" />
                Generate API Key
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
