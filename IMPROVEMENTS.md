# Vectorless Platform Improvements Roadmap

A PageIndex-inspired architecture for document retrieval through agentic reasoning over hierarchical document trees, replacing flat chunking and single-shot vector similarity with LLM-powered tree traversal.

---

## Tier 1 — Architectural Core

These are the foundational changes that transform Vectorless from flat section selection into a true PageIndex-style hierarchical tree search system. Everything else builds on this.

### 1. Hierarchical Tree Preservation

Stop flattening `NativeHeading.children` in the extract strategy. Store sections with `parentSectionId` and `level` to preserve the document's natural heading tree. The `ToCManifest` gets a tree variant (`ToCTreeManifest`) with nested `ToCTreeNode[]` that the LLM agent navigates.

- **Status:** Implemented
- **Impact:** Critical — enables tree traversal
- **Files:** `extract.strategy.ts`, `toc/index.ts`, shared types

---

### 2. Recursive Multi-Level Summarization

Bottom-up LLM summarization across the entire document tree. Leaf nodes get precision retrieval summaries (names entities, concepts, scope boundaries). Branch nodes get scope summaries synthesized from their children's summaries. The root gets a document-level summary. This creates the "multi-resolution map" — the LLM agent can grasp high-level themes at branch level without loading raw text.

- **Status:** Implemented
- **Impact:** Critical — makes tree navigation effective
- **Files:** `toc/summarize.ts`, `hybrid.strategy.ts`

---

### 3. Agentic Tree Traversal (Vercel AI SDK)

Replace the single-shot LLM call with a multi-step agent built on the Vercel AI SDK's `generateText` + `tools`. The agent iteratively calls six tools to navigate the document tree:

| Tool | Purpose |
|------|---------|
| `getRoots` | See top-level sections (called first) |
| `expandBranch` | Drill into a branch to see children |
| `getContent` | Retrieve leaf content (tracks token budget) |
| `getSiblings` | See adjacent sections for context |
| `searchTree` | Keyword search across all titles/summaries |
| `finish` | Signal completion with final reasoning |

This is the MCTS-style approach: the agent reasons about which branches to explore, drills down through levels, and retrieves content from relevant leaf nodes — producing a full reasoning trace at every step.

- **Status:** Implemented
- **Impact:** Critical — the core differentiator
- **Files:** `retrieval/tree-agent.ts`, `retrieval/model-selector.ts`, `routes/query.ts`

---

### 4. Reliable Page Ranges

Track page boundaries through the full pipeline including after section splitting. When a leaf is split, estimate proportional page ranges for each part rather than naively copying the parent's full range. For non-PDF formats, derive page-equivalent boundaries from character offsets.

- **Status:** Implemented (proportional estimation)
- **Impact:** High — accuracy for citations
- **Files:** `splitter/index.ts`

---

## Tier 2 — Retrieval Power

These build on the tree architecture to make retrieval smarter, faster, and more capable.

### 5. Confidence Scoring at Each Traversal Step

Already built into the agent tool parameters. The `getContent` tool requires a `confidence` parameter (0-1). The traversal trace records confidence at each step, enabling post-hoc analysis, low-confidence filtering, and retrieval quality monitoring.

- **Effort:** Done (built into agent)
- **Impact:** High

---

### 6. Token Budget-Aware Traversal

The agent is told its token budget in the system prompt and receives `tokens_remaining` after each `getContent` call. When the budget is exhausted, the agent calls `finish`. The `getContent` tool enforces a hard stop when budget would be exceeded.

- **Effort:** Done (built into agent)
- **Impact:** High

---

### 7. Parallel Branch Exploration

The Vercel AI SDK handles parallel tool calling automatically — if the LLM returns multiple `expandBranch` calls in one step, all execute concurrently. The system prompt encourages this: "You can call multiple tools in a single step to explore branches in parallel."

- **Effort:** Done (inherent in AI SDK)
- **Impact:** Medium

---

### 8. Cross-Document Tree Search

Fetch tree ToC manifests for all documents in a project and let the agent traverse multiple document trees in a single query. New endpoint: `POST /v1/query` (project-level) with `doc_ids[]` param. Agent gets a `listDocuments` tool that returns document titles and root-level summaries, then selects which documents to explore.

- **Effort:** Medium
- **Impact:** :fire::fire::fire:
- **Phase:** Next

---

### 9. Neighboring Section Inclusion

When retrieval selects a leaf section, the agent can call `getSiblings` to see adjacent sections at the same level. This provides structural context without the blunt overlap of traditional chunking. Particularly useful for sections that reference context established in the preceding section.

- **Effort:** Done (built into agent tools)
- **Impact:** Medium

---

### 10. Cross-Reference Following

Scan sections for "see Section X" or "as described in Chapter Y" patterns at ingest time and store them in the `crossReferences` JSONB column. Add a `followReferences` tool to the agent that fetches referenced sections alongside selected ones. This ensures the LLM has all the context a human reader would follow.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Next

---

