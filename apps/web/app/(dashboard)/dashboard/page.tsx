"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  FileText,
  FlaskConical,
  Key,
  Layers,
  Plus,
  Upload,
  Zap,
} from "lucide-react";

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

function formatRelative(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diffMs / 60_000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const totalDocuments = documents.length;
  const totalSections = documents.reduce((s, d) => s + (d.section_count || 0), 0);
  const readyCount = documents.filter((d) => d.status === "ready").length;
  const processingCount = documents.filter((d) => d.status === "processing").length;
  const recentDocuments = documents.slice(0, 5);

  const STATS = [
    {
      label: "Documents",
      value: totalDocuments,
      icon: FileText,
      tone: "from-brand-blue/15 to-brand-blue/0",
      hint: `${readyCount} ready · ${processingCount} processing`,
    },
    {
      label: "Sections indexed",
      value: totalSections,
      icon: Layers,
      tone: "from-brand-pink/15 to-brand-pink/0",
      hint: "addressable & queryable",
    },
    {
      label: "API requests",
      value: 0,
      icon: Zap,
      tone: "from-amber-400/15 to-amber-400/0",
      hint: "this month",
      suffix: "/ 10k",
    },
    {
      label: "API keys",
      value: 0,
      icon: Key,
      tone: "from-emerald-400/15 to-emerald-400/0",
      hint: "active",
    },
  ];

  const ONBOARDING = [
    {
      label: "Upload your first document",
      done: totalDocuments > 0,
      href: "/dashboard/documents/upload",
    },
    {
      label: "Generate an API key",
      done: false,
      href: "/dashboard/api-keys",
    },
    {
      label: "Try the playground",
      done: false,
      href: "/dashboard/playground",
    },
    {
      label: "Connect an LLM provider",
      done: false,
      href: "/dashboard/settings/llm-keys",
    },
  ];
  const completed = ONBOARDING.filter((o) => o.done).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`Welcome back, ${firstName}`}
        title={
          <>
            Your workspace, <span className="font-serif italic font-normal text-muted-foreground">at a glance.</span>
          </>
        }
        description="Documents you've structured, the agents querying them, and what's left to set up."
        actions={
          <>
            <Button variant="outline" size="sm" className="h-9" asChild>
              <Link href="/dashboard/playground">
                <FlaskConical className="size-3.5" />
                Playground
              </Link>
            </Button>
            <Button size="sm" className="h-9" asChild>
              <Link href="/dashboard/documents/upload">
                <Upload className="size-3.5" />
                Upload document
              </Link>
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className="relative overflow-hidden border-border/60 hover:border-border transition-colors gap-0 py-5"
            >
              <div
                aria-hidden
                className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${s.tone} pointer-events-none`}
              />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 pb-2">
                <CardTitle className="font-data text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  {s.label}
                </CardTitle>
                <Icon className="size-3.5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="px-5">
                <div className="flex items-baseline gap-1.5">
                  {isLoading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    <span className="font-display text-[32px] font-medium leading-none tracking-[-0.02em] text-foreground">
                      {s.value.toLocaleString()}
                    </span>
                  )}
                  {s.suffix && (
                    <span className="font-data text-[11px] text-muted-foreground">{s.suffix}</span>
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground mt-2">{s.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent documents */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-[15px]">Recent documents</CardTitle>
              <CardDescription className="text-[12.5px]">
                Latest uploads and their processing status.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 -mr-2" asChild>
              <Link href="/dashboard/documents">
                View all
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {isLoading ? (
              <div className="space-y-2 px-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : recentDocuments.length === 0 ? (
              <EmptyDocuments />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="font-data text-[10px] uppercase tracking-[0.14em] pl-6">Title</TableHead>
                    <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Type</TableHead>
                    <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Sections</TableHead>
                    <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Status</TableHead>
                    <TableHead className="font-data text-[10px] uppercase tracking-[0.14em] text-right pr-6">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDocuments.map((doc) => (
                    <TableRow
                      key={doc.doc_id}
                      className="border-border/60 group cursor-pointer"
                    >
                      <TableCell className="font-medium pl-6">
                        <Link
                          href={`/dashboard/documents/${doc.doc_id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {doc.title}
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
                      <TableCell className="font-data text-[12px] text-muted-foreground">
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
                      <TableCell className="text-right text-muted-foreground font-data text-[12px] pr-6">
                        {formatRelative(doc.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Onboarding checklist */}
          <Card className="border-border/60">
            <CardHeader className="space-y-1">
              <CardTitle className="text-[15px] flex items-center justify-between">
                Get started
                <span className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-medium">
                  {completed} / {ONBOARDING.length}
                </span>
              </CardTitle>
              <CardDescription className="text-[12.5px]">
                Four steps from zero to your first answer.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
              {ONBOARDING.map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className="group flex items-center gap-3 rounded-md -mx-1 px-2 py-1.5 hover:bg-accent transition-colors"
                >
                  {step.done ? (
                    <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  ) : (
                    <CircleDashed className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={`text-[13px] flex-1 ${
                      step.done ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  <ArrowRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-border/60 bg-gradient-to-br from-brand-blue/[0.03] via-transparent to-brand-pink/[0.03]">
            <CardHeader>
              <CardTitle className="text-[15px]">Resources</CardTitle>
              <CardDescription className="text-[12.5px]">
                Hands-on examples and references.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-0">
              {[
                { label: "Quickstart guide", href: "/dashboard", external: false },
                { label: "API reference", href: "/dashboard", external: true },
                { label: "MCP integration", href: "/dashboard", external: true },
                { label: "Discord community", href: "/dashboard", external: true },
              ].map((r) => (
                <Link
                  key={r.label}
                  href={r.href}
                  className="group flex items-center justify-between rounded-md px-2 py-1.5 -mx-1 hover:bg-accent transition-colors"
                >
                  <span className="text-[13px] text-foreground">{r.label}</span>
                  {r.external ? (
                    <ExternalLink className="size-3 text-muted-foreground" />
                  ) : (
                    <ArrowRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyDocuments() {
  return (
    <div className="px-6 pb-2 pt-2">
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <div className="inline-flex size-10 items-center justify-center rounded-full bg-background border border-border mb-4">
          <FileText className="size-4 text-muted-foreground" />
        </div>
        <h3 className="font-display text-[16px] font-medium mb-1">No documents yet</h3>
        <p className="text-[13px] text-muted-foreground mb-5 max-w-[280px] mx-auto">
          Upload a PDF, DOCX, or paste a URL. We&apos;ll structure it in seconds.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" className="h-8" asChild>
            <Link href="/dashboard/documents/upload">
              <Upload className="size-3.5" />
              Upload document
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="h-8" asChild>
            <Link href="/dashboard/playground">
              <Plus className="size-3.5" />
              Try sample
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
