import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      // Resolve workspace packages to their source so vitest
      // can process them without needing a prior build step
      "@vectorless/mcp-tools": path.resolve(
        __dirname,
        "../../packages/mcp-tools/src/index.ts"
      ),
      "@vectorless/shared": path.resolve(
        __dirname,
        "../../packages/shared/src/index.ts"
      ),
      vectorless: path.resolve(
        __dirname,
        "../../packages/ts-sdk/src/index.ts"
      ),
    },
  },
  test: {
    include: [
      "src/**/__tests__/**/*.test.ts",
      "test/**/*.test.ts",
    ],
    testTimeout: 30_000,
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
