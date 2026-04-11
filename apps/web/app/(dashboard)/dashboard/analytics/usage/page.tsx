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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, BarChart3, Clock, Zap } from "lucide-react";

type DateRange = "7d" | "30d" | "90d";

interface EndpointData {
  endpoint: string;
  method: string;
  count: number;
  avg_latency_ms: number;
  error_rate: number;
}

interface UsageData {
  range: string;
  total_requests: number;
  avg_per_day: number;
  peak_hour: string;
  success_rate: number;
  endpoints: EndpointData[];
  daily: { date: string; requests: number }[];
}

function getMethodColor(method: string) {
  switch (method) {
    case "GET":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "POST":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "DELETE":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export default function UsageAnalyticsPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/analytics/usage?range=${range}`);
        if (!res.ok) {
          setError("Failed to load usage data");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        setError("Failed to load usage data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsage();
  }, [range]);

  const mostUsedEndpoint = data?.endpoints?.length
    ? data.endpoints.reduce((max, e) => (e.count > max.count ? e : max), data.endpoints[0]).endpoint
    : "N/A";

  const statCards = [
    {
      label: "Total Requests",
      value: data ? data.total_requests.toLocaleString() : "--",
      icon: Activity,
    },
    {
      label: "Avg / Day",
      value: data ? data.avg_per_day.toLocaleString() : "--",
      icon: BarChart3,
    },
    {
      label: "Peak Hour",
      value: data?.peak_hour || "--",
      icon: Clock,
    },
    {
      label: "Most Used Endpoint",
      value: mostUsedEndpoint,
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          API Usage
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Detailed breakdown of your API request volume and endpoint
          performance.
        </p>
      </div>

      {/* Date range selector */}
      <Tabs
        value={range}
        onValueChange={(v) => setRange(v as DateRange)}
      >
        <TabsList>
          <TabsTrigger value="7d">Last 7 days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 days</TabsTrigger>
          <TabsTrigger value="90d">Last 90 days</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3">
                {isLoading ? (
                  <Skeleton className="h-8 w-[80px]" />
                ) : (
                  <span className="text-3xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Requests Over Time
          </CardTitle>
          <CardDescription>
            Request volume for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
            <div className="text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Requests Over Time
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recharts integration coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoint breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoint Breakdown</CardTitle>
          <CardDescription>
            Performance metrics per endpoint for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-5 w-[60px]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : !data?.endpoints?.length ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No usage data available for this period.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Avg Latency</TableHead>
                  <TableHead className="text-right">Error Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.endpoints.map((row) => (
                  <TableRow key={`${row.method}-${row.endpoint}`}>
                    <TableCell className="font-mono text-xs">
                      {row.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${getMethodColor(row.method)}`}
                      >
                        {row.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatLatency(row.avg_latency_ms)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          row.error_rate > 1
                            ? "text-red-600 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {row.error_rate}%
                      </span>
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
