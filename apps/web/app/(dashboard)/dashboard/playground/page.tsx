"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  FileText,
  Search,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
import { runPlaygroundQuery } from "@/lib/actions/playground";

// ---------- Types ----------

interface Document {
  doc_id: string;
  title: string;
  source_type: string;
  section_count: number;
  status: string;
}

interface SelectedSection {
  section_id: string;
  title: string;
  relevance_score: number;
  page_range: string;
  summary: string;
  content_preview: string;
}

interface QueryTiming {
  total_ms: number;
  toc_retrieval_ms: number;
  section_selection_ms: number;
  content_fetch_ms: number;
}

interface QueryResult {
  toc?: any;
  selected_section_ids?: string[];
  sections?: any[];
  timing: QueryTiming;
  reasoning: string;
  // Legacy fields
  query?: string;
  doc_id?: string | null;
  strategy?: string;
  selected_sections?: SelectedSection[];
}

type RetrievalMode = "vectorless" | "hybrid" | "vector";

// Maps the UI retrieval modes to the API strategy values
const modeToStrategy: Record<RetrievalMode, string> = {
  vectorless: "extract",
  hybrid: "hybrid",
  vector: "generate",
};

const modeDescriptions: Record<RetrievalMode, string> = {
  vectorless:
    "ToC-first retrieval: uses the document manifest to select sections semantically",
  hybrid:
    "Combines ToC-based selection with vector similarity for best coverage",
  vector:
    "Pure vector similarity search across all embedded chunks",
};

// ---------- Sub-components ----------

function CollapsibleJson({
  data,
  defaultOpen = false,
}: {
  data: unknown;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const jsonStr = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-lg border bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        {open ? "Collapse" : "Expand"} JSON
      </button>
      {open && (
        <div className="relative border-t">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="sr-only">Copy JSON</span>
          </Button>
          {copied && (
            <span className="absolute right-10 top-2.5 text-xs text-muted-foreground">
              Copied
            </span>
          )}
          <pre className="overflow-x-auto p-3 text-xs leading-relaxed font-mono text-muted-foreground">
            {jsonStr}
          </pre>
        </div>
      )}
    </div>
  );
}

