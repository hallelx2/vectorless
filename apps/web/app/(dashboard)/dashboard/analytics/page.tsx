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
import {
  Activity,
  Clock,
  CheckCircle,
  FileText,
  BarChart3,
} from "lucide-react";

const stats = [
  {
    label: "Total Requests",
    value: "48,291",
    description: "Last 30 days",
    icon: Activity,
  },
  {
    label: "Avg Latency",
    value: "142ms",
    description: "p50 response time",
    icon: Clock,
  },
  {
    label: "Success Rate",
    value: "99.7%",
    description: "Last 30 days",
    icon: CheckCircle,
  },
  {
    label: "Active Documents",
    value: "21",
    description: "With ready status",
    icon: FileText,
  },
];

const recentCalls = [
  {
    id: "req_1a2b3c",
    endpoint: "/v1/query",
    method: "POST",
    status: 200,
    latency: "128ms",
    timestamp: "2 min ago",
  },
  {
    id: "req_4d5e6f",
    endpoint: "/v1/documents",
    method: "GET",
    status: 200,
    latency: "45ms",
    timestamp: "5 min ago",
  },
  {
    id: "req_7g8h9i",
    endpoint: "/v1/query",
    method: "POST",
    status: 200,
    latency: "312ms",
    timestamp: "8 min ago",
  },
  {
    id: "req_0j1k2l",
    endpoint: "/v1/documents/upload",
    method: "POST",
    status: 201,
    latency: "1.2s",
    timestamp: "12 min ago",
  },
  {
    id: "req_3m4n5o",
    endpoint: "/v1/query",
    method: "POST",
    status: 429,
    latency: "12ms",
    timestamp: "15 min ago",
  },
  {
    id: "req_6p7q8r",
    endpoint: "/v1/sections",
    method: "GET",
    status: 200,
    latency: "67ms",
    timestamp: "22 min ago",
  },
];

function getStatusColor(status: number) {
  if (status >= 200 && status < 300)
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (status >= 400 && status < 500)
    return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor your API usage, performance, and error rates.
        </p>
      </div>

      {/* Stats */}
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
              <div className="mt-3">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" />
            Usage Over Time
          </CardTitle>
          <CardDescription>
            API request volume over the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[280px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
            <div className="text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Chart area
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recharts integration coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent API calls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent API Calls</CardTitle>
          <CardDescription>
            The latest requests to your Vectorless API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-mono text-xs">
                    {call.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {call.endpoint}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {call.method}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(call.status)}
                    >
                      {call.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {call.latency}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {call.timestamp}
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
