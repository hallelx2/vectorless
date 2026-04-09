"use client";

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
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

const stats = [
  {
    label: "Total Documents",
    value: "24",
    trend: "+3",
    trendUp: true,
    icon: FileText,
    description: "from last week",
  },
  {
    label: "Total Sections",
    value: "1,248",
    trend: "+87",
    trendUp: true,
    icon: Layers,
    description: "from last week",
  },
  {
    label: "API Requests (today)",
    value: "3,421",
    trend: "-12%",
    trendUp: false,
    icon: Activity,
    description: "vs yesterday",
  },
  {
    label: "Active API Keys",
    value: "5",
    trend: "+1",
    trendUp: true,
    icon: Key,
    description: "from last week",
  },
];

const recentDocuments = [
  {
    id: "doc_1",
    title: "Q4 2025 Annual Report",
    type: "PDF",
    sections: 42,
    status: "ready" as const,
    createdAt: "2 hours ago",
  },
  {
    id: "doc_2",
    title: "Technical Architecture Overview",
    type: "PDF",
    sections: 18,
    status: "ready" as const,
    createdAt: "5 hours ago",
  },
  {
    id: "doc_3",
    title: "Product Requirements Document",
    type: "DOCX",
    sections: 0,
    status: "processing" as const,
    createdAt: "1 day ago",
  },
  {
    id: "doc_4",
    title: "API Integration Guide",
    type: "TXT",
    sections: 12,
    status: "ready" as const,
    createdAt: "2 days ago",
  },
  {
    id: "doc_5",
    title: "Meeting Notes - Sprint Review",
    type: "TXT",
    sections: 0,
    status: "failed" as const,
    createdAt: "3 days ago",
  },
];

const statusColors: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-700 border-emerald-200",
  processing: "bg-amber-100 text-amber-700 border-amber-200",
  failed: "bg-red-100 text-red-700 border-red-200",
};

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

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
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                    stat.trendUp ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {stat.trendUp ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {stat.trend}
                </span>
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
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/documents/${doc.id}`}
                        className="hover:text-primary transition-colors"
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
                    <TableCell className="text-right text-muted-foreground">
                      {doc.createdAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