### 11. Traversal Path Caching

Cache the mapping `(docId, queryHash) → sectionIds[]` in an LRU cache. Before running the full agent, check if a similar query has been seen. On cache miss, run agent and store result. This eliminates redundant LLM calls for repeated or similar queries.

- **Effort:** Low
- **Impact:** :fire::fire:
- **Phase:** Next

---

### 12. Adaptive Depth Control

Instead of a fixed `maxSteps`, classify query complexity and adjust the step budget automatically:
- Simple factual queries: 3-5 steps
- Multi-aspect queries: 8-12 steps
- Exploratory/survey queries: 15+ steps

The system prompt can analyze the query type and set traversal expectations.

- **Effort:** Low
- **Impact:** :fire:
- **Phase:** Next

---

## Tier 3 — Ingestion Quality

Improvements to parsing, extraction, and summary quality that feed into the tree.

### 13. VLM-Powered PDF Parsing

Send each PDF page as an image to Gemini Vision API for layout-aware extraction. Captures tables, headings inferred from visual hierarchy (font size, bold, positioning), images, and scanned/OCR documents that text-based parsers miss. ~$0.001 per page with Gemini Flash.

- **Effort:** Medium
- **Impact:** :fire::fire::fire:
- **Phase:** Next

---

### 14. Table-to-Structured Extraction

Detect tables via VLM and convert to markdown or HTML table format within section content. Preserves row, column, and header relationships so downstream LLMs can reason over tabular data accurately. Critical for financial, clinical, and legal documents.

- **Effort:** Medium
- **Impact:** :fire::fire::fire:
- **Phase:** Next

---

### 15. Image Description Generation

When sections contain images, charts, or figures, send them to a VLM and generate searchable text descriptions embedded in section content. Makes visual content discoverable through the tree search and gives LLMs meaningful context about figures.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Next

---

### 16. Contextual Summaries (Anthropic Technique)

Prepend document-level context to each section before generating summaries: "Here is a document about X. This section covers..." Drawn from Anthropic's Contextual Retrieval research (49% fewer missed retrievals). Now feeds directly into the recursive summarization pipeline — both leaf and branch summaries benefit.

- **Effort:** Low
- **Impact:** :fire::fire::fire:
- **Phase:** Next

---

### 17. Multi-Pass Self-Correction Parsing

Parse → validate → re-parse pipeline for problem areas. After initial extraction, check for content gaps, missing sections, and overlapping boundaries. Re-run with more specific prompts on detected failures. Inspired by Reducto's "Agentic OCR" approach.

- **Effort:** High
- **Impact:** :fire::fire:
- **Phase:** Future

---

### 18. Summary Validation Pipeline

After LLM generates a summary, validate automatically: check length (50-500 chars), verify entity coverage (≥60% of top noun phrases appear), reject vague language ("various", "several aspects"). Auto-regenerate summaries that fail. Ensures consistently high quality across the tree.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Future

---

## Tier 4 — Platform & SDK

### 19. MCP Server

Expose Vectorless as an MCP (Model Context Protocol) tool server so Claude Desktop, Cursor, Windsurf, and other MCP-compatible clients can use tree-aware document retrieval natively. Position Vectorless as a first-class tool in the agentic ecosystem.

