"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface UsageStats {
  totalRequests: string;
  avgPerDay: string;
  peakHour: string;
  mostUsedEndpoint: string;
}

interface EndpointRow {
  endpoint: string;
  method: string;
  count: number;
  avgLatency: string;
  errorRate: string;
}

const statsByRange: Record<DateRange, UsageStats> = {
  "7d": {
    totalRequests: "11,482",
    avgPerDay: "1,640",
    peakHour: "2:00 PM UTC",
    mostUsedEndpoint: "/v1/query",
  },
  "30d": {
    totalRequests: "48,291",
    avgPerDay: "1,610",
    peakHour: "2:00 PM UTC",
    mostUsedEndpoint: "/v1/query",
  },
  "90d": {
    totalRequests: "132,847",
    avgPerDay: "1,476",
    peakHour: "3:00 PM UTC",
    mostUsedEndpoint: "/v1/query",
  },
};

const endpointsByRange: Record<DateRange, EndpointRow[]> = {
  "7d": [
    { endpoint: "/v1/query", method: "POST", count: 6842, avgLatency: "245ms", errorRate: "0.3%" },
    { endpoint: "/v1/documents", method: "GET", count: 2104, avgLatency: "52ms", errorRate: "0.1%" },
    { endpoint: "/v1/documents/:id/toc", method: "GET", count: 1280, avgLatency: "38ms", errorRate: "0.2%" },
    { endpoint: "/v1/documents/:id/sections/:id", method: "GET", count: 890, avgLatency: "41ms", errorRate: "0.0%" },
    { endpoint: "/v1/documents", method: "POST", count: 214, avgLatency: "1.8s", errorRate: "2.3%" },
    { endpoint: "/v1/documents/:id", method: "DELETE", count: 152, avgLatency: "120ms", errorRate: "0.7%" },
  ],
  "30d": [
    { endpoint: "/v1/query", method: "POST", count: 28340, avgLatency: "238ms", errorRate: "0.4%" },
    { endpoint: "/v1/documents", method: "GET", count: 8920, avgLatency: "48ms", errorRate: "0.1%" },
    { endpoint: "/v1/documents/:id/toc", method: "GET", count: 5480, avgLatency: "42ms", errorRate: "0.2%" },
    { endpoint: "/v1/documents/:id/sections/:id", method: "GET", count: 3640, avgLatency: "39ms", errorRate: "0.1%" },
    { endpoint: "/v1/documents", method: "POST", count: 1284, avgLatency: "2.1s", errorRate: "1.8%" },
    { endpoint: "/v1/documents/:id", method: "DELETE", count: 627, avgLatency: "115ms", errorRate: "0.5%" },
  ],
  "90d": [
    { endpoint: "/v1/query", method: "POST", count: 78420, avgLatency: "252ms", errorRate: "0.5%" },
    { endpoint: "/v1/documents", method: "GET", count: 24180, avgLatency: "51ms", errorRate: "0.1%" },
    { endpoint: "/v1/documents/:id/toc", method: "GET", count: 15240, avgLatency: "44ms", errorRate: "0.3%" },
    { endpoint: "/v1/documents/:id/sections/:id", method: "GET", count: 9870, avgLatency: "40ms", errorRate: "0.1%" },
    { endpoint: "/v1/documents", method: "POST", count: 3520, avgLatency: "2.0s", errorRate: "2.1%" },
    { endpoint: "/v1/documents/:id", method: "DELETE", count: 1617, avgLatency: "118ms", errorRate: "0.6%" },
  ],
};

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

export default function UsageAnalyticsPage() {
  const [range, setRange] = useState<DateRange>("30d");
  const stats = statsByRange[range];
  const endpoints = endpointsByRange[range];

  const statCards = [
    { label: "Total Requests", value: stats.totalRequests, icon: Activity },
    { label: "Avg / Day", value: stats.avgPerDay, icon: BarChart3 },
    { label: "Peak Hour", value: stats.peakHour, icon: Clock },
    { label: "Most Used Endpoint", value: stats.mostUsedEndpoint, icon: Zap },
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
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </span>
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
              {endpoints.map((row) => (
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
                    {row.avgLatency}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        parseFloat(row.errorRate) > 1
                          ? "text-red-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {row.errorRate}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
