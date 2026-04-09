# Vectorless Platform Improvements Roadmap

A comprehensive roadmap of enhancements for the Vectorless platform and SDK, informed by competitive analysis of leading document intelligence and retrieval-augmented generation solutions.

---

## Parsing & Extraction Improvements

### 1. VLM-Powered PDF Parsing

Send each PDF page as an image to Gemini Vision API for layout-aware extraction. This captures tables, headings inferred from visual hierarchy (font size, bold, positioning), images, and scanned/OCR documents that traditional text-based parsers miss entirely. At roughly $0.001 per page with Gemini Flash, this is cost-effective even at scale and dramatically improves extraction quality for complex layouts.

- **Effort:** Medium
- **Impact:** :fire::fire::fire:
- **Phase:** Phase 2

---

### 2. Table-to-Structured Extraction

Detect tables via VLM and convert them to markdown or HTML table format within section content. This preserves row, column, and header relationships so downstream LLMs can reason over tabular data accurately. Critical for clinical guidelines, financial documents, and legal contracts where tables carry the most important information.

- **Effort:** Medium
- **Impact:** :fire::fire::fire:
- **Phase:** Phase 2

---

### 3. Image Description Generation

When sections contain images, charts, or figures, send them to a VLM and generate searchable text descriptions embedded in section content. For example: "[Figure 3: Dose-response curve showing systolic BP reduction across ACE inhibitor dosages]". This makes visual content discoverable through text-based retrieval and gives LLMs meaningful context about figures they cannot see.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 2

---

### 4. Multi-pass Self-Correction

Implement a parse, validate, re-parse pipeline for problem areas. After initial extraction, check for content gaps, missing sections, and overlapping boundaries. Re-run with more specific prompts on detected failures. Inspired by Reducto's "Agentic OCR" approach, this closes the quality gap on messy or inconsistent documents without requiring manual intervention.

- **Effort:** High
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

## Summary & ToC Quality Improvements

### 5. Contextual Summaries

Prepend document-level context to each section before generating summaries: "Here is a document about X. This section covers..." This technique, drawn from Anthropic's Contextual Retrieval research, ensures summaries carry enough context to be meaningful in isolation during retrieval. Anthropic demonstrated 49% fewer missed retrievals with this approach.

- **Effort:** Low
- **Impact:** :fire::fire::fire:
- **Phase:** Phase 2

---

### 6. Hierarchical Nested ToC

The current ToC is a flat list of sections. It should nest sections under their parents (e.g., 3.1 and 3.2 under Section 3) to reflect the document's true structure. This gives LLMs clearer structural navigation when reasoning about which sections to select, and improves the user-facing document outline in the dashboard.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 2

---

### 7. Confidence Scores per Section

Score each section from 0 to 1 based on multiple quality signals: character overlap between source text and parsed content, summary term coverage, and heading detection confidence. Surface these scores in the dashboard so users can monitor ingestion quality at a glance and identify sections that may need re-processing.

- **Effort:** Medium
- **Impact:** :fire:
- **Phase:** Phase 3

---

### 8. Summary Validation Pipeline

After the LLM generates a summary, validate it automatically: check length (50-500 characters), verify entity coverage (at least 60% of top noun phrases appear in the summary), and reject vague language ("various", "several aspects", "different things"). Auto-regenerate summaries that fail validation. This ensures consistently high summary quality without manual review.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

## Retrieval Improvements

### 9. Neighboring Section Inclusion

When retrieval selects a section, optionally include adjacent sections (before and after) in the response. This is analogous to overlap in traditional chunking but operates at the semantic section level. Configurable via the SDK with `include_neighbors: true`. Particularly useful for sections that reference context established in the preceding section.

- **Effort:** Low
- **Impact:** :fire::fire:
- **Phase:** Phase 2

---

### 10. Cross-Reference Following

Scan sections for "see Section X" patterns at ingest time and store them as `cross_references` in JSONB. At retrieval time, optionally fetch referenced sections alongside selected ones when `follow_references: true` is set. This ensures the LLM has all the context a human reader would follow via cross-references, without requiring additional retrieval calls.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

### 11. Cross-Document Retrieval

Fetch ToC manifests for all documents in a project and concatenate them into a single multi-document manifest. The LLM then reasons across all documents simultaneously to select the most relevant sections regardless of which document they belong to. This unlocks multi-document question answering and comparative analysis use cases.

- **Effort:** High
- **Impact:** :fire::fire::fire:
- **Phase:** Phase 3

---

### 12. Token Budget Management

Expose a `max_tokens` parameter on `fetchSections` in the SDK. If the combined content of selected sections exceeds the token budget, return sections in priority order and truncate at the budget limit. This gives developers precise control over how much context is passed to the LLM, preventing context window overflows and managing costs.

- **Effort:** Low
- **Impact:** :fire::fire:
- **Phase:** Phase 2

---

## SDK Improvements

### 13. Streaming Ingest Status

Instead of polling for document readiness, support Server-Sent Events (SSE) or WebSocket connections for real-time ingestion progress updates. Clients receive a stream of status events: "parsing... generating ToC... storing sections... ready". This improves developer experience and enables responsive UIs that show ingestion progress in real time.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

### 14. Document Re-processing

Add `client.reprocessDocument(docId, { tocStrategy: 'hybrid' })` to re-run ingestion with different strategy parameters without re-uploading the file (the original file persists in R2). This lets users experiment with different parsing strategies, upgrade documents when new parsing capabilities ship, and recover from ingestion issues without friction.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 2