- **Status:** In progress — local stdio + remote HTTP + OAuth code written, blocked on migration + consent screen + middleware wiring. See `docs/ISSUES.md`.
- **Effort:** Medium
- **Impact:** :fire::fire::fire:
- **Phase:** Launch-blocking (v1.0)
- **Implementation plan:** `docs/MCP_AND_AUTH_PLAN.md`
- **Open blockers:** `docs/ISSUES.md` (#1 migration, #2 consent screen, #5 stateless sessions, #6 adapter hardening)
- **Shipped:**
  - `packages/mcp-tools/` — shared tool definitions, schemas, handlers
  - `apps/mcp-stdio/` — local stdio server, publishes as `vectorless-mcp` on npm
  - `apps/api/src/routes/mcp.ts` + `services/mcp-server.ts` — remote HTTP MCP via Streamable HTTP transport
  - `apps/api/src/routes/oauth.ts` — full OAuth 2.1 provider (DCR, authorize, token, revoke, introspect, well-known metadata)
  - `apps/api/src/middleware/auth.ts` — unified bearer API key + OAuth JWT middleware
  - `oauth_clients`, `oauth_authorization_codes`, `oauth_refresh_tokens`, `oauth_consents`, `oauth_revoked_jtis` tables defined in `schema.ts`

---

### 20. Streaming Ingest Status via SSE

Server-Sent Events for real-time ingestion progress: "parsing... building tree... summarizing level 3... summarizing level 2... storing sections... ready". Replaces polling with push, enables responsive UIs showing recursive summarization progress.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Future

---

### 21. Document Re-processing

`client.reprocessDocument(docId, { tocStrategy: 'hybrid' })` to re-run ingestion with different parameters without re-uploading the file. Lets users upgrade documents when new parsing capabilities ship or experiment with different strategies.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Next

---

### 22. Framework Integrations

Pre-built integrations for LangChain, LlamaIndex, Vercel AI SDK, CrewAI, and AutoGen. Each integration provides idiomatic adapters (e.g., a LangChain Retriever wrapping `client.query()`, a Vercel AI SDK tool definition) so developers plug Vectorless into their existing AI stack.

- **Effort:** High
- **Impact:** :fire::fire::fire:
- **Phase:** Future

---

### 23. Streaming Query Endpoint

`POST /v1/documents/:id/query/stream` returns Server-Sent Events for each agent traversal step in real-time. Frontend can show the agent "thinking" — expanding branches, evaluating summaries, retrieving content — as it happens.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Future

---

### 24. Audit Logging with Full Traversal Traces

The agentic retrieval engine already produces `TraversalStep[]` traces recording every tool call, argument, result, and reasoning. Surface these in the dashboard as a visual tree explorer — show which branches the agent explored, which it skipped, and the exact path to each retrieved section.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Next

---

### 25. Rate Limiting Tiers

Tiered rate limits: free at 10 req/s, pro at 100 req/s, enterprise custom. Protects platform stability and creates upgrade paths. Separate limits for ingest (heavy) vs query (lighter) vs tree navigation (lightest).

- **Status:** In progress — plans config, middleware, and quota enforcement written but NOT wired to any route and still using in-memory store. See `docs/ISSUES.md` #3 and #4.
- **Effort:** Low
- **Impact:** :fire::fire: (hard prerequisite for opening the platform to the public)
- **Phase:** Launch-blocking (v1.0)
- **Implementation plan:** `docs/MCP_AND_AUTH_PLAN.md` §6
- **Shipped:**
  - `apps/api/src/config/plans.ts` — Free / Pro / Enterprise limits matching the plan
  - `apps/api/src/middleware/rate-limit.ts` — `rateLimitFor(kind)` factory (in-memory fallback)
  - `apps/api/src/middleware/quota.ts` — `quotaCheck(kind)` + `recordUsage()`
  - `user_plans` + `usage_records` tables defined in `schema.ts`
- **Remaining:**
  - Generate + apply migration for the two new tables (Blocker #1)
  - Wire `rateLimitFor` + `quotaCheck` to `query.ts`, `documents.ts`, `toc.ts`, `sections.ts`, `mcp.ts` (Blocker #3)
  - Swap in-memory store for `@upstash/ratelimit` (Blocker #4)
  - Record usage after successful queries + ingests
  - Build `dashboard/usage/page.tsx` (stub exists, needs real chart)

---

### 26. Multi-Tenant Project Isolation

Full project-level isolation with separate API keys, documents, and usage tracking per project. Lets agencies and SaaS platforms manage multiple customers from a single account.

- **Effort:** High
- **Impact:** :fire::fire:
- **Phase:** Future

---

### 27. Document Versioning

Support re-uploading new versions of a document while keeping old sections accessible and tracking version history. The tree structure makes diff-aware updates possible — only re-summarize branches that changed.

- **Effort:** High
- **Impact:** :fire::fire:
- **Phase:** Future

---

### 28. Edge Caching for Tree ToC

Cache tree ToC manifests at the CDN edge using Cloudflare Workers. Since tree ToCs rarely change after ingestion, they can be cached indefinitely with cache-busting on re-processing. Eliminates a database round-trip on every tree navigation request.

- **Effort:** Low
- **Impact:** :fire::fire:
- **Phase:** Next

---

## Phase Summary

| Phase | Focus | Items |
|-------|-------|-------|
| **Implemented** | Architectural core | 1, 2, 3, 4, 5, 6, 7, 9 |
| **Launch-blocking (v1.0)** | MCP + auth + guardrails | 19, 25 (both code-complete, wiring/migration/consent page outstanding — see `docs/ISSUES.md`) |
| **Next** | Retrieval depth + platform | 8, 10, 11, 12, 13, 14, 16, 21, 24, 28 |
| **Future** | Advanced quality + ecosystem | 15, 17, 18, 20, 22, 23, 26, 27 |

---

## Active launch blockers

See `docs/ISSUES.md` for the full audit. Ten blockers identified, ~2 focused days to clear:

1. 🔴 Missing Drizzle migration for 7 new tables (oauth_*, user_plans, usage_records)
2. 🔴 OAuth consent screen page does not exist in the dashboard
3. 🔴 Rate-limit / quota middleware is written but not wired to any route
4. 🟡 Rate-limit store is in-memory, not Upstash — breaks on serverless
5. 🟡 MCP sessions kept in process memory — serverless fragility
6. 🟡 Hand-rolled Node req/res mock in `handleMcpRequest` — needs tests
7. 🟡 DCR endpoint has no abuse protection
8. 🟢 No cleanup cron for `oauth_revoked_jtis`
9. 🟢 Missing env vars in `DEPLOYMENT.md`
10. 🟡 No integration tests for MCP / OAuth / rate-limit
