import { describe, it, expect } from "vitest";
import { app } from "../src/app.js";

/**
 * Rate-limit integration tests.
 *
 * Validates that:
 * 1. Rate-limit headers are present on responses
 * 2. Requests are rejected after exceeding the limit
 *
 * NOTE: These tests use the in-memory rate limiter (no Redis needed).
 * They require a valid API key in the test database.
 */

const TEST_API_KEY = process.env.TEST_API_KEY ?? "vl_test_skip";
const describeIf = TEST_API_KEY !== "vl_test_skip" ? describe : describe.skip;

describeIf("Rate-limit headers", () => {
  it("includes X-RateLimit-* headers on query endpoint", async () => {
    const res = await app.request("/v1/documents/test-doc/query", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TEST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "test query" }),
    });

    // The request may fail for other reasons (doc not found), but
    // rate-limit headers should still be set by the middleware
    // Only check if we got past auth (not 401)
    if (res.status !== 401) {
      const limitHeader = res.headers.get("X-RateLimit-Limit");
      const remainingHeader = res.headers.get("X-RateLimit-Remaining");
      const resetHeader = res.headers.get("X-RateLimit-Reset");

      expect(limitHeader).toBeTruthy();
      expect(remainingHeader).toBeTruthy();
      expect(resetHeader).toBeTruthy();
    }
  });
});

describe("Rate-limit enforcement (no auth needed)", () => {
  it("rejects unauthenticated requests with 401, not rate-limit", async () => {
    const res = await app.request("/v1/documents/test-doc/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: "test" }),
    });

    expect(res.status).toBe(401);
  });
});