function SectionCard({ section }: { section: SelectedSection }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border transition-colors hover:border-primary/30">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="mt-0.5 shrink-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-medium text-foreground">
              {section.title}
            </h4>
            <Badge
              variant="outline"
              className="font-mono text-xs bg-primary/10 text-primary border-primary/20"
            >
              {section.relevance_score.toFixed(2)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {section.section_id} &middot; pp. {section.page_range}
          </p>
        </div>
      </button>
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3 ml-7">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Summary
            </p>
            <p className="text-sm text-foreground">{section.summary}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Content Preview
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {section.content_preview}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TraceStep({
  stepNumber,
  title,
  subtitle,
  timing,
  status,
  children,
}: {
  stepNumber: number;
  title: string;
  subtitle: string;
  timing?: string;
  status: "pending" | "running" | "done";
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(status === "done");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status === "done") setOpen(true);
  }, [status]);

  return (
    <div className="relative">
      {/* Connector line */}
      {stepNumber < 3 && (
        <div className="absolute left-[15px] top-[36px] bottom-0 w-px bg-border" />
      )}

      <div className="flex items-start gap-3">
        {/* Step circle */}
        <div
          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
            status === "done"
              ? "border-primary bg-primary text-primary-foreground"
              : status === "running"
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted-foreground/30 bg-muted text-muted-foreground"
          }`}
        >
          {status === "running" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            stepNumber
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-6">
          <button
            type="button"
            onClick={() => status === "done" && setOpen(!open)}
            disabled={status !== "done"}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h3
                className={`text-sm font-medium ${status === "pending" ? "text-muted-foreground" : "text-foreground"}`}
              >
                {title}
              </h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {timing && status === "done" && (
                <Badge variant="secondary" className="font-mono text-xs">
                  {timing}
                </Badge>
              )}
              {status === "done" && (
                <span className="text-muted-foreground">
                  {open ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              )}
            </div>
          </button>

          {status === "running" && (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {status === "done" && open && (
            <div className="mt-3">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Main page ----------

export default function PlaygroundPage() {
  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState("all");
  const [mode, setMode] = useState<RetrievalMode>("hybrid");

  // Documents fetched from API
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Query execution state
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0 = not started, 1-3 = running step
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents on mount
  useEffect(() => {
    async function fetchDocuments() {
      setLoadingDocs(true);
      try {
        const res = await fetch("/api/dashboard/documents");
        if (!res.ok) throw new Error("Failed to fetch documents");
        const data = await res.json();
        setDocuments(
          (data.documents || []).filter(
            (d: Document) => d.status === "ready"
          )
        );
      } catch {
        // Fall back silently -- the user can still query across all documents
        setDocuments([]);
      } finally {
        setLoadingDocs(false);
      }
    }
    fetchDocuments();
  }, []);

  const handleRunQuery = useCallback(async () => {
    if (!query.trim() || isRunning) return;

    setError(null);
    setResult(null);
    setIsRunning(true);

    // Animate through the steps for visual feedback
    setActiveStep(1);
    await new Promise((r) => setTimeout(r, 400));

    setActiveStep(2);
    await new Promise((r) => setTimeout(r, 600));

    setActiveStep(3);

    // Actually run the query
    const docIds =
      selectedDoc && selectedDoc !== "all" ? [selectedDoc] : [];
    const response = await runPlaygroundQuery({
      query,
      docIds,
      strategy: modeToStrategy[mode],
    });

    if (response.error) {
      setError(response.error);
      setIsRunning(false);
      setActiveStep(0);
      return;
    }

    setResult(response.data as unknown as QueryResult);
    setActiveStep(4); // All done
    setIsRunning(false);
  }, [query, selectedDoc, mode, isRunning]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRunQuery();
    }
  };

  const stepStatus = (step: number): "pending" | "running" | "done" => {
    if (activeStep === 0) return "pending";
    if (step < activeStep) return "done";
    if (step === activeStep) return isRunning ? "running" : "done";
    return "pending";
  };

  // Build the ToC manifest view from the result
  const tocManifest = result
    ? {
        document: result.doc_id || "all",
        strategy: result.strategy,
        sections: result.selected_sections.map((s) => ({
          id: s.section_id,
          title: s.title,
          page_range: s.page_range,
          summary: s.summary,
        })),
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Playground
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Test retrieval queries against your documents and inspect the full
          retrieval trace.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left panel - Query configuration (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4" />
                Query
              </CardTitle>
              <CardDescription>
                Configure and run a retrieval query
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Document selector */}
              <div className="space-y-2">
                <Label htmlFor="document">Document</Label>
                {loadingDocs ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select value={selectedDoc} onValueChange={setSelectedDoc}>
                    <SelectTrigger id="document">
                      <SelectValue placeholder="Select a document" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          All documents
                        </span>
                      </SelectItem>
                      {documents.map((doc) => (
                        <SelectItem key={doc.doc_id} value={doc.doc_id}>
                          <span className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            {doc.title}
                            <Badge
                              variant="secondary"
                              className="ml-auto text-[10px] font-mono"
                            >
                              {doc.section_count}s
                            </Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Query input */}
              <div className="space-y-2">
                <Label htmlFor="query">Query</Label>
                <Textarea
                  id="query"
                  placeholder="e.g. What are the recommended first-line treatments?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Press{" "}
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    Ctrl+Enter
                  </kbd>{" "}
                  to run
                </p>
              </div>

              {/* Retrieval mode */}
              <div className="space-y-2">
                <Label>Retrieval Mode</Label>
                <Tabs
                  value={mode}
                  onValueChange={(v) => setMode(v as RetrievalMode)}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="vectorless" className="flex-1">
                      Vectorless
                    </TabsTrigger>
                    <TabsTrigger value="hybrid" className="flex-1">
                      Hybrid
                    </TabsTrigger>
                    <TabsTrigger value="vector" className="flex-1">
                      Vector
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <p className="text-xs text-muted-foreground">
                  {modeDescriptions[mode]}
                </p>
              </div>

              <Separator />

              {/* Run button */}
              <Button
                className="w-full"
                onClick={handleRunQuery}
                disabled={!query.trim() || isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running query...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Query
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Timing card -- only shown after results */}
          {result && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Timing Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    {
                      label: "ToC Retrieval",
                      ms: result.timing.toc_retrieval_ms,
                    },
                    {
                      label: "Section Selection",
                      ms: result.timing.section_selection_ms,
                    },
                    {
                      label: "Content Fetch",
                      ms: result.timing.content_fetch_ms,
                    },
                  ].map((t) => (
                    <div
                      key={t.label}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{t.label}</span>
                      <span className="font-mono text-xs text-foreground">
                        {t.ms}ms
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-foreground">Total</span>
                    <span className="font-mono text-xs text-primary">
                      {result.timing.total_ms}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel - Retrieval trace (3 cols) */}
        <div className="lg:col-span-3">
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Retrieval Trace
              </CardTitle>
              <CardDescription>
                {result
                  ? `${result.selected_sections.length} section${result.selected_sections.length !== 1 ? "s" : ""} retrieved in ${result.timing.total_ms}ms`
                  : "Run a query to inspect the step-by-step retrieval process"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Empty state */}
              {activeStep === 0 && !result && !error && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <Play className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-sm font-medium text-foreground">
                    No retrieval trace yet
                  </h3>
                  <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
                    Select a document, enter a query, and click &quot;Run
                    Query&quot; to see the full retrieval pipeline.
                  </p>
                </div>
              )}

              {/* Error state */}
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <h4 className="text-sm font-medium text-destructive">
                    Query Failed
                  </h4>
                  <p className="mt-1 text-sm text-destructive/80">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleRunQuery}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {/* Step-by-step trace */}
              {(activeStep > 0 || result) && !error && (
                <div className="space-y-0">
                  {/* Step 1: ToC Manifest */}
                  <TraceStep
                    stepNumber={1}
                    title="ToC Manifest"
                    subtitle="Retrieve the document structure map"
                    timing={
                      result
                        ? `${result.timing.toc_retrieval_ms}ms`
                        : undefined
                    }
                    status={stepStatus(1)}
                  >
                    {tocManifest && <CollapsibleJson data={tocManifest} />}
                  </TraceStep>

                  {/* Step 2: Sections Selected */}
                  <TraceStep
                    stepNumber={2}
                    title="Sections Selected"
                    subtitle="AI selects the most relevant sections"
                    timing={
                      result
                        ? `${result.timing.section_selection_ms}ms`
                        : undefined
                    }
                    status={stepStatus(2)}
                  >
                    {result && (
                      <div className="space-y-3">
                        {/* Reasoning */}
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">
                            Reasoning
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {result.reasoning}
                          </p>
                        </div>

                        {/* Section IDs */}
                        <div className="flex flex-wrap gap-1.5">
                          {result.selected_sections.map((s) => (
                            <Badge
                              key={s.section_id}
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {s.section_id}
                              <span className="ml-1 text-primary">
                                {s.relevance_score.toFixed(2)}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TraceStep>

                  {/* Step 3: Content Retrieved */}
                  <TraceStep
                    stepNumber={3}
                    title="Content Retrieved"
                    subtitle="Fetch the full content of selected sections"
                    timing={
                      result
                        ? `${result.timing.content_fetch_ms}ms`
                        : undefined
                    }
                    status={stepStatus(3)}
                  >
                    {result && (
                      <div className="space-y-2">
                        {result.selected_sections.map((section) => (
                          <SectionCard
                            key={section.section_id}
                            section={section}
                          />
                        ))}
                      </div>
                    )}
                  </TraceStep>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
