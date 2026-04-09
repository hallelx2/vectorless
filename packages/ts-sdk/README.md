# Vectorless — TypeScript SDK

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

### Error Handling

```typescript
import {
  VectorlessError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
} from "vectorless";

try {
  await client.getToC("invalid-id");
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log("Document not found");
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  }
}
```

## License

MIT
