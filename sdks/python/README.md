# Vectorless -- Python SDK

Official Python SDK for [Vectorless](https://vectorless.store) -- document retrieval for the reasoning era.

Supports both **sync** and **async** clients. Full type hints with Pydantic v2.

## Installation

```bash
pip install vectorless
# or
uv add vectorless
```

## Quick Start

```python
from vectorless import VectorlessClient

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

### Error Handling

```python
from vectorless import NotFoundError, RateLimitError, VectorlessError

try:
    toc = client.get_toc("invalid-id")
except NotFoundError:
    print("Document not found")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after}s")
except VectorlessError as e:
    print(f"API error {e.status}: {e.message}")
```

## License

MIT
