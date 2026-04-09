/**
 * Integration test: Tests the TypeScript SDK against the live Vectorless API.
 *
 * Run with:
 *   VECTORLESS_API_KEY=vl_xxx VECTORLESS_BASE_URL=http://localhost:3001 pnpm --filter=vectorless test -- __tests__/integration.test.ts
 *
 * Requires the API server to be running on localhost:3001.
 */

import { describe, it, expect } from "vitest";
import { VectorlessClient } from "../src/client.js";

const API_KEY = process.env.VECTORLESS_API_KEY ?? "";
const BASE_URL = process.env.VECTORLESS_BASE_URL ?? "http://localhost:3001";

const SAMPLE_DOC = `# TypeScript SDK Test Document

## 1. Introduction

This is a test document for the Vectorless TypeScript SDK integration tests.
It validates the full pipeline: upload, parse, ToC generation, section retrieval.

## 2. Web Frameworks

Modern web frameworks include:

- **Next.js**: React-based, supports SSR, SSG, and API routes. Built by Vercel.
- **Nuxt**: Vue.js framework with similar capabilities to Next.js.
- **SvelteKit**: Svelte-based with excellent performance characteristics.
- **Remix**: Full-stack React framework focused on web standards.
- **Astro**: Content-focused with multi-framework support and island architecture.

## 3. Database Technologies

Key database technologies for modern applications:

- **PostgreSQL**: Relational, supports JSONB, pgvector for embeddings, full-text search.
- **SQLite**: Embedded, serverless, increasingly popular with Turso and Litestream.
- **MongoDB**: Document-oriented, flexible schema, good for prototyping.
- **Redis**: In-memory key-value store, caching, pub/sub, queues.
- **Neon**: Serverless Postgres with branching, autoscaling, and pgvector support.

## 4. Deployment Platforms

Where to deploy modern applications:

- **Vercel**: Best for Next.js, edge functions, preview deployments.
- **Cloudflare Workers**: Edge computing, R2 storage, D1 database.
- **Fly.io**: Container-based, global deployment, good for backends.
- **Railway**: Simple PaaS, Postgres included, good DX.
`;

describe.skipIf(!API_KEY)("SDK Integration Tests", () => {
  const client = new VectorlessClient({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  let docId: string;

  it("should upload a document and get ready status", async () => {
    const result = await client.addDocument(Buffer.from(SAMPLE_DOC), {
      sourceType: "txt",
      tocStrategy: "extract",
      title: "TS SDK Test Doc",
    });

    expect(result.doc_id).toBeTruthy();
    docId = result.doc_id;
    console.log(`  ✅ Uploaded: ${docId}`);
  }, 60_000);

  it("should get document details", async () => {
    const doc = await client.getDocument(docId);
    expect(doc.status).toBe("ready");
    expect(doc.section_count).toBeGreaterThan(0);
    console.log(
      `  ✅ Status: ${doc.status}, Sections: ${doc.section_count}`
    );
  });

  it("should get Table of Contents", async () => {
    const toc = await client.getToC(docId);
    expect(toc.doc_id).toBe(docId);
    expect(toc.sections.length).toBeGreaterThan(0);
    console.log(`  ✅ ToC: ${toc.title} (${toc.sections.length} sections)`);
    for (const s of toc.sections) {
      console.log(`    - ${s.title}`);
    }
  });

  it("should fetch a single section", async () => {
    const toc = await client.getToC(docId);
    const sectionId = toc.sections[1]!.section_id;

    const section = await client.fetchSection(docId, sectionId);
    expect(section.section_id).toBe(sectionId);
    expect(section.content.length).toBeGreaterThan(0);
    console.log(
      `  ✅ Section: ${section.title} (${section.token_count} tokens)`
    );
  });

  it("should batch fetch multiple sections", async () => {
    const toc = await client.getToC(docId);
    if (toc.sections.length < 3) return;

    const ids = [
      toc.sections[1]!.section_id,
      toc.sections[2]!.section_id,
    ];

    const sections = await client.fetchSections(docId, ids);
    expect(sections.length).toBe(ids.length);
    console.log(`  ✅ Batch fetched ${sections.length} sections:`);
    for (const s of sections) {
      console.log(`    - ${s.title} (${s.token_count} tokens)`);
    }
  });

  it("should list documents", async () => {
    const result = await client.listDocuments();
    expect(result.documents.length).toBeGreaterThan(0);
    console.log(`  ✅ ${result.documents.length} document(s)`);
  });

  it("should delete the document", async () => {
    await client.deleteDocument(docId);
    console.log(`  ✅ Deleted: ${docId}`);

    // Verify it's gone
    const result = await client.listDocuments();
    const found = result.documents.find((d) => d.doc_id === docId);
    expect(found).toBeUndefined();
  });
});
