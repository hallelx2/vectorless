# Vectorless SDK -- Python

Official Python SDK for [Vectorless](https://vectorless.store) -- document retrieval for the reasoning era.

Supports both **sync** and **async** clients. Full type hints with Pydantic v2.

## Installation

```bash
pip install vectorless-sdk
# or
uv add vectorless-sdk
```

## How Retrieval Works

Vectorless does not use vector embeddings or similarity search. Instead, it preserves document structure and lets your LLM reason about what to retrieve.

```
                            ┌───────────────────────────┐
  client.add_document()  ──>│ Upload + Structure Extract  │
                            └────────────┬──────────────┘
                                         v
                            ┌───────────────────────────┐
  client.get_toc()       ──>│ Table of Contents Map       │
                            │  (titles + summaries)       │
                            └────────────┬──────────────┘
                                         v
                            ┌───────────────────────────┐
  Your LLM               ──>│ Reasons over the map        │
                            │  Picks section IDs          │
                            └────────────┬──────────────┘
                                         v
                            ┌───────────────────────────┐
  client.fetch_sections() ──>│ Full section content        │
                            │  (complete, not chunked)    │
                            └───────────────────────────┘
```

Every retrieval decision is made by your LLM -- visible, traceable, and explainable.

## Quick Start

```python
from vectorless import VectorlessClient, AddDocumentOptions

client = VectorlessClient(api_key="vl_sk_live_...")

# Upload a document
result = client.add_document("document.pdf", options=AddDocumentOptions(
    toc_strategy="hybrid",
    title="Clinical Guidelines",
))
print(f"Document ID: {result.doc_id}")
print(f"Sections: {result.toc.section_count}")

# Get the table of contents (the document map)
toc = client.get_toc(result.doc_id)
for section in toc.sections:
    print(f"  {section.title}: {section.summary}")

# Pass the ToC to your LLM, get back section IDs, then fetch them
sections = client.fetch_sections(result.doc_id, ["section-id-1", "section-id-2"])
for section in sections:
    print(section.content)
```

## Full Example with LLM Integration

Here is a complete example showing how to wire Vectorless into an LLM pipeline:

```python
import json
from vectorless import VectorlessClient, AddDocumentOptions
from openai import OpenAI  # or any LLM library

vectorless = VectorlessClient(api_key="vl_sk_live_...")
llm = OpenAI()

def answer_question(doc_id: str, question: str) -> str:
    # Step 1: Get the document map
    toc = vectorless.get_toc(doc_id)

    # Step 2: Ask the LLM to pick relevant sections
    toc_text = "\n".join(
        f"[{s.id}] {s.title}: {s.summary}" for s in toc.sections
    )

    response = llm.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": (
                f"Given this document map:\n{toc_text}\n\n"
                f'Which sections are relevant to: "{question}"?\n'
                "Return only the section IDs as a JSON array."
            ),
        }],
    )
    section_ids = json.loads(response.choices[0].message.content)

    # Step 3: Fetch the full content of those sections
    sections = vectorless.fetch_sections(doc_id, section_ids)
    context = "\n\n".join(s.content for s in sections)

    # Step 4: Generate the answer with full context
    response = llm.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"Using this context:\n{context}\n\nAnswer: {question}",
        }],
    )
    return response.choices[0].message.content
```

## Async Support

```python
from vectorless import AsyncVectorlessClient

async with AsyncVectorlessClient(api_key="vl_sk_live_...") as client:
    result = await client.add_document("document.pdf")
    toc = await client.get_toc(result.doc_id)
    sections = await client.fetch_sections(result.doc_id, ["s1", "s2"])
```

## API Reference

### `VectorlessClient(api_key, base_url, timeout, max_retries)`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api_key` | `str` | `VECTORLESS_API_KEY` env | Your API key |
| `base_url` | `str` | `https://api.vectorless.store` | API base URL |
| `timeout` | `float` | `30.0` | Request timeout (seconds) |
| `max_retries` | `int` | `3` | Max retry attempts for 429/5xx |

### Methods

| Method | Description |
|--------|-------------|
| `add_document(source, options?)` | Upload and ingest a document. Waits for processing. |
| `get_toc(doc_id)` | Get the Table of Contents manifest. |
| `fetch_section(doc_id, section_id)` | Fetch a single section. |
| `fetch_sections(doc_id, section_ids)` | Batch fetch multiple sections. |
| `get_document(doc_id)` | Get document status and metadata. |
| `list_documents(options?)` | List all documents. |
| `delete_document(doc_id)` | Delete a document and all sections. |
| `wait_for_ready(doc_id, timeout, poll_interval)` | Poll until processing completes. |

## Error Handling

The SDK provides typed exception classes for every API error condition. All exceptions extend `VectorlessError`.

```python
from vectorless import (
    VectorlessError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    ValidationError,
)

try:
    toc = client.get_toc("doc-id")
except AuthenticationError:
    # Invalid or expired API key
    print("Check your API key")
except NotFoundError:
    # Document does not exist or was deleted
    print("Document not found")
except RateLimitError as e:
    # Too many requests -- SDK auto-retries, but if retries exhausted:
    print(f"Rate limited. Retry after {e.retry_after}s")
except ValidationError as e:
    # Invalid parameters (bad doc ID format, etc.)
    print(f"Validation failed: {e.message}")
except VectorlessError as e:
    # Any other API error
    print(f"API error {e.status}: {e.message}")
```

### Automatic Retries

The SDK automatically retries on `429 Too Many Requests` and `5xx` server errors with exponential backoff. You can configure this:

```python
client = VectorlessClient(
    api_key="vl_sk_live_...",
    max_retries=5,   # default: 3
    timeout=60.0,    # default: 30.0s
)
```

## ToC Strategies

When uploading a document, you can choose how the Table of Contents is generated:

| Strategy | Best For | LLM Required |
|----------|----------|-------------|
| `"extract"` | Documents with clear headings (PDF bookmarks, Markdown `#` headings) | No |
| `"hybrid"` | Documents with headings that need precise summaries for retrieval | Yes |
| `"generate"` | Unstructured documents with no headings at all | Yes |

```python
from vectorless import AddDocumentOptions

# Extract headings only (fast, no LLM cost)
client.add_document(file, options=AddDocumentOptions(toc_strategy="extract"))

# Extract headings + generate summaries (recommended)
client.add_document(file, options=AddDocumentOptions(toc_strategy="hybrid"))

# Generate everything from scratch (for unstructured docs)
client.add_document(file, options=AddDocumentOptions(toc_strategy="generate"))
```

## License

MIT
