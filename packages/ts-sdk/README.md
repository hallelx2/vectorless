# Vectorless -- TypeScript SDK

Official TypeScript/Node.js SDK for [Vectorless](https://vectorless.store) -- document retrieval for the reasoning era.

**Zero dependencies.** Uses built-in `fetch` (Node 18+).

## Installation

```bash
npm install vectorless
# or
pnpm add vectorless
# or
yarn add vectorless
```

## How Retrieval Works

Vectorless does not use vector embeddings or similarity search. Instead, it preserves document structure and lets your LLM reason about what to retrieve.

```
                          ┌─────────────────────────┐
  client.addDocument() ──>│ Upload + Structure Extract│
                          └────────────┬────────────┘
                                       v
                          ┌─────────────────────────┐
  client.getToC()      ──>│ Table of Contents Map     │
                          │  (titles + summaries)     │
                          └────────────┬────────────┘
                                       v
                          ┌─────────────────────────┐
  Your LLM             ──>│ Reasons over the map      │
                          │  Picks section IDs        │
                          └────────────┬────────────┘
                                       v
                          ┌─────────────────────────┐
  client.fetchSections()──>│ Full section content      │
                          │  (complete, not chunked)  │
                          └─────────────────────────┘
```

Every retrieval decision is made by your LLM -- visible, traceable, and explainable.

## Quick Start

```typescript
import { VectorlessClient } from "vectorless";

const client = new VectorlessClient({
  apiKey: "vl_sk_live_...",
});

// Upload a document
const { doc_id, toc } = await client.addDocument(file, {
  tocStrategy: "hybrid",
  title: "Clinical Guidelines",
});

// Get the table of contents (the document map)
const toc = await client.getToC(doc_id);
console.log(`${toc.section_count} sections:`);
for (const section of toc.sections) {
  console.log(`  ${section.title}: ${section.summary}`);
}

// Pass the ToC to your LLM, get back section IDs, then fetch them
const sections = await client.fetchSections(doc_id, [
  "section-id-1",
  "section-id-2",
]);
for (const section of sections) {
  console.log(section.content);
}
```

## Full Example with LLM Integration

Here is a complete example showing how to wire Vectorless into an LLM pipeline:

```typescript
import { VectorlessClient } from "vectorless";
import { generateText } from "ai"; // or any LLM library

const vectorless = new VectorlessClient({ apiKey: "vl_sk_live_..." });

async function answerQuestion(docId: string, question: string) {
  // Step 1: Get the document map
  const toc = await vectorless.getToC(docId);

  // Step 2: Ask the LLM to pick relevant sections
  const tocText = toc.sections
    .map((s) => `[${s.id}] ${s.title}: ${s.summary}`)
    .join("\n");

  const { text: sectionPicks } = await generateText({
    model: yourModel,
    prompt: `Given this document map:\n${tocText}\n\nWhich sections are relevant to: "${question}"?\nReturn only the section IDs as a JSON array.`,
  });

  const sectionIds: string[] = JSON.parse(sectionPicks);

  // Step 3: Fetch the full content of those sections
  const sections = await vectorless.fetchSections(docId, sectionIds);
  const context = sections.map((s) => s.content).join("\n\n");

  // Step 4: Generate the answer with full context
  const { text: answer } = await generateText({
    model: yourModel,
    prompt: `Using this context:\n${context}\n\nAnswer: ${question}`,
  });

  return answer;
}
```

## API Reference

### `new VectorlessClient(config)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `VECTORLESS_API_KEY` env | Your API key |
| `baseUrl` | `string` | `https://api.vectorless.store` | API base URL |
| `timeout` | `number` | `30000` | Request timeout (ms) |
| `maxRetries` | `number` | `3` | Max retry attempts for 429/5xx |

### Methods

| Method | Description |
|--------|-------------|
| `addDocument(source, options?)` | Upload and ingest a document. Waits for processing. |
| `getToC(docId)` | Get the Table of Contents manifest. |
| `fetchSection(docId, sectionId)` | Fetch a single section's full content. |
| `fetchSections(docId, sectionIds)` | Batch fetch multiple sections in parallel. |
| `getDocument(docId)` | Get document status and metadata. |
| `listDocuments(options?)` | List all documents in the project. |
| `deleteDocument(docId)` | Delete a document and all its sections. |
| `waitForReady(docId, options?)` | Poll until a document finishes processing. |

## Error Handling

The SDK provides typed error classes for every API error condition. All errors extend `VectorlessError`.

```typescript
import {
  VectorlessError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "vectorless";

try {
  const toc = await client.getToC("doc-id");
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid or expired API key
    console.error("Check your API key");
  } else if (error instanceof NotFoundError) {
    // Document does not exist or was deleted
    console.error("Document not found");
  } else if (error instanceof RateLimitError) {
    // Too many requests -- SDK auto-retries, but if retries exhausted:
    console.error(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof ValidationError) {
    // Invalid parameters (bad doc ID format, etc.)
    console.error(`Validation failed: ${error.message}`);
  } else if (error instanceof VectorlessError) {
    // Any other API error
    console.error(`API error ${error.status}: ${error.message}`);
  }
}
```

### Automatic Retries

The SDK automatically retries on `429 Too Many Requests` and `5xx` server errors with exponential backoff. You can configure this:

```typescript
const client = new VectorlessClient({
  apiKey: "vl_sk_live_...",
  maxRetries: 5,   // default: 3
  timeout: 60000,  // default: 30000ms
});
```

## ToC Strategies

When uploading a document, you can choose how the Table of Contents is generated:

| Strategy | Best For | LLM Required |
|----------|----------|-------------|
| `"extract"` | Documents with clear headings (PDF bookmarks, Markdown `#` headings) | No |
| `"hybrid"` | Documents with headings that need precise summaries for retrieval | Yes |
| `"generate"` | Unstructured documents with no headings at all | Yes |

```typescript
// Extract headings only (fast, no LLM cost)
await client.addDocument(file, { tocStrategy: "extract" });

// Extract headings + generate summaries (recommended)
await client.addDocument(file, { tocStrategy: "hybrid" });

// Generate everything from scratch (for unstructured docs)
await client.addDocument(file, { tocStrategy: "generate" });
```

## License

MIT
