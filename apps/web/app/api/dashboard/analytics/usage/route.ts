import { NextRequest, NextResponse } from "next/server";

// TODO: When Fastify API is running, proxy to it with real auth

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";

  // TODO: Authenticate and query real usage data
  // const session = await auth.api.getSession({ headers: await headers() });
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  // Mock usage analytics data
  const rangeData: Record<string, object> = {
    "7d": {
      range: "7d",
      total_requests: 11482,
      avg_per_day: 1640,
      peak_hour: "14:00 UTC",
      success_rate: 99.7,
      endpoints: [
        { endpoint: "/v1/query", method: "POST", count: 6842, avg_latency_ms: 245, error_rate: 0.3 },
        { endpoint: "/v1/documents", method: "GET", count: 2104, avg_latency_ms: 52, error_rate: 0.1 },
        { endpoint: "/v1/documents/:id/toc", method: "GET", count: 1280, avg_latency_ms: 38, error_rate: 0.2 },
        { endpoint: "/v1/documents/:id/sections/:id", method: "GET", count: 890, avg_latency_ms: 41, error_rate: 0.0 },
        { endpoint: "/v1/documents", method: "POST", count: 214, avg_latency_ms: 1800, error_rate: 2.3 },
        { endpoint: "/v1/documents/:id", method: "DELETE", count: 152, avg_latency_ms: 120, error_rate: 0.7 },
      ],
      daily: [
        { date: "2026-04-02", requests: 1580 },
        { date: "2026-04-03", requests: 1720 },
        { date: "2026-04-04", requests: 1490 },
        { date: "2026-04-05", requests: 1680 },
        { date: "2026-04-06", requests: 1810 },
        { date: "2026-04-07", requests: 1640 },
        { date: "2026-04-08", requests: 1562 },
      ],
    },
    "30d": {
      range: "30d",
      total_requests: 48291,
      avg_per_day: 1610,
      peak_hour: "14:00 UTC",
      success_rate: 99.6,
      endpoints: [
        { endpoint: "/v1/query", method: "POST", count: 28340, avg_latency_ms: 238, error_rate: 0.4 },
        { endpoint: "/v1/documents", method: "GET", count: 8920, avg_latency_ms: 48, error_rate: 0.1 },
        { endpoint: "/v1/documents/:id/toc", method: "GET", count: 5480, avg_latency_ms: 42, error_rate: 0.2 },
        { endpoint: "/v1/documents/:id/sections/:id", method: "GET", count: 3640, avg_latency_ms: 39, error_rate: 0.1 },
        { endpoint: "/v1/documents", method: "POST", count: 1284, avg_latency_ms: 2100, error_rate: 1.8 },
        { endpoint: "/v1/documents/:id", method: "DELETE", count: 627, avg_latency_ms: 115, error_rate: 0.5 },
      ],
      daily: [],
    },
    "90d": {
      range: "90d",
      total_requests: 132847,
      avg_per_day: 1476,
      peak_hour: "15:00 UTC",
      success_rate: 99.5,
      endpoints: [
        { endpoint: "/v1/query", method: "POST", count: 78420, avg_latency_ms: 252, error_rate: 0.5 },
        { endpoint: "/v1/documents", method: "GET", count: 24180, avg_latency_ms: 51, error_rate: 0.1 },
        { endpoint: "/v1/documents/:id/toc", method: "GET", count: 15240, avg_latency_ms: 44, error_rate: 0.3 },
        { endpoint: "/v1/documents/:id/sections/:id", method: "GET", count: 9870, avg_latency_ms: 40, error_rate: 0.1 },
        { endpoint: "/v1/documents", method: "POST", count: 3520, avg_latency_ms: 2000, error_rate: 2.1 },
        { endpoint: "/v1/documents/:id", method: "DELETE", count: 1617, avg_latency_ms: 118, error_rate: 0.6 },
      ],
      daily: [],
    },
  };

  const data = rangeData[range] || rangeData["30d"];

  return NextResponse.json(data);
}
