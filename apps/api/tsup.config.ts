import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  sourcemap: true,
  target: "es2022",
  platform: "node",
  // Don't bundle workspace packages or heavy deps — they resolve from node_modules at runtime
  noExternal: [],
  external: [
    "vectorless",
    "@vectorless/mcp-tools",
    "@vectorless/shared",
    "@modelcontextprotocol/sdk",
  ],
});
