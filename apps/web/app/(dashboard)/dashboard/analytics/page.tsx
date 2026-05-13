import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/dashboard/PageHeader";

const STATS = [
  {
    label: "Total requests",
    value: "48,291",
    delta: "+12.4%",
    deltaUp: true,
    description: "vs. last 30 days",
    icon: Activity,
    tone: "from-brand-blue/12 to-brand-blue/0",
  },
  {
    label: "Avg latency",
    value: "142ms",
    delta: "-8ms",
    deltaUp: true,
    description: "p50 response time",
    icon: Clock,
    tone: "from-emerald-400/12 to-emerald-400/0",
  },
  {
    label: "Success rate",
    value: "99.7%",
    delta: "+0.1%",
    deltaUp: true,
    description: "2xx of all responses",
    icon: CheckCircle,
    tone: "from-amber-400/12 to-amber-400/0",
  },
  {
    label: "Active documents",
    value: "21",
    delta: "+3",
    deltaUp: true,
    description: "with ready status",
    icon: FileText,
    tone: "from-brand-pink/12 to-brand-pink/0",
  },
];

const RECENT_CALLS = [
  { id: "req_1a2b3c", endpoint: "/v1/query", method: "POST", status: 200, latency: "128ms", ago: "2m ago" },
  { id: "req_4d5e6f", endpoint: "/v1/documents", method: "GET", status: 200, latency: "45ms", ago: "5m ago" },
  { id: "req_7g8h9i", endpoint: "/v1/query", method: "POST", status: 200, latency: "312ms", ago: "8m ago" },
  { id: "req_0j1k2l", endpoint: "/v1/documents/upload", method: "POST", status: 201, latency: "1.2s", ago: "12m ago" },
  { id: "req_3m4n5o", endpoint: "/v1/query", method: "POST", status: 429, latency: "12ms", ago: "15m ago" },
  { id: "req_6p7q8r", endpoint: "/v1/sections", method: "GET", status: 200, latency: "67ms", ago: "22m ago" },
];

const SPARK = [12, 18, 14, 22, 20, 26, 24, 30, 36, 32, 40, 38, 44, 42, 50, 56, 52, 60, 64, 70, 66, 72, 78, 74, 80, 86, 82, 88, 92, 96];

function statusTone(status: number) {
  if (status >= 200 && status < 300) return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (status >= 400 && status < 500) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-red-500/10 text-red-600 border-red-500/20";
}

export default function AnalyticsPage() {
  const max = Math.max(...SPARK);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Last 30 days"
        title="Analytics"
        description="API request volume, latency distribution, and error rates across your workspace."
      />

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          const DeltaIcon = s.deltaUp ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={s.label} className="relative overflow-hidden border-border/60 gap-0 py-5">
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
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[32px] font-medium leading-none tracking-[-0.02em]">
                    {s.value}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 font-data text-[10px] tracking-[0.1em] ${
                      s.deltaUp ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    <DeltaIcon className="size-3" />
                    {s.delta}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground mt-2">{s.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <BarChart3 className="size-4 text-muted-foreground" />
            Request volume
          </CardTitle>
          <CardDescription className="text-[12.5px]">
            Daily API requests over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-[180px]">
            {SPARK.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-brand-blue/60 to-brand-blue/20 hover:from-brand-blue hover:to-brand-blue/40 transition-colors"
                style={{ height: `${(v / max) * 100}%` }}
                title={`Day ${i + 1}: ${v * 100}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent calls */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-[15px]">Recent API calls</CardTitle>
            <CardDescription className="text-[12.5px]">
              The latest requests to your workspace.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <TableHead className="font-data text-[10px] uppercase tracking-[0.14em] pl-6">Request ID</TableHead>
                <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Endpoint</TableHead>
                <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Method</TableHead>
                <TableHead className="font-data text-[10px] uppercase tracking-[0.14em]">Status</TableHead>
                <TableHead className="font-data text-[10px] uppercase tracking-[0.14em] text-right">Latency</TableHead>
                <TableHead className="font-data text-[10px] uppercase tracking-[0.14em] text-right pr-6">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENT_CALLS.map((call) => (
                <TableRow key={call.id} className="border-border/60">
                  <TableCell className="font-data text-[12px] text-muted-foreground pl-6">
                    {call.id}
                  </TableCell>
                  <TableCell className="font-data text-[12px]">
                    {call.endpoint}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-data text-[10px] uppercase tracking-[0.14em] h-5 px-1.5">
                      {call.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-data text-[10px] tracking-[0.1em] h-5 px-1.5 ${statusTone(call.status)}`}
                    >
                      {call.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-data text-[12px] text-right">{call.latency}</TableCell>
                  <TableCell className="text-right text-muted-foreground font-data text-[12px] pr-6">
                    {call.ago}
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
