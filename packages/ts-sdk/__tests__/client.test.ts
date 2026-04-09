import { describe, it, expect } from "vitest";
import { VectorlessClient } from "../src/client.js";

describe("VectorlessClient", () => {
  it("should throw if no API key is provided", () => {
    const originalEnv = process.env.VECTORLESS_API_KEY;
    delete process.env.VECTORLESS_API_KEY;

    expect(() => new VectorlessClient()).toThrow(
      "Vectorless API key is required"
    );

    if (originalEnv) {
      process.env.VECTORLESS_API_KEY = originalEnv;
    }
  });

  it("should create client with API key", () => {
    const client = new VectorlessClient({ apiKey: "vl_test_key" });
    expect(client).toBeInstanceOf(VectorlessClient);
  });

  it("should create client with custom base URL", () => {
    const client = new VectorlessClient({
      apiKey: "vl_test_key",
      baseUrl: "http://localhost:3001",
    });
    expect(client).toBeInstanceOf(VectorlessClient);
  });
});