---

### 15. Bulk Upload

Add `client.addDocuments(files[])` to upload multiple documents at once with shared options. This reduces boilerplate for onboarding large document collections, enables parallel processing on the backend, and provides a single callback or promise for the entire batch.

- **Effort:** Low
- **Impact:** :fire:
- **Phase:** Phase 2

---

### 16. Section Search

Add `client.searchSections(docId, query, { topK: 5 })` for direct vector similarity search when embeddings are enabled (hybrid mode). This provides a lower-level retrieval primitive for developers who want to bypass ToC-based reasoning and go straight to semantic search, or combine both approaches in a custom retrieval pipeline.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

### 17. Usage & Analytics API

Add `client.getUsage()` to return query count, document count, section count, and popular queries. This gives developers programmatic access to usage data for monitoring, billing reconciliation, and understanding how their end users interact with the document retrieval system.

- **Effort:** Low
- **Impact:** :fire:
- **Phase:** Phase 3

---

### 18. Webhook Notifications

Allow users to register a webhook URL to receive POST notifications when document ingestion completes. This replaces polling-based readiness checks with a push model, simplifying integration with backend systems, CI/CD pipelines, and event-driven architectures.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

### 19. TypeScript SDK: Framework Integrations

Ship pre-built integrations for LangChain, LlamaIndex, Vercel AI SDK, and MCP (Model Context Protocol) for Claude/Cursor. Each integration provides idiomatic adapters (e.g., a LangChain Retriever, a Vercel AI SDK tool) so developers can plug Vectorless into their existing AI stack with minimal wiring.

- **Effort:** High
- **Impact:** :fire::fire::fire:
- **Phase:** Phase 3

---

### 20. Python SDK: Framework Integrations

Ship pre-built integrations for LangChain, LlamaIndex, CrewAI, and AutoGen. The Python ecosystem is the primary home for AI/ML development, and native framework support removes the biggest adoption barrier for data scientists and ML engineers evaluating Vectorless against alternatives.

- **Effort:** High
- **Impact:** :fire::fire::fire:
- **Phase:** Future

---

## Platform Improvements

### 21. MCP Server

Expose Vectorless as an MCP (Model Context Protocol) tool server so Claude Desktop, Cursor, Windsurf, and other MCP-compatible clients can use it natively for document retrieval. This positions Vectorless as a first-class tool in the emerging agent ecosystem, where AI assistants discover and call tools via MCP without custom integration code.

- **Effort:** Medium
- **Impact:** :fire::fire::fire:
- **Phase:** Phase 2

---

### 22. Rate Limiting Tiers

Implement tiered rate limits based on pricing plan: free tier at 10 requests/second, pro at 100 requests/second, and enterprise with custom limits. This protects platform stability, enables fair usage enforcement, and creates a clear upgrade path when developers hit limits.

- **Effort:** Low
- **Impact:** :fire:
- **Phase:** Phase 2

---

### 23. Multi-Tenant Project Isolation

Provide full project-level isolation with separate API keys, documents, and usage tracking per project. This lets agencies and SaaS platforms manage multiple end customers from a single Vectorless account while ensuring data separation, independent billing, and per-project access control.

- **Effort:** High
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

### 24. Audit Logging

Log every retrieval operation with a full trace: query received, ToC manifest sent to LLM, LLM reasoning output, sections selected, and response returned. Make these traces visible in the dashboard. This is essential for debugging retrieval quality, compliance requirements, and understanding why the system selected specific sections.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

### 25. Document Versioning

Support re-uploading a new version of a document while keeping old sections accessible and tracking version history. This enables workflows where documents are updated regularly (policies, guidelines, contracts) and users need to query either the latest version or a specific historical version.

- **Effort:** High
- **Impact:** :fire::fire:
- **Phase:** Future

---

## Infrastructure Improvements

### 26. Edge Caching

Cache ToC manifests at the CDN edge using Cloudflare Workers. Since ToC manifests rarely change after ingestion, they can be cached indefinitely with cache-busting triggered only on re-processing. This eliminates a database round-trip on every retrieval request and reduces latency for globally distributed users.

- **Effort:** Low
- **Impact:** :fire::fire:
- **Phase:** Phase 2

---

### 27. Batch Embedding Pipeline

When `embed_sections: true` is configured, batch-embed all sections with built-in rate limiting and retry logic. Use the OpenAI batch API for significant cost savings on large document collections. This makes embedding thousands of sections reliable and cost-effective rather than fragile and expensive.

- **Effort:** Medium
- **Impact:** :fire::fire:
- **Phase:** Phase 3

---

### 28. pgvector HNSW Indexes

Switch from IVFFlat to HNSW indexes in pgvector for better recall at scale. HNSW provides consistently higher recall without requiring periodic re-indexing as the dataset grows. Auto-create the index when the first embedding is stored so developers get optimal performance without manual database configuration.

- **Effort:** Low
- **Impact:** :fire::fire:
- **Phase:** Phase 2

---

## Phase Summary

| Phase | Focus | Items |
|-------|-------|-------|
| **Phase 2** | Core quality and quick wins | 1, 2, 3, 5, 6, 9, 12, 14, 15, 21, 22, 26, 28 |
| **Phase 3** | Advanced retrieval, SDK depth, and platform maturity | 4, 7, 8, 10, 11, 13, 16, 17, 18, 19, 23, 24, 27 |
| **Future** | Ecosystem expansion | 20, 25 |
