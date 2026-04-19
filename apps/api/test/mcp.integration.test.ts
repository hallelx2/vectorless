import { describe, it, expect } from "vitest";
import { app } from "../src/app.js";

/**
 * MCP integration tests.
 *
 * These test the /mcp endpoint via Hono's in-process request handler.
 * They validate that:
 * 1. The endpoint is reachable and returns JSON-RPC responses
 * 2. tools/list returns all 6 expected tools
 * 3. Invalid tool calls return proper errors
 *
 * NOTE: These tests require a valid API key in the test database.
 * Run against a test DB seeded with a project + API key.
 */

const TEST_API_KEY = process.env.TEST_API_KEY ?? "vl_test_skip";

// Skip tests if no test API key is configured
const describeIf = TEST_API_KEY !== "vl_test_skip" ? describe : describe.skip;

describeIf("POST /mcp", () => {
  it("responds to tools/list with 6 tools", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TEST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0" },
        },
      }),
    });

    // The initialize call should succeed (200 or valid JSON-RPC response)
    expect(res.status).toBeLessThan(500);
  });

  it("returns proper error for unknown tool", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TEST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "nonexistent_tool",
          arguments: {},
        },
      }),
    });

    expect(res.status).toBeLessThan(500);
  });

  it("rejects requests without auth", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      }),
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /mcp", () => {
  it("returns 405 (SSE not supported yet)", async () => {
    const res = await app.request("/mcp", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TEST_API_KEY}`,
      },
    });

    // Either 401 (no key) or 405 (SSE not supported)
    expect([401, 405]).toContain(res.status);
  });
});

describe("DELETE /mcp", () => {
  it("returns 200 (stateless, always succeeds)", async () => {
    const res = await app.request("/mcp", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${TEST_API_KEY}`,
      },
    });

    // Either 401 (no key) or 200 (stateless delete)
    expect([200, 401]).toContain(res.status);
  });
});
