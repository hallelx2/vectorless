# vectorless-mcp

Model Context Protocol (MCP) server for [Vectorless](https://vectorless.store) — document retrieval for the reasoning era.

This MCP server lets Claude Desktop, Cursor, Windsurf, and any MCP-compatible client interact with your Vectorless documents directly. Upload documents, query them with natural language, browse table-of-contents, and fetch specific sections — all from within your AI assistant.

## Quick Start

### 1. Get an API Key

Sign up at [vectorless.store](https://vectorless.store) and create an API key from **Dashboard > API Keys**.

### 2. Configure Your MCP Client

#### Claude Desktop

Add to your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vectorless": {
      "command": "npx",
      "args": ["-y", "vectorless-mcp"],
      "env": {
        "VECTORLESS_API_KEY": "vl_sk_live_..."
      }
    }
  }
}
```

#### Cursor / Windsurf

Same configuration shape — add via **Settings > MCP**.

### 3. Start Using It

Ask your AI assistant things like:

- *"List my vectorless documents"*
- *"Upload this PDF to vectorless"*
- *"What does section 3.2 of my research paper say about methodology?"*
- *"Query my design doc about the authentication flow"*

## Available Tools

| Tool | Description |
|------|-------------|
| `vectorless_list_documents` | List all documents in your project |
| `vectorless_add_document` | Upload a document (URL or base64 file) |
| `vectorless_query` | Ask a natural-language question against a document |
| `vectorless_get_toc` | Get the table of contents for a document |
| `vectorless_fetch_section` | Fetch the full content of a specific section |
| `vectorless_delete_document` | Delete a document and all its sections |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VECTORLESS_API_KEY` | Yes | — | Your Vectorless API key (`vl_sk_live_...`) |
| `VECTORLESS_API_URL` | No | `https://api.vectorless.store` | API base URL (for self-hosted or dev) |

## Development

```bash
# From the monorepo root
pnpm install
pnpm --filter vectorless-mcp dev
```

## License

MIT
