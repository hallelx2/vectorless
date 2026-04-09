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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ErrorLog {
  id: string;
  timestamp: string;
  endpoint: string;
  statusCode: number;
  errorCode: string;
  message: string;
  requestId: string;
}

const mockErrors: ErrorLog[] = [
  {
    id: "err_1",
    timestamp: "2026-04-08T14:32:18Z",
    endpoint: "/v1/query",
    statusCode: 429,
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded. Maximum 1000 requests per minute.",
    requestId: "req_9a8b7c6d",
  },
  {
    id: "err_2",
    timestamp: "2026-04-08T13:15:42Z",
    endpoint: "/v1/documents/abc123",
    statusCode: 404,
    errorCode: "DOCUMENT_NOT_FOUND",
    message: "Document with ID 'abc123' was not found.",
    requestId: "req_5e4f3g2h",
  },
  {
    id: "err_3",
    timestamp: "2026-04-08T11:48:09Z",
    endpoint: "/v1/documents",
    statusCode: 500,
    errorCode: "INTERNAL_ERROR",
    message: "An unexpected error occurred during document processing.",
    requestId: "req_1i0j9k8l",
  },
  {
    id: "err_4",
    timestamp: "2026-04-07T22:05:33Z",
    endpoint: "/v1/query",
    statusCode: 429,
    errorCode: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded. Maximum 1000 requests per minute.",
    requestId: "req_7m6n5o4p",
  },
  {
    id: "err_5",
    timestamp: "2026-04-07T18:22:11Z",
    endpoint: "/v1/documents/xyz789/sections/sec_99",
    statusCode: 404,
    errorCode: "SECTION_NOT_FOUND",
    message: "Section 'sec_99' not found in document 'xyz789'.",
    requestId: "req_3q2r1s0t",
  },
  {
    id: "err_6",
    timestamp: "2026-04-07T09:41:55Z",
    endpoint: "/v1/documents",
    statusCode: 500,
    errorCode: "PROCESSING_FAILED",
    message: "Document processing failed: unable to extract text from corrupted PDF.",
    requestId: "req_8u7v6w5x",
  },
];

function getStatusColor(statusCode: number) {
  if (statusCode === 404) return "bg-amber-100 text-amber-700 border-amber-200";
  if (statusCode === 429) return "bg-orange-100 text-orange-700 border-orange-200";
  if (statusCode >= 500) return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getErrorCodeColor(code: string) {
  if (code.includes("RATE_LIMIT")) return "bg-orange-100 text-orange-700 border-orange-200";
  if (code.includes("NOT_FOUND")) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

export default function ErrorLogsPage() {
  const [errorCodeFilter, setErrorCodeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("7d");

  const filteredErrors =
    errorCodeFilter === "all"
      ? mockErrors
      : mockErrors.filter((err) => {
          if (errorCodeFilter === "404") return err.statusCode === 404;
          if (errorCodeFilter === "429") return err.statusCode === 429;
          if (errorCodeFilter === "500") return err.statusCode >= 500;
          return true;
        });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Error Logs
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review API errors and failed requests.
            </p>
          </div>
          <Badge variant="destructive" className="text-xs">
            {mockErrors.length} errors
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Error Code:
              </span>
              <Select value={errorCodeFilter} onValueChange={setErrorCodeFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by error code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Errors</SelectItem>
                  <SelectItem value="404">404 - Not Found</SelectItem>
                  <SelectItem value="429">429 - Rate Limited</SelectItem>
                  <SelectItem value="500">5xx - Server Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Period:
              </span>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Error History</CardTitle>
          <CardDescription>
            {filteredErrors.length} error{filteredErrors.length !== 1 ? "s" : ""}{" "}
            in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredErrors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">
                No errors in the selected period
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All API requests completed successfully. Great job!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error Code</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Request ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredErrors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(error.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs">
                      {error.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`font-mono text-xs ${getStatusColor(error.statusCode)}`}
                      >
                        {error.statusCode}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getErrorCodeColor(error.errorCode)}`}
                      >
                        {error.errorCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                      {error.message}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {error.requestId}
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
