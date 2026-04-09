<div align="center">

# Vectorless

**Document retrieval for the reasoning era.**

[![CI](https://github.com/hallelx2/vectorless/actions/workflows/ci.yml/badge.svg)](https://github.com/hallelx2/vectorless/actions/workflows/ci.yml)
[![CD](https://github.com/hallelx2/vectorless/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/hallelx2/vectorless/actions/workflows/deploy-web.yml)
[![npm](https://img.shields.io/npm/v/vectorless?color=blue&label=npm)](https://www.npmjs.com/package/vectorless)
[![PyPI](https://img.shields.io/pypi/v/vectorless-sdk?color=blue&label=pypi)](https://pypi.org/project/vectorless-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python&logoColor=white)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![Fastify](https://img.shields.io/badge/Fastify-5-black?logo=fastify&logoColor=white)](https://fastify.dev)

[Website](https://vectorless.store) | [npm](https://www.npmjs.com/package/vectorless) | [PyPI](https://pypi.org/project/vectorless-sdk/)

</div>

---

## What is Vectorless?

Vectorless is a document retrieval platform that replaces traditional RAG chunking with **structure-preserving retrieval**. Instead of splitting documents into arbitrary chunks and using vector similarity search, Vectorless:

1. **Preserves document structure** -- sections, headings, chapters stay intact
2. **Generates navigable document maps** -- a Table of Contents with summaries for each section
3. **Lets LLMs reason** over the map to select exactly the sections they need

The result: more accurate retrieval, complete context, and every choice is traceable.

## How It Works

```
Document uploaded --> Structure extracted --> ToC map generated --> Sections stored
                                                    |
At query time:                                      v
  Your LLM reads the map --> Picks relevant sections --> Fetches full content
```

| Traditional RAG | Vectorless |
|----------------|------------|
| Arbitrary chunks | Natural sections |
| Vector similarity | LLM reasoning |
| Structure destroyed | Structure preserved |
| Black box ranking | Every choice traceable |

## Quick Start

### TypeScript

```bash
npm install vectorless
```

```typescript
import { VectorlessClient } from "vectorless";

const client = new VectorlessClient({ apiKey: "vl_sk_live_..." });

// Upload a document
const { doc_id, toc } = await client.addDocument(file, {
  tocStrategy: "hybrid",
});

// Get the document map
const toc = await client.getToC(doc_id);
for (const section of toc.sections) {
  console.log(`${section.title}: ${section.summary}`);
}

// Fetch specific sections (after your LLM picks them)
const sections = await client.fetchSections(doc_id, ["section-1", "section-2"]);
```

### Python

```bash
pip install vectorless-sdk
```

```python
from vectorless import VectorlessClient

client = VectorlessClient(api_key="vl_sk_live_...")

# Upload a document
result = client.add_document("report.pdf", options=AddDocumentOptions(
    toc_strategy="hybrid",
))

# Get the document map
toc = client.get_toc(result.doc_id)
for section in toc.sections:
    print(f"{section.title}: {section.summary}")

# Fetch specific sections
sections = client.fetch_sections(result.doc_id, ["section-1", "section-2"])
```

## ToC Strategies

| Strategy | When to Use | LLM Required |
|----------|------------|-------------|
| **extract** | Documents with clear headings (PDF with bookmarks, Markdown with `#` headings) | No |
| **hybrid** | Headings exist but summaries need to be precise for retrieval | Yes |
| **generate** | Unstructured documents with no headings | Yes |

## Supported Formats

- **PDF** -- text extraction + heading detection from structure and font patterns
- **DOCX** -- heading hierarchy from Word styles
- **Markdown / TXT** -- `#` headings, setext headings, ALL CAPS detection
- **URL** -- fetches HTML, strips navigation, extracts heading structure

## SDK Reference

### TypeScript SDK (`vectorless`)

| Method | Description |
|--------|-------------|
| `addDocument(source, options?)` | Upload and ingest a document |
| `getToC(docId)` | Get the Table of Contents manifest |
| `fetchSection(docId, sectionId)` | Fetch a single section |
| `fetchSections(docId, sectionIds)` | Batch fetch multiple sections |
| `getDocument(docId)` | Get document status and metadata |
| `listDocuments(options?)` | List all documents |
| `deleteDocument(docId)` | Delete a document and all sections |

### Python SDK (`vectorless-sdk`)

| Method | Description |
|--------|-------------|
| `add_document(source, options?)` | Upload and ingest a document |
| `get_toc(doc_id)` | Get the Table of Contents manifest |
| `fetch_section(doc_id, section_id)` | Fetch a single section |
| `fetch_sections(doc_id, section_ids)` | Batch fetch multiple sections |
| `get_document(doc_id)` | Get document status and metadata |
| `list_documents(options?)` | List all documents |
| `delete_document(doc_id)` | Delete a document and all sections |

Both SDKs also support async clients. The Python SDK provides `AsyncVectorlessClient`.

## Project Structure

```
vectorless/
  apps/
    web/         # Next.js dashboard + marketing site
    api/         # Fastify REST API server
  packages/
    shared/      # Shared TypeScript types + Zod schemas
    ts-sdk/      # TypeScript SDK (npm: vectorless)
    openapi/     # OpenAPI 3.1 specification
  sdks/
    python/      # Python SDK (PyPI: vectorless-sdk)
```

## Self-Hosting

Vectorless can be self-hosted. You need:

- **PostgreSQL** with pgvector (we recommend [Neon](https://neon.tech))
- **Cloudflare R2** or any S3-compatible storage for document files
- **Upstash QStash** for background job processing
- **Gemini** (Vertex AI) or **Anthropic** (Claude) for ToC generation

See the [Deployment Guide](./DEPLOYMENT.md) for step-by-step instructions.

## BYOK (Bring Your Own Key)

Users can configure their own LLM API keys in the dashboard. Keys are encrypted with AES-256-GCM before storage and are never exposed in logs or responses. If no BYOK key is configured, the platform's default LLM is used.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT
