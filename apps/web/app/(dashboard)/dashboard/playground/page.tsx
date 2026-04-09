"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, FlaskConical, Loader2, Search } from "lucide-react";

const mockDocuments = [
  { id: "doc_1", title: "Q4 2025 Annual Report" },
  { id: "doc_2", title: "Technical Architecture Overview" },
  { id: "doc_4", title: "API Integration Guide" },
  { id: "doc_6", title: "Employee Handbook v3.2" },
];

export default function PlaygroundPage() {
  const [query, setQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState("");
  const [strategy, setStrategy] = useState("hybrid");
  const [isRunning, setIsRunning] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    // Placeholder: real query logic will go here
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRunning(false);
    setHasResults(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Playground
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Test retrieval queries against your documents in real time.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left panel - Query */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="h-4 w-4" />
              Query
            </CardTitle>
            <CardDescription>
              Enter a natural language query to search your documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="query">Query</Label>
              <Textarea
                id="query"
                placeholder="e.g. What were the key financial metrics in Q4?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document">Document (optional)</Label>
              <Select value={selectedDoc} onValueChange={setSelectedDoc}>
                <SelectTrigger id="document">
                  <SelectValue placeholder="Search all documents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All documents</SelectItem>
                  {mockDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Strategy</Label>
              <Tabs value={strategy} onValueChange={setStrategy}>
                <TabsList className="w-full">
                  <TabsTrigger value="extract" className="flex-1">
                    Extract
                  </TabsTrigger>
                  <TabsTrigger value="generate" className="flex-1">
                    Generate
                  </TabsTrigger>
                  <TabsTrigger value="hybrid" className="flex-1">
                    Hybrid
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {strategy === "extract" &&
                  "Retrieve existing sections that match your query"}
                {strategy === "generate" &&
                  "Generate an answer using AI based on document content"}
                {strategy === "hybrid" &&
                  "Combine extraction and generation for best results"}
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleRunQuery}
              disabled={!query.trim() || isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running...
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

        {/* Right panel - Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4" />
              Results
            </CardTitle>
            <CardDescription>
              {hasResults
                ? "3 sections matched your query"
                : "Run a query to see results"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasResults ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FlaskConical className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-foreground">
                  No results yet
                </h3>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Enter a query and click &quot;Run Query&quot; to see matching
                  sections.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mock result 1 */}
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      Financial Highlights
                    </h4>
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                      0.94
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Revenue grew 34% year-over-year to $2.4B. Operating margin
                    expanded to 18.5%, up from 15.2% in Q3. Net income reached
                    $312M, a 42% increase...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Q4 2025 Annual Report -- pp. 4-12
                  </p>
                </div>

                {/* Mock result 2 */}
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      Executive Summary
                    </h4>
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                      0.87
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Q4 2025 marks our strongest quarter yet, with record revenue,
                    customer growth, and product launches. Key metrics all
                    exceeded guidance...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Q4 2025 Annual Report -- pp. 1-3
                  </p>
                </div>

                {/* Mock result 3 */}
                <div className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-foreground">
                      Outlook & Strategy
                    </h4>
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                      0.72
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For 2026, we expect continued momentum with projected revenue
                    of $10.2B-$10.8B. Key strategic priorities include
                    international expansion...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Q4 2025 Annual Report -- pp. 37-42
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
