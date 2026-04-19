"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Activity, FileUp, Search, TreePine } from "lucide-react";
import { useSession } from "@/lib/auth-client";

interface UsageSummary {
  queriesUsed: number;
  queriesLimit: number;
  ingestPagesUsed: number;
  ingestPagesLimit: number;
  documentsStored: number;
  documentsLimit: number;
  plan: string;
}

const PLAN_LIMITS: Record<
  string,
  { queries: number; ingest: number; documents: number }
> = {
  free: { queries: 500, ingest: 500, documents: 25 },
  pro: { queries: 20_000, ingest: 10_000, documents: 500 },
  enterprise: { queries: Infinity, ingest: Infinity, documents: Infinity },
};

function usagePercent(used: number, limit: number): number {
  if (limit === Infinity || limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function formatNumber(n: number): string {
  if (n === Infinity) return "Unlimited";
  return n.toLocaleString();
}

function progressColor(percent: number): string {
  if (percent >= 90) return "bg-destructive";
  if (percent >= 75) return "bg-amber-500";
  return "bg-primary";
}

export default function UsagePage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [usage, setUsage] = useState<UsageSummary>({
    queriesUsed: 0,
    queriesLimit: 500,
    ingestPagesUsed: 0,
    ingestPagesLimit: 500,
    documentsStored: 0,
    documentsLimit: 25,
    plan: "free",
  });

  useEffect(() => {
    // In production, this would fetch from the API
    // For now, show placeholder data based on default free plan
    const timer = setTimeout(() => {
      setUsage({
        queriesUsed: 0,
        queriesLimit: PLAN_LIMITS.free.queries,
        ingestPagesUsed: 0,
        ingestPagesLimit: PLAN_LIMITS.free.ingest,
        documentsStored: 0,
        documentsLimit: PLAN_LIMITS.free.documents,
        plan: "free",
      });
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const queryPercent = usagePercent(usage.queriesUsed, usage.queriesLimit);
  const ingestPercent = usagePercent(
    usage.ingestPagesUsed,
    usage.ingestPagesLimit
  );
  const docsPercent = usagePercent(
    usage.documentsStored,
    usage.documentsLimit
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Usage
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your monthly usage across queries, document ingestion, and
            storage.
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-sm font-medium capitalize"
        >
          {usage.plan} Plan
        </Badge>
      </div>

      {/* Usage Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Queries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Queries This Month
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-data">
              {formatNumber(usage.queriesUsed)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatNumber(usage.queriesLimit)} limit
            </p>
            <Progress
              value={queryPercent}
              className="mt-3 h-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {queryPercent}% used
            </p>
          </CardContent>
        </Card>

        {/* Ingest Pages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pages Ingested This Month
            </CardTitle>
            <FileUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-data">
              {formatNumber(usage.ingestPagesUsed)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatNumber(usage.ingestPagesLimit)} limit
            </p>
            <Progress
              value={ingestPercent}
              className="mt-3 h-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {ingestPercent}% used
            </p>
          </CardContent>
        </Card>

        {/* Documents Stored */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Documents Stored
            </CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-data">
              {formatNumber(usage.documentsStored)}
            </div>
            <p className="text-xs text-muted-foreground">
              of {formatNumber(usage.documentsLimit)} limit
            </p>
            <Progress
              value={docsPercent}
              className="mt-3 h-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {docsPercent}% used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rate limits info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Rate Limits
          </CardTitle>
          <CardDescription>
            Request limits per minute for your current plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Queries</p>
              <p className="text-2xl font-bold font-data mt-1">
                {usage.plan === "free"
                  ? "20"
                  : usage.plan === "pro"
                    ? "200"
                    : "1,000"}
              </p>
              <p className="text-xs text-muted-foreground">
                requests per minute
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Document Upload</p>
              <p className="text-2xl font-bold font-data mt-1">
                {usage.plan === "free"
                  ? "5"
                  : usage.plan === "pro"
                    ? "30"
                    : "200"}
              </p>
              <p className="text-xs text-muted-foreground">
                requests per minute
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">Tree Navigation</p>
              <p className="text-2xl font-bold font-data mt-1">
                {usage.plan === "free"
                  ? "120"
                  : usage.plan === "pro"
                    ? "1,200"
                    : "10,000"}
              </p>
              <p className="text-xs text-muted-foreground">
                requests per minute
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
