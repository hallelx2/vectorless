# Vectorless — Full Product Documentation

**Version:** 1.0  
**Status:** Internal — Design & Architecture Phase  
**Last Updated:** April 2025

---

# Table of Contents

1. [Product Overview](#1-product-overview)
2. [The Problem We Are Solving](#2-the-problem-we-are-solving)
3. [The Vectorless Approach](#3-the-vectorless-approach)
4. [System Architecture](#4-system-architecture)
5. [The Ingest Pipeline](#5-the-ingest-pipeline)
6. [The Document Map (ToC Manifest)](#6-the-document-map-toc-manifest)
7. [Sections & Addressability](#7-sections--addressability)
8. [Retrieval Strategies](#8-retrieval-strategies)
9. [The Query Flow](#9-the-query-flow)
10. [Database Design](#10-database-design)
11. [The SDK](#11-the-sdk)
12. [Infrastructure Stack](#12-infrastructure-stack)
13. [What Vectorless Does Not Do](#13-what-vectorless-does-not-do)
14. [Roadmap](#14-roadmap)
15. [Key Design Decisions & Rationale](#15-key-design-decisions--rationale)
16. [Glossary](#16-glossary)

---

# 1. Product Overview

## What is Vectorless?

Vectorless is a document retrieval platform. It takes any document — a PDF, a Word file, a plain text file, a URL, a knowledge base — and turns it into a structured, queryable system that a language model can navigate by reasoning.

The core promise is simple: **turn literally anything into a structured system and query it immediately.**

## Who is it for?

Vectorless is built for developers building applications on top of large language models — RAG pipelines, document Q&A systems, AI assistants, research tools, legal tech, clinical decision support, enterprise knowledge bases. Anyone who needs to retrieve information from documents accurately and at scale.

## What makes it different?

Every other retrieval system works by destroying documents first — splitting them into chunks, converting chunks to numbers (vectors), storing those numbers in a database, and finding the nearest numbers at query time. This works, but it has deep structural problems that stem from the chunking step itself.

Vectorless does not chunk. It reads. It preserves the structure a document already has, turns that structure into a navigable map, and lets a language model reason its way to exactly the section it needs. Retrieval becomes navigation, not math.

---

# 2. The Problem We Are Solving

## The Standard RAG Pipeline

Retrieval-Augmented Generation (RAG) is the dominant pattern for building LLM applications over documents. The standard pipeline works like this:

1. Take a document
2. Split it into fixed-size chunks (e.g., 500 tokens with 50-token overlap)
3. Convert each chunk into a vector embedding (a list of ~1500 numbers)
4. Store those vectors in a vector database
5. At query time, embed the user's question
6. Find the chunks whose vectors are closest to the question vector
7. Pass those chunks to an LLM as context
8. Get an answer

This pipeline is widely used and works reasonably well for simple cases. But it has fundamental failure modes that come from a single root cause: **chunking is artificial.**

## The Chunking Problem

Documents have structure. A research paper has sections. A contract has clauses. A clinical guideline has chapters. A textbook has chapters with subsections. This structure is not decorative — it is how meaning is organized.

When you split a document at a fixed token count, you ignore all of this structure entirely. The result:

**Problem 1 — Fragmented meaning.** A single coherent idea — an argument, a finding, a definition — may be split across two chunks. Neither chunk is independently useful. The LLM receives half a thought.

**Problem 2 — Context loss at boundaries.** A chunk retrieved in isolation has no awareness of what comes before or after it. A sentence that only makes sense in the context of the previous paragraph is retrieved without that paragraph.

**Problem 3 — Structure blindness.** The chunker cannot distinguish between the end of one section and the beginning of another. A retrieved chunk might contain the last two sentences of the methodology section and the first two sentences of the results section. It belongs to neither.

**Problem 4 — Overlap is a workaround, not a fix.** Sliding window overlap (including some tokens from the previous chunk) reduces boundary problems but does not eliminate them and inflates storage and compute cost.

## The Embedding Representation Problem

Embeddings are compressed representations. A section of text with 1000 tokens is compressed into a vector of 1536 numbers. Information is lost in this compression. Concepts that appear rarely in a section, or that are expressed in language that is semantically distant from the query's phrasing, may not survive the compression with enough signal to rank highly.

This is why RAG systems routinely retrieve technically-relevant chunks that do not actually answer the question, and miss chunks that would have answered it perfectly.

## The Interpretability Problem

When a RAG system gives a wrong or incomplete answer, debugging it is hard. Which chunks were retrieved? Why were those chunks ranked above others? Did the embedding model misrepresent the question? Was the right information present in the document at all?

Vector similarity is a black box. There is no human-readable explanation for why chunk A ranked higher than chunk B. This makes RAG systems difficult to debug, difficult to audit, and difficult to trust in high-stakes applications.

## The Summary

The fundamental issue with conventional RAG is that it treats retrieval as a mathematical problem — find the nearest point in a high-dimensional space. Language models are not optimized to convert questions into vectors that land near the right answers. They are optimized to reason, to read, to understand context, and to make decisions. Vectorless uses them for what they are actually good at.

---

# 3. The Vectorless Approach

## The Core Idea

Instead of destroying document structure, preserve it. Instead of chunking, use the document's own sections as the unit of retrieval. Instead of vector similarity, use LLM reasoning.

**Vectorless turns documents into navigable APIs.**

Every document processed by Vectorless becomes:
- A set of addressable sections, each stored independently and fetchable by ID
- A structured document map — a table of contents with titles, summaries, and direct retrieval links for every section

At query time, this document map is handed to an LLM. The LLM reads the titles and summaries — exactly as a human expert would scan a table of contents — and decides which sections are relevant to the question. It returns a list of section IDs. Vectorless fetches those sections in parallel and returns the full text. The LLM synthesizes an answer from complete, structurally coherent source material.

## The Analogy: llms.txt

A useful analogy is the emerging `llms.txt` standard — a convention for making websites LLM-navigable by exposing a structured, human-readable index of their content at a known URL. An LLM visiting a site with `llms.txt` can understand the site's structure without crawling every page.

Vectorless applies the same principle to arbitrary documents. Every document gets an `llms.txt`-style map, and retrieval becomes link resolution rather than vector search.

## What Changes

| | Conventional RAG | Vectorless |
|---|---|---|
| Retrieval unit | Arbitrary chunk | Natural section |
| Retrieval mechanism | Vector similarity | LLM reasoning |
| Document structure | Discarded | Preserved |
| Multi-section retrieval | Multiple queries | Parallel fetch |
| Auditability | Black box | Every choice traceable |
| Embedding required | Yes | No (optional in hybrid mode) |

---

# 4. System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CALLER APPLICATION                  │
│  (your LLM app, RAG pipeline, agent, chatbot, etc.)     │
└───────────────────────────┬─────────────────────────────┘
                            │
                  Vectorless SDK / REST API
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼─────┐     ┌──────▼──────┐   ┌──────▼──────┐
    │  Ingest  │     │  Document   │   │  Section    │
    │ Pipeline │     │   Storage   │   │  Retrieval  │
    │          │     │  (Postgres) │   │    API      │
    └────┬─────┘     └──────┬──────┘   └──────┬──────┘
         │                  │                  │
         └──────────────────▼──────────────────┘
                       Postgres DB
                  ┌────────────────────┐
                  │  documents table   │
                  │  sections table    │
                  │  pgvector (opt.)   │
                  └────────────────────┘
```

## Two Core Operations

Everything in Vectorless reduces to two operations:

**1. Ingest** — You give Vectorless a document. It processes it, builds the document map, stores all sections, and gives you back a document ID and the map.

**2. Retrieve** — You give Vectorless a document ID and one or more section IDs. It gives you back the full text of those sections.

The LLM reasoning that decides which sections to retrieve happens outside of Vectorless, in your application. Vectorless does not make LLM calls at query time. It is a pure storage and retrieval layer.

---

# 5. The Ingest Pipeline

## What Happens When You Add a Document

When `addDocument` is called, the following pipeline executes:

### Step 1 — Source Parsing

The raw document is parsed based on its type:

- **PDF** — Text is extracted page by page. If the PDF has a native bookmark/outline tree (most professional documents do), it is extracted as the foundation for the ToC.
- **DOCX** — The heading hierarchy is extracted (Heading 1, Heading 2, etc.) using the document's XML structure.
- **TXT / Markdown** — Heading patterns (`#`, `##`, `===`, `---`) are detected.
- **URL** — The page is fetched and the HTML heading structure is parsed.

### Step 2 — Table of Contents Generation

Depending on the `toc_strategy` option, one of three approaches is used:

**`extract`** — The native structure of the document is used directly. Section titles come from the document's own headings or bookmark tree. Summaries are generated from the opening paragraph of each section. This is the fastest strategy and the most faithful to the document's intended organization.

**`generate`** — The document content is passed to an LLM which reads it and produces a semantic table of contents from scratch. The LLM identifies logical groupings of content, names each group, and writes a descriptive summary. Used for documents with no headings — transcripts, narrative reports, scraped content.

**`hybrid`** — Native headings are used for section titles and boundaries. An LLM reads each section and writes a precision summary optimized for reasoning-based retrieval. Best for partially structured documents where headings exist but are not descriptive enough for the LLM to reason from.

### Step 3 — Section Splitting

The document is split at the boundaries identified in the ToC. Each section is a complete, self-contained text unit that begins where a structural boundary begins and ends where the next one starts. No overlap. No arbitrary cutoffs.

### Step 4 — Storage

Each section is written to the `sections` table with:
- Its unique ID
- Parent document ID
- Title and summary
- Full content text
- Page range
- Order index (its position in the document)
- Optionally: a vector embedding (if `embed_sections: true`)

The document map is assembled and written to the `documents` table as a JSONB column.

### Step 5 — Return

The caller receives:
```
{ doc_id, toc }
```

`doc_id` is the permanent identifier for this document. `toc` is the full document map — the artifact that gets handed to an LLM at query time.

---

# 6. The Document Map (ToC Manifest)

## What It Is

The document map is a JSON structure that represents the complete navigable index of a document. It is the central artifact of Vectorless. Everything else — retrieval, reasoning, auditing — flows from it.

It is conceptually equivalent to a table of contents, but designed to be read and reasoned over by a language model rather than by a human.

## Structure

```json
{
  "doc_id": "f3a9c1b2",
  "title": "Clinical Guidelines for Hypertension Management",
  "source_type": "pdf",
  "section_count": 18,
  "created_at": "2025-04-08T10:22:00Z",
  "sections": [
    {
      "section_id": "f3a9c1b2-s1",
      "title": "1. Introduction and Scope",
      "summary": "Defines the target population, purpose, and clinical scope of these guidelines.",
      "page_range": { "start": 1, "end": 3 },
      "link": "https://yourapi.com/documents/f3a9c1b2/sections/f3a9c1b2-s1"
    },
    {
      "section_id": "f3a9c1b2-s2",
      "title": "2. Diagnostic Criteria",
      "summary": "Blood pressure thresholds, classification stages, and measurement protocols.",
      "page_range": { "start": 4, "end": 9 },
      "link": "https://yourapi.com/documents/f3a9c1b2/sections/f3a9c1b2-s2"
    },
    {
      "section_id": "f3a9c1b2-s3",
      "title": "3. First-Line Treatment Options",
      "summary": "Recommended antihypertensive drug classes, dosing ranges, and selection criteria by patient profile.",
      "page_range": { "start": 10, "end": 16 },
      "link": "https://yourapi.com/documents/f3a9c1b2/sections/f3a9c1b2-s3"
    }
  ]
}
```

## Why Summaries Matter

The `summary` field is what the LLM reads to decide whether a section is relevant. A good summary is precise and concept-rich — it names the specific topics, methods, entities, or claims the section contains. A bad summary is vague — "This section covers treatment" tells the LLM nothing useful.

The quality of summaries is the single most important factor in retrieval accuracy. This is why `toc_strategy: 'hybrid'` exists — even for documents with native headings, LLM-written summaries significantly outperform auto-generated ones.

---

# 7. Sections & Addressability

## What is a Section?

A section is the atomic unit of retrieval in Vectorless. It is a semantically complete division of a document — a chapter, a headed subsection, a numbered clause, a named entry in a reference document.

The critical difference from a chunk:

- A **chunk** is defined by a token count. It ends because the counter ran out.
- A **section** is defined by meaning. It ends because the document says a new idea is beginning.

## Section Storage Schema

Each section is stored as a row in the `sections` table:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique section identifier |
| `doc_id` | UUID | Parent document |
| `title` | Text | Section heading |
| `summary` | Text | Semantic summary for LLM reasoning |
| `content` | Text | Full section text — returned on fetch |
| `page_range` | JSONB | `{ "start": 4, "end": 9 }` |
| `order_index` | Integer | Position in document, used for ordering results |
| `embedding` | Vector(1536) | Optional. Computed and stored only if `embed_sections: true` |
| `created_at` | Timestamp | Ingest timestamp |

## How Links Are Generated

Every section gets a deterministic retrieval link at ingest time. The link is constructed from the base API URL, the document ID, and the section ID:

```
https://{base_url}/documents/{doc_id}/sections/{section_id}
```

Example:
```
https://api.vectorless.dev/documents/f3a9c1b2/sections/f3a9c1b2-s3
```

This link is:
- **Stable** — it does not change after ingest
- **Deterministic** — given doc_id and section_id, the link is always the same
- **Auditable** — the link itself tells you which document and section it points to
- **Directly callable** — an HTTP GET on this URL returns the section content

When the LLM is given the document map, it receives these links as part of each section entry. The LLM selects links by reasoning and the SDK resolves them.

---

# 8. Retrieval Strategies

## Vectorless (Primary)

The default retrieval mode. No embeddings used at query time.

The document map is passed to an LLM. The LLM reads section titles and summaries and selects the relevant section IDs. The SDK fetches those sections in parallel. The LLM receives complete, structured section text as context.

**Best for:**
- Documents with clear structure and meaningful headings
- Precise, specific queries
- High-stakes applications where auditability matters
- Environments where you want to minimize embedding API costs

**Limitation:** If a document's sections have poor titles or vague summaries, the LLM may not select the right ones. This is addressed by using `toc_strategy: 'hybrid'` at ingest time.

---

## Hybrid (Vectorless + Vector)

Both retrieval paths run simultaneously:
- The LLM reasons over the ToC manifest and returns section IDs
- A pgvector similarity search over section embeddings returns top-k sections

Results from both paths are merged and deduplicated. The union is fetched and passed to the synthesizing LLM.

```
User query
    │
    ├─── LLM reasons over ToC ──────────► [s2, s5, s9]
    │
    └─── Vector similarity search ──────► [s3, s5, s7]
                                                │
                                    Merge + deduplicate
                                                │
                                        [s2, s3, s5, s7, s9]
                                                │
                                    Fetch all in parallel
                                                │
                                    Return to synthesizing LLM
```

**Best for:**
- Documents with poor or absent structure
- Broad or vague queries
- Maximum recall requirements

**Requirement:** `embed_sections: true` must be set at ingest time.

---

## Vector Only

Disables ToC reasoning. Retrieval is purely embedding-based. Available for backward compatibility or direct comparison with conventional RAG.

---

# 9. The Query Flow

## Full End-to-End Flow

```
1. User sends a question to your application

2. Your application calls vectorless.getToC(doc_id)
   → Receives the document map

3. Your application passes the document map + question to an LLM
   Prompt instructs the LLM to return relevant section_ids as JSON

4. LLM reads the map, reasons, returns:
   ["f3a9c1b2-s3", "f3a9c1b2-s7"]

5. Your application calls vectorless.fetchSections(doc_id, selectedIds)
   → Both sections fetched in parallel
   → Returns full section text for each

6. Your application assembles context from returned sections

7. Your application calls LLM again with context + original question
   → LLM synthesizes a grounded answer

8. Answer returned to user
```

## Parallel Fetching

When the LLM selects multiple sections, all fetches happen concurrently. There is no sequential resolution. Whether the LLM selects 1 section or 10, the wall-clock time for the fetch step is the time of a single database read. This eliminates the latency penalty that would otherwise make multi-section retrieval impractical.

## What Vectorless Handles vs. What the Caller Handles

| Responsibility | Handled By |
|---|---|
| Document parsing | Vectorless |
| ToC generation | Vectorless |
| Section storage | Vectorless |
| Link generation | Vectorless |
| Parallel section fetching | Vectorless |
| LLM reasoning over the map | Caller |
| Prompt construction | Caller |
| Answer synthesis | Caller |
| Conversation state | Caller |
| LLM provider selection | Caller |

This boundary is intentional. Vectorless is a retrieval primitive. It does not couple to a specific LLM, a specific prompt format, or a specific orchestration framework. The caller owns everything above the retrieval layer.

---

# 10. Database Design

## Why Postgres

Postgres is the only database Vectorless requires. It handles all three storage needs in one place:

- **JSONB** for document maps — flexible, queryable, indexable without a schema migration for every document type
- **Text** for section content — plain and efficient
- **pgvector** for optional embeddings — no separate vector database required for hybrid mode
- **Full-text search** built in — available as an additional retrieval signal without extra infrastructure

## Schema

### documents table

```sql
CREATE TABLE documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  source_type  TEXT NOT NULL,         -- 'pdf' | 'docx' | 'txt' | 'url'
  toc          JSONB NOT NULL,        -- full document map
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for querying into the JSONB map
CREATE INDEX idx_documents_toc ON documents USING GIN (toc);
```

### sections table

```sql
CREATE TABLE sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id       UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  summary      TEXT,
  content      TEXT NOT NULL,
  page_range   JSONB,                 -- { "start": 4, "end": 9 }
  order_index  INTEGER NOT NULL,
  embedding    VECTOR(1536),          -- NULL unless embed_sections: true
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for fast section lookup by document
CREATE INDEX idx_sections_doc_id ON sections(doc_id);

-- Index for ordered retrieval within a document
CREATE INDEX idx_sections_order ON sections(doc_id, order_index);

-- Index for vector similarity search (hybrid mode)
CREATE INDEX idx_sections_embedding
  ON sections USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

## JSONB for the Document Map

The entire ToC manifest is stored as a JSONB column on the documents row. This means:

- The full document map is retrieved in a single query
- No JOIN across tables is needed to get the map for a document
- New fields can be added to the manifest without schema migrations
- The JSONB can be queried directly — e.g., find all documents with a section titled "Methodology"

---

# 11. The SDK

## Philosophy

The SDK is a focused infrastructure layer. It exposes exactly what is needed to ingest documents and retrieve sections. Nothing more. It does not include:

- LLM client wrappers
- Prompt templates
- Conversation management
- Answer generation
- Orchestration logic

This makes it composable with any LLM provider, any agent framework (LangGraph, CrewAI, LlamaIndex, custom), and any application architecture.

## SDK Methods

---

### `vectorless.addDocument(source, options?)`

Ingests a document. Runs the full ingest pipeline. Returns the document ID and the document map.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `source` | `Buffer \| string \| URL` | Yes | The document. Accepts file buffer, file path, or URL. |
| `options.source_type` | `'pdf' \| 'docx' \| 'txt' \| 'url'` | No | Document format. Auto-detected if omitted. |
| `options.toc_strategy` | `'extract' \| 'generate' \| 'hybrid'` | No | Default: `'extract'`. How to build the ToC. |
| `options.embed_sections` | `boolean` | No | Default: `false`. Compute and store embeddings for hybrid mode. |
| `options.title` | `string` | No | Override the document title. |

**Returns:** `{ doc_id: string, toc: ToCManifest }`

```typescript
const { doc_id, toc } = await vectorless.addDocument(file, {
  source_type: 'pdf',
  toc_strategy: 'extract',
});
```

---

### `vectorless.getToC(doc_id)`

Retrieves the document map for a previously ingested document.

**Parameters:** `doc_id: string`

**Returns:** `ToCManifest`

```typescript
const toc = await vectorless.getToC('f3a9c1b2');
```

---

### `vectorless.fetchSection(doc_id, section_id)`

Fetches the full content of a single section.

**Parameters:** `doc_id: string`, `section_id: string`

**Returns:** `Section`

```typescript
const section = await vectorless.fetchSection('f3a9c1b2', 'f3a9c1b2-s3');
// { section_id, title, content, page_range, order_index }
```

---

### `vectorless.fetchSections(doc_id, section_ids[])`

Fetches multiple sections in parallel. Primary retrieval method. All fetches are concurrent. Results are returned in document order.

**Parameters:** `doc_id: string`, `section_ids: string[]`

**Returns:** `Section[]`

```typescript
const sections = await vectorless.fetchSections('f3a9c1b2', [
  'f3a9c1b2-s2',
  'f3a9c1b2-s5',
  'f3a9c1b2-s9',
]);
```

---

### `vectorless.listDocuments()`

Returns a summary of all ingested documents.

**Returns:** `DocumentSummary[]`

```typescript
const docs = await vectorless.listDocuments();
// [{ doc_id, title, source_type, section_count, created_at }]
```

---

### `vectorless.deleteDocument(doc_id)`

Permanently removes a document and all its sections. This operation cascades — all section records and embeddings for this document are deleted.

**Parameters:** `doc_id: string`

**Returns:** `void`

```typescript
await vectorless.deleteDocument('f3a9c1b2');
```

---

## REST API Equivalent

Every SDK method has a corresponding REST endpoint for non-JavaScript environments or direct HTTP access:

| Operation | Method | Endpoint |
|---|---|---|
| Add document | `POST` | `/documents` |
| Get document map | `GET` | `/documents/:doc_id/toc` |
| Fetch section | `GET` | `/documents/:doc_id/sections/:section_id` |
| List documents | `GET` | `/documents` |
| Delete document | `DELETE` | `/documents/:doc_id` |

Section links in the document map point directly to the `GET /documents/:doc_id/sections/:section_id` endpoint. Calling a link returns the section content.

---

# 12. Infrastructure Stack

## Recommended Stack

| Layer | Technology | Reason |
|---|---|---|
| Primary database | Postgres | JSONB, pgvector, full-text search in one place |
| Managed Postgres | Supabase | pgvector out of the box, storage layer, auto-generated REST |
| Vector extension | pgvector | No separate vector DB needed |
| Raw document storage | Supabase Storage / S3 / R2 | Cheap object storage for original files |
| SDK runtime | TypeScript / Node.js | Primary language |
| Python bindings | Planned | Phase 2 |
| Embedding model | `text-embedding-3-small` (OpenAI) | Cost-efficient, strong performance |
| ToC generation LLM | Claude claude-sonnet-4-20250514 | Best instruction-following for structured output |

## Supabase as the Backend

Supabase is the recommended deployment target for the current phase because:

- Postgres with pgvector is available immediately, no setup required
- Supabase Storage handles raw document file storage alongside the database
- Auto-generated REST APIs mean section links can be served without writing a custom API server
- Row-level security for multi-tenant access control without custom middleware

---

# 13. What Vectorless Does Not Do

Being explicit about scope prevents scope creep and keeps the SDK composable:

- **Does not call LLMs at query time.** Vectorless has no opinion on which LLM you use to reason over the document map. Bring your own.
- **Does not manage prompts.** How you structure the navigation prompt is your decision.
- **Does not manage conversation.** Multi-turn chat, memory, history — not Vectorless's concern.
- **Does not generate answers.** Vectorless returns section text. The caller synthesizes the answer.
- **Does not do OCR.** Scanned PDFs must be pre-processed before ingest.
- **Does not crawl the web.** URL ingestion fetches a single URL. It does not follow links.
- **Does not rank or score retrieved sections.** Sections are returned in document order, not relevance order. Relevance is handled by the LLM that selected them.

---

# 14. Roadmap

## Phase 1 — Core SDK (Current)

- Document ingest: PDF, DOCX, TXT, URL
- Three ToC strategies: extract, generate, hybrid
- Section storage with deterministic links
- Parallel section fetching
- Postgres schema and migrations
- TypeScript SDK
- REST API

## Phase 2 — Hybrid Mode

- pgvector integration for embedding-based retrieval
- `embed_sections` option at ingest
- `searchSections` method for vector path
- Parallel vectorless + vectorful retrieval with result merging
- Configurable strategy weighting

## Phase 3 — Ecosystem & Scale

- Python SDK
- LangChain integration package
- LlamaIndex integration package
- MCP server — use Vectorless natively in Claude, Cursor, and MCP-compatible agent runtimes
- Streaming section fetch responses
- Cross-document retrieval — query across multiple documents simultaneously
- Managed cloud offering
- Multi-tenant access control

---

# 15. Key Design Decisions & Rationale

## Why not chunk-based retrieval?

Chunking discards structure. Structure is the most reliable signal for what a section of a document is about. Preserving structure means the retrieval unit is always a coherent, self-contained piece of meaning — not an artifact of a token counter.

## Why LLM reasoning instead of vector similarity for primary retrieval?

Language models are significantly better at reading a table of contents and identifying relevant sections than at converting questions into vectors that land near the right chunks. Navigation is a natural language task. Vectorless uses LLMs for what they are actually optimized for.

## Why parallel fetching?

In any real application, the LLM will frequently need more than one section to answer a complex question. Sequential fetching makes latency proportional to section count — a 5-section answer takes 5× as long as a 1-section answer. Parallel fetching makes it constant. This is a non-negotiable design choice.

## Why keep the SDK narrow?

A narrow SDK is a composable SDK. Vectorless does not dictate which LLM you use, which orchestration framework you use, or how you structure your application. Developers can drop it into an existing LangGraph agent, a CrewAI pipeline, a custom FastAPI backend, or a Next.js API route. The narrower the interface, the easier the integration.

## Why JSONB for the document map?

The document map has variable structure — different documents have different numbers of sections, different metadata fields, different source-specific properties. A rigid relational schema for the map would require migrations every time the map format evolves. JSONB gives full flexibility while remaining queryable and indexable. The sections themselves — which have a stable schema — are stored in a proper relational table.

## Why Postgres over a dedicated vector database?

A dedicated vector database (Pinecone, Weaviate, Qdrant) is a third piece of infrastructure to deploy, manage, and pay for. For hybrid mode, pgvector provides competitive performance within the same Postgres instance that already stores the document maps and section content. One database, one connection, one bill. The operational simplicity is significant.

---

# 16. Glossary

| Term | Definition |
|---|---|
| **Document map** | The structured JSON index of a document produced at ingest. Contains all section titles, summaries, and retrieval links. The central artifact of Vectorless. Analogous to `llms.txt` for a document. |
| **Section** | A semantically complete division of a document, defined by its natural structure. The atomic unit of retrieval in Vectorless. |
| **Section link** | A stable, deterministic URL that resolves to the content of a specific section. Constructed from doc_id and section_id at ingest time. |
| **ToC manifest** | Synonym for document map. The structured table of contents returned after ingest. |
| **ToC strategy** | The method used to build the document map at ingest time. One of: `extract` (native structure), `generate` (LLM-produced), `hybrid` (both). |
| **Ingest pipeline** | The sequence of operations that processes a raw document into stored sections and a document map. |
| **Vectorless retrieval** | Retrieval driven by LLM reasoning over a document map. No embeddings or vector similarity involved. |
| **Hybrid retrieval** | Retrieval that runs vectorless reasoning and vector similarity in parallel and merges results. |
| **Parallel fetch** | Fetching multiple sections simultaneously rather than sequentially. Core to Vectorless's latency model. |
| **RAG** | Retrieval-Augmented Generation. The pattern of augmenting an LLM's answer with retrieved context from an external document store. |
| **Chunk** | An arbitrary fixed-size fragment of a document, used as the retrieval unit in conventional RAG. Vectorless does not use chunks. |
| **Embedding** | A vector representation of text, used for similarity search. Optional in Vectorless (required only for hybrid mode). |
| **pgvector** | A Postgres extension that adds vector storage and similarity search. Used in Vectorless hybrid mode. |
| **Supabase** | Recommended managed Postgres provider for Vectorless deployment. Provides pgvector, file storage, and auto-generated REST APIs. |
| **doc_id** | The unique identifier for an ingested document. |
| **section_id** | The unique identifier for a section, scoped to its parent document. |