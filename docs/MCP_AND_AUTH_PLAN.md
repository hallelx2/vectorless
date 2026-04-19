# Vectorless — MCP Server, OAuth, and Usage Limits Implementation Plan

> **Owner:** @hallelx2
> **Status:** Ready to implement
> **Targets:** v1.0 (launch day) local MCP · v1.1 (week 2) remote MCP + OAuth · v1.2 (week 3) plans + quotas
> **Stack we're working in:** Hono API + Drizzle + Neon Postgres, Next.js 15 dashboard, Better Auth for user accounts, Upstash QStash for jobs. Add Upstash Redis for rate-limit counters.

---

## 0. Goals

1. Ship a **local stdio MCP server** on launch day so Claude Desktop / Cursor / Windsurf users can install vectorless in one line.
2. Ship a **remote HTTP MCP server** at `mcp.vectorless.store` in week 2 with two auth paths:
   - **Bearer token** (existing `vl_sk_live_...` API keys) — simplest, ships first
   - **OAuth 2.1 with PKCE** — proper "Connect to Vectorless" flow with a consent screen and revocable per-client tokens
3. Build **rate limiting, plans, and usage tracking** so the platform is protected from runaway MCP clients and we have an upgrade path for paying users.
4. Do all of this without breaking existing API key authentication — every current SDK call must keep working.

---

## 1. High-level architecture

```
                                    vectorless.store
                                         |
        +----------------+---------------+----------------+------------------+
        |                |               |                |                  |
   Next.js dashboard    apps/api        apps/mcp-http    apps/mcp-stdio    packages/mcp-tools
   (apps/web)           (Hono)          (Hono /mcp)     (npm package)     (shared tool defs)
        |                |               |                |
        |                |               |         (runs on user machine
        |                |               |          via `npx vectorless-mcp`)
        |                |               |
        +----> /oauth/authorize, /consent, /oauth/apps
        |      /dashboard/usage, /dashboard/plans
        |      /dashboard/connected-apps
        |
        |      +--------+--------+
        |      |        |        |
        |   Postgres  Upstash   Cloudflare
        |   (Neon)    Redis     R2
        |               |
        |         rate-limit counters,
        |         oauth nonces,
        |         token-bucket state
```

**Key decisions made upfront (so you don't have to rediscover them):**

| Decision | Choice | Why |
|---|---|---|
| Local stdio server | Separate npm package `vectorless-mcp` under `apps/mcp-stdio/` | Distribution via `npx`, zero new infra |
| Remote HTTP server | New routes inside existing `apps/api` (`/mcp/*`) | Shared DB pool, auth, rate limiters — don't split infra prematurely |
| Shared tool definitions | New workspace package `packages/mcp-tools/` | Single source of truth for both stdio and HTTP servers |
| Access tokens | Short-lived JWT (15 min, JWS signed HS256) | Stateless verification, no DB round-trip per request |
| Refresh tokens | DB-backed opaque tokens, 30 days, rotating | Revocable per-client, standard OAuth pattern |
| OAuth scopes | `documents:read`, `documents:write`, `query` | Minimal; matches the 6 MCP tools |
| Dynamic Client Registration | Implement RFC 7591 at `/oauth/register` | Required by MCP spec for "Connect" UX |
| Rate-limit store | Upstash Redis (you're already using Upstash QStash) | Sliding-window counters, edge-friendly |
| Rate-limit algorithm | Sliding window log for per-key, token bucket for per-IP | Accuracy where it matters (billing), burst tolerance elsewhere |
| Plans | Free / Pro / Enterprise | Standard SaaS shape, room to grow |
| Usage pricing | Count of queries + count of ingested pages per month | Aligns with the two cost drivers (LLM calls for query + LLM calls for summarization) |

---

## 2. Phase roadmap

| Phase | Scope | Target | Ships with |
|---|---|---|---|
| **1** | Local stdio MCP server + npm publish | **2026-04-21 (launch day)** | `apps/mcp-stdio/`, `packages/mcp-tools/`, README section |
| **2** | Remote HTTP MCP server + bearer auth | **~2026-04-28 (week 2)** | `/mcp/*` routes in `apps/api`, `mcp.vectorless.store` DNS + redirect, post-launch blog post |
| **3** | OAuth 2.1 provider + consent screen + DCR | **~2026-05-05 (week 3)** | `/oauth/*` routes, `oauth_*` tables, dashboard consent page, "Connect to Claude Desktop" button |
| **4** | Plans, rate limits, per-key quotas | **~2026-05-12 (week 4)** | `plans` table, `usage_records` table, rate-limit middleware, `/dashboard/usage` |
| **5** | Billing integration + usage dashboard polish | **~2026-05-19 (week 5)** | Stripe or Polar, `/dashboard/billing`, invoice webhook |

Each phase is independently shippable. If phase N slips, phase N+1 is still possible (except phase 3, which depends on phase 2).

---

## 3. Phase 1 — Local stdio MCP server

### 3.1 Create the shared tools package

```
packages/mcp-tools/
  package.json                 # name: "@vectorless/mcp-tools", private
  tsconfig.json
  src/
    index.ts                   # exports
    schemas.ts                 # zod schemas for every tool's input
    tools.ts                   # MCP tool definitions (name, description, inputSchema)
    handlers.ts                # handler functions: (client, args) => result
    types.ts
```

**`packages/mcp-tools/src/tools.ts`:**

```ts
import { z } from "zod";

export const toolDefinitions = [
  {
    name: "vectorless_list_documents",
    description:
      "List all documents the authenticated project has uploaded to vectorless. Returns doc_id, title, status, and page count.",
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).optional().default(25),
      cursor: z.string().optional(),
    }),
  },
  {
    name: "vectorless_add_document",
    description:
      "Upload a document to vectorless. Accepts a public URL or a base64-encoded file. Returns a doc_id once processing is queued.",
    inputSchema: z.object({
      source: z.union([
        z.object({ url: z.string().url() }),
        z.object({ filename: z.string(), base64: z.string() }),
      ]),
      toc_strategy: z.enum(["extract", "hybrid", "generate"]).optional().default("hybrid"),
    }),
  },
  {
    name: "vectorless_query",
    description:
      "Ask a natural-language question against a document. The server runs the full tree-agent and returns the sections it selected along with a complete reasoning trace. This is the primary tool.",
    inputSchema: z.object({
      doc_id: z.string(),
      query: z.string().min(3),
      max_tokens: z.number().int().min(500).max(32000).optional().default(8000),
      include_trace: z.boolean().optional().default(true),
    }),
  },
  {
    name: "vectorless_get_toc",
    description:
      "Fetch the structured table of contents for a document. Returns a hierarchical tree of sections with titles, summaries, and IDs. Lightweight — does not include full section content.",
    inputSchema: z.object({ doc_id: z.string() }),
  },
  {
    name: "vectorless_fetch_section",
    description:
      "Fetch the full content of a specific section by ID. Use after the client LLM has read a ToC and decided which sections it wants.",
    inputSchema: z.object({
      doc_id: z.string(),
      section_id: z.string(),
    }),
  },
  {
    name: "vectorless_delete_document",
    description:
      "Delete a document and all of its sections from the project. Irreversible.",
    inputSchema: z.object({ doc_id: z.string() }),
  },
] as const;

export const scopeForTool: Record<string, OAuthScope> = {
  vectorless_list_documents: "documents:read",
  vectorless_get_toc: "documents:read",
  vectorless_fetch_section: "documents:read",
  vectorless_query: "query",
  vectorless_add_document: "documents:write",
  vectorless_delete_document: "documents:write",
};

export type OAuthScope = "documents:read" | "documents:write" | "query";
```

**`packages/mcp-tools/src/handlers.ts`:**

```ts
import type { VectorlessClient } from "vectorless";

export const handlers = {
  vectorless_list_documents: (c: VectorlessClient, a: any) =>
    c.listDocuments({ limit: a.limit, cursor: a.cursor }),

  vectorless_add_document: (c: VectorlessClient, a: any) => {
    const source = "url" in a.source
      ? { type: "url" as const, url: a.source.url }
      : { type: "file" as const, filename: a.source.filename, base64: a.source.base64 };
    return c.addDocument(source, { tocStrategy: a.toc_strategy });
  },

  vectorless_query: (c: VectorlessClient, a: any) =>
    c.query(a.doc_id, a.query, { maxTokens: a.max_tokens, includeTrace: a.include_trace }),

  vectorless_get_toc: (c: VectorlessClient, a: any) => c.getToC(a.doc_id),
  vectorless_fetch_section: (c: VectorlessClient, a: any) => c.fetchSection(a.doc_id, a.section_id),
  vectorless_delete_document: (c: VectorlessClient, a: any) => c.deleteDocument(a.doc_id),
} as const;
```

### 3.2 Create the stdio MCP app

```
apps/mcp-stdio/
  package.json                 # name: "vectorless-mcp", public, has "bin"
  tsconfig.json
  src/
    index.ts                   # stdio entry
  README.md                    # short install + config instructions
  dist/                        # built JS, shipped to npm
```

**`apps/mcp-stdio/package.json`:**

```json
{
  "name": "vectorless-mcp",
  "version": "1.0.0",
  "description": "Model Context Protocol server for Vectorless — document retrieval for the reasoning era.",
  "license": "MIT",
  "bin": { "vectorless-mcp": "dist/index.js" },
  "main": "dist/index.js",
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "prepublishOnly": "pnpm build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@vectorless/mcp-tools": "workspace:*",
    "vectorless": "workspace:*",
    "zod": "^3.23.0"
  }
}
```

**`apps/mcp-stdio/src/index.ts`:**

```ts
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { toolDefinitions, handlers } from "@vectorless/mcp-tools";
import { VectorlessClient } from "vectorless";

const apiKey = process.env.VECTORLESS_API_KEY;
if (!apiKey) {
  console.error("[vectorless-mcp] VECTORLESS_API_KEY environment variable is required");
  process.exit(1);
}

const baseUrl = process.env.VECTORLESS_API_URL ?? "https://api.vectorless.store";

const client = new VectorlessClient({ apiKey, baseUrl });

const server = new Server(
  { name: "vectorless", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema),
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const tool = toolDefinitions.find((t) => t.name === req.params.name);
  if (!tool) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
    };
  }

  const parsed = tool.inputSchema.safeParse(req.params.arguments ?? {});
  if (!parsed.success) {
    return {
      isError: true,
      content: [{ type: "text", text: `Invalid arguments: ${parsed.error.message}` }],
    };
  }

  try {
    const handler = (handlers as any)[tool.name];
    const result = await handler(client, parsed.data);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // NEVER include the API key in error messages
    const scrubbed = message.replace(/vl_[a-z_]+_[A-Za-z0-9]{20,}/g, "vl_***");
    return {
      isError: true,
      content: [{ type: "text", text: `Vectorless error: ${scrubbed}` }],
    };
  }
});

await server.connect(new StdioServerTransport());
console.error("[vectorless-mcp] Connected over stdio. Ready for requests.");
```

### 3.3 User-facing installation

The README section users follow:

```
# 1. Grab an API key from https://vectorless.store/dashboard/api-keys
# 2. Add vectorless to your MCP client config

# Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json
#                or %APPDATA%/Claude/claude_desktop_config.json):
{
  "mcpServers": {
    "vectorless": {
      "command": "npx",
      "args": ["-y", "vectorless-mcp"],
      "env": { "VECTORLESS_API_KEY": "vl_sk_live_..." }
    }
  }
}

# Cursor (Settings → MCP):  same shape
# Windsurf: same shape
```

### 3.4 Checklist — Phase 1

- [ ] Add `packages/mcp-tools/` workspace package with tool definitions, schemas, handlers
- [ ] Add `apps/mcp-stdio/` with the server entry file above
- [ ] Wire both into `pnpm-workspace.yaml` and `turbo.json`
- [ ] Add an integration test that boots the server against a mock Vectorless client and exercises all 6 tools
- [ ] Publish `vectorless-mcp@1.0.0` to npm
- [ ] Add the install block to the main `README.md` under a new "MCP Server" section
- [ ] Add a 60-second install video to the repo (record with Loom, link in README)
- [ ] Ensure the `vectorless` TS SDK exposes `query`, `listDocuments`, `addDocument`, `getToC`, `fetchSection`, `fetchSections`, `deleteDocument` with stable signatures — audit before publishing

---

## 4. Phase 2 — Remote HTTP MCP server

### 4.1 Transport choice: Streamable HTTP

Per the MCP 2025 spec the remote transport is **Streamable HTTP** — a single endpoint that accepts `POST application/json` requests containing JSON-RPC envelopes and optionally returns `text/event-stream` responses for server-streamed tool results.

We implement this as Hono routes inside `apps/api`:

```
apps/api/src/routes/mcp.ts        ← new
apps/api/src/services/mcp-server.ts ← new — the MCP Server instance
```

### 4.2 Routes

```
POST   /mcp                       # JSON-RPC envelope in, response out
GET    /mcp                       # SSE stream (for clients that want server-initiated events)
DELETE /mcp                       # session termination (spec-compliant)
```

### 4.3 Auth layer

Two auth paths supported from day one on this endpoint:

1. **Bearer API key** — existing `vl_sk_live_...` header. Reuses the existing `authMiddleware` (`apps/api/src/middleware/auth.ts`). Scopes default to "all scopes" for the owning project.
2. **OAuth 2.1 access token (JWT)** — `Authorization: Bearer eyJ...`. New middleware verifies signature, checks expiry, extracts `{ projectId, userId, clientId, scopes }`, and sets the same Hono context as the API key path.

A unified middleware tries OAuth JWT first (detected by the `eyJ` prefix and successful `jose.jwtVerify`), falls back to API key:

```ts
// apps/api/src/middleware/auth.ts (extended)
export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) throw unauthorized("Missing Authorization header");
  const token = header.slice(7);

  if (token.startsWith("vl_")) return apiKeyAuth(c, next, token);
  if (token.startsWith("eyJ")) return oauthJwtAuth(c, next, token);
  throw unauthorized("Unrecognized token format");
}
```

Phase 2 ships only the `apiKeyAuth` path. Phase 3 adds `oauthJwtAuth`.

### 4.4 Per-tool scope enforcement

Before dispatching to the handler, check `scopeForTool[toolName]` against the scopes on the context:

```ts
function enforceScope(c: Context, toolName: string) {
  const auth = c.get("auth");
  const required = scopeForTool[toolName];
  if (!auth.scopes.includes(required)) {
    throw forbidden(`Tool "${toolName}" requires scope "${required}"`);
  }
}
```

API keys get `["documents:read", "documents:write", "query"]` implicitly. OAuth tokens get whatever the user consented to.

### 4.5 DNS + deployment

- Add `CNAME mcp → api.vectorless.store` (or just document `https://api.vectorless.store/mcp` as the canonical endpoint and skip the extra DNS record)
- Vercel already routes `api.vectorless.store` to the Hono app — the new routes are picked up automatically on deploy

### 4.6 Claude Desktop client config (remote)

Once Anthropic rolls out full remote MCP support in Claude Desktop, users will add:

```json
{
  "mcpServers": {
    "vectorless": {
      "url": "https://api.vectorless.store/mcp",
      "headers": { "Authorization": "Bearer vl_sk_live_..." }
    }
  }
}
```

For now (April 2026), most clients still prefer stdio — so the stdio package remains the primary install path. The remote endpoint is for the clients that support it and for our own dogfooding.

### 4.7 Checklist — Phase 2

- [ ] Add `@modelcontextprotocol/sdk` to `apps/api` deps
- [ ] Create `apps/api/src/services/mcp-server.ts` with a factory that builds a `Server` wired to `packages/mcp-tools`
- [ ] Create `apps/api/src/routes/mcp.ts` with POST/GET/DELETE handlers
- [ ] Wire the route into `app.ts` under `authMiddleware`
- [ ] Reuse the TS SDK internally so handlers go through the same code path as external calls
- [ ] Extend the existing auth context to include `scopes` (default `["documents:read", "documents:write", "query"]` for API keys)
- [ ] Add an end-to-end test that POSTs JSON-RPC `tools/list` and `tools/call` envelopes
- [ ] Write post `posts/mcp-remote-launch.md` in the outreach folder — week 2 drip

---

## 5. Phase 3 — OAuth 2.1 provider

### 5.1 What we're building

A minimal OAuth 2.1 authorization server that supports:

- Authorization Code flow with **PKCE** (required by OAuth 2.1, required by MCP)
- **Dynamic Client Registration** (RFC 7591) — so Claude Desktop can self-register
- **Token endpoint** for exchanging authorization codes for access + refresh tokens
- **Token rotation** on refresh (best practice)
- **Revocation endpoint** for logout / user-initiated disconnect
- **Introspection endpoint** (RFC 7662) for remote resource servers
- **Well-known metadata** at `/.well-known/oauth-authorization-server` (RFC 8414) and `/.well-known/oauth-protected-resource` (RFC 9728)

This is a resource server + authorization server co-located in `apps/api`. We do **not** use a general-purpose OAuth library — the surface is small enough to implement in ~500 lines and pulling in `node-oauth2-server` or similar is more trouble than it's worth. Better Auth has an OAuth provider plugin that we can evaluate, but the MCP-specific requirements (DCR, specific metadata shape, PKCE enforcement) mean we'll probably build custom endpoints and leave Better Auth for user-facing session management.

### 5.2 New endpoints

```
GET   /.well-known/oauth-authorization-server   # RFC 8414 metadata
GET   /.well-known/oauth-protected-resource     # RFC 9728 resource metadata
POST  /oauth/register                            # RFC 7591 dynamic client registration
GET   /oauth/authorize                           # redirects to consent screen on dashboard
POST  /oauth/authorize                           # consent screen posts here, issues auth code
POST  /oauth/token                               # exchange code for tokens, or refresh tokens
POST  /oauth/revoke                              # RFC 7009 revocation
POST  /oauth/introspect                          # RFC 7662 introspection (internal use)
```

### 5.3 The authorization flow

```
Claude Desktop                 Dashboard (apps/web)           API (apps/api)
     |                                |                            |
     | 1. GET /.well-known/            |                            |
     |    oauth-protected-resource --->|--------------------------->|
     |<--- metadata -------------------|----------------------------|
     |                                |                            |
     | 2. POST /oauth/register ---------|--------------------------->|
     |    { client_name, redirect_uris, ... }                       |
     |<--- { client_id, client_secret }|----------------------------|
     |                                |                            |
     | 3. Open browser to /oauth/authorize?client_id=&redirect_uri=&
     |    code_challenge=&code_challenge_method=S256&scope=&state=
     |                                |                            |
     |    (user not logged in yet)    |                            |
     |                                |                            |
     | 4. Dashboard prompts login (Better Auth)                     |
     |                                |                            |
     | 5. Dashboard shows consent screen:                           |
     |    "Claude Desktop wants to access your vectorless account" |
     |    - documents:read  [ x ]                                   |
     |    - documents:write [ x ]                                   |
     |    - query           [ x ]                                   |
     |    [Approve] [Deny]                                          |
     |                                |                            |
     | 6. User clicks Approve         |                            |
     |    Dashboard POSTs to /oauth/authorize with user session     |
     |                                |--------------------------->|
     |                                |       issue auth code      |
     |                                |<---------------------------|
     |                                |                            |
     | 7. Dashboard 302s back to redirect_uri with ?code=&state=    |
     |<-------------------------------|                            |
     |                                                             |
     | 8. POST /oauth/token --------------------------------------->|
     |    grant_type=authorization_code                             |
     |    code=&code_verifier=&client_id=&client_secret=            |
     |<--- { access_token (JWT, 15m), refresh_token, expires_in } --|
     |                                                             |
     | 9. Subsequent calls to /mcp:                                 |
     |    Authorization: Bearer <access_token> ------------------->|
     |                                                             |
     |10. Before expiry, POST /oauth/token                          |
     |    grant_type=refresh_token ---------------------------------->
     |    (server rotates refresh token)                             |
```

### 5.4 JWT access token shape

```json
{
  "iss": "https://api.vectorless.store",
  "sub": "user_01HX...",               // user id
  "aud": "https://api.vectorless.store/mcp",
  "exp": 1713600000,
  "iat": 1713599100,
  "jti": "jti_01HX...",                // revocation handle
  "project_id": "proj_01HX...",        // default project for this user
  "client_id": "client_01HX...",
  "scopes": ["documents:read", "query"],
  "plan": "free"                        // denormalized for rate-limit middleware
}
```

Signed with HS256 using a secret in env (`OAUTH_JWT_SECRET`, rotatable). 15-minute expiry. Any claim change requires reissue — that's the point.

### 5.5 Database schema additions

```ts
// apps/api/src/db/schema.ts (append)

export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    clientName: text("client_name").notNull(),
    clientSecretHash: text("client_secret_hash"),       // null for public clients
    redirectUris: text("redirect_uris").array().notNull(),
    grantTypes: text("grant_types").array().notNull().default(["authorization_code", "refresh_token"]),
    tokenEndpointAuthMethod: text("token_endpoint_auth_method").notNull().default("client_secret_basic"),
    // 'first_party' = we pre-registered them (Claude Desktop); 'dcr' = registered themselves
    source: text("source", { enum: ["first_party", "dcr"] }).notNull().default("dcr"),
    logoUri: text("logo_uri"),
    policyUri: text("policy_uri"),
    tosUri: text("tos_uri"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("oauth_clients_name_idx").on(t.clientName)]
);

export const oauthAuthorizationCodes = pgTable("oauth_authorization_codes", {
  code: text("code").primaryKey(),                       // opaque, hashed
  clientId: text("client_id").notNull().references(() => oauthClients.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  projectId: text("project_id").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  scopes: text("scopes").array().notNull(),
  codeChallenge: text("code_challenge").notNull(),
  codeChallengeMethod: text("code_challenge_method").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),     // 10 minutes
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    tokenHash: text("token_hash").notNull(),
    clientId: text("client_id").notNull().references(() => oauthClients.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    projectId: text("project_id").notNull(),
    scopes: text("scopes").array().notNull(),
    parentId: text("parent_id"),                          // for rotation chain
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),     // 30 days
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("oauth_refresh_tokens_hash_idx").on(t.tokenHash),
    index("oauth_refresh_tokens_user_idx").on(t.userId),
  ]
);

export const oauthConsents = pgTable(
  "oauth_consents",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    userId: text("user_id").notNull(),
    clientId: text("client_id").notNull().references(() => oauthClients.id, { onDelete: "cascade" }),
    scopes: text("scopes").array().notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("oauth_consents_user_client_idx").on(t.userId, t.clientId)]
);

export const oauthRevokedJtis = pgTable(
  "oauth_revoked_jtis",
  {
    jti: text("jti").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),     // cleanup after access-token window
  }
);
```

### 5.6 DCR security

Dynamic Client Registration is a risk — anyone can register a client. Mitigations:

- Rate-limit `/oauth/register` to **5 registrations per IP per hour**
- Cap the number of clients per deduplicated `client_name + IP` at 10
- Require a **software_statement** (signed JWT from Anthropic / first-party issuers) for automatic approval. Unsigned DCR goes into a "pending" state and is allowed for public clients with loopback / `localhost` redirect URIs only (Claude Desktop's pattern).
- Log every DCR request with source IP and user-agent; flag spikes.

### 5.7 Consent screen in dashboard

New page at `apps/web/app/(auth)/oauth/consent/page.tsx`:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│    [vectorless logo]                                    │
│                                                          │
│    Claude Desktop                                       │
│    wants to connect to your Vectorless account         │
│                                                          │
│    This will allow Claude Desktop to:                   │
│                                                          │
│    ☑  Read your documents and table-of-contents maps   │
│    ☑  Ask queries against your documents                │
│    ☑  Upload new documents on your behalf               │
│                                                          │
│    Project: [ Personal ▾ ]                              │
│                                                          │
│    You can revoke this access at any time in            │
│    Settings → Connected Apps.                            │
│                                                          │
│    [ Cancel ]                  [ Allow access ]         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Implementation:
- Server component reads `client_id`, `scope`, `state`, `code_challenge`, `redirect_uri` from query params
- Calls the API internally (`/oauth/internal/validate-request`) to verify client + redirect_uri + PKCE params are valid before showing the page
- On user click, POSTs to `/oauth/authorize` with the user's session cookie + the query params + the selected project_id
- The API validates the session (Better Auth middleware), writes the authorization code + consent row, 302s back to the client's `redirect_uri` with `?code=...&state=...`

### 5.8 Checklist — Phase 3

- [ ] Add the 5 new tables via a Drizzle migration
- [ ] Implement `/.well-known/*` metadata endpoints
- [ ] Implement `/oauth/register` with DCR security
- [ ] Implement `/oauth/authorize` (GET redirect + POST from dashboard)
- [ ] Implement `/oauth/token` for auth_code and refresh_token grants, with PKCE verification
- [ ] Implement `/oauth/revoke` and `/oauth/introspect`
- [ ] Implement `oauthJwtAuth` middleware path in `authMiddleware`
- [ ] Build `apps/web/app/(auth)/oauth/consent/page.tsx`
- [ ] Build `apps/web/app/(dashboard)/dashboard/connected-apps/page.tsx` — user sees and revokes OAuth grants
- [ ] Add `OAUTH_JWT_SECRET` to env vars in Vercel
- [ ] Add a full E2E test: register a client → run the flow → call `/mcp` with the token → refresh → revoke → confirm revoked token is rejected
- [ ] Security review: every endpoint resistant to CSRF, timing attacks, and open-redirect abuse

---

## 6. Phase 4 — Plans, rate limits, and quotas

### 6.1 Plans

```ts
// apps/api/src/config/plans.ts
export const PLANS = {
  free: {
    name: "Free",
    monthlyQueries: 500,
    monthlyIngestPages: 500,
    maxDocumentsStored: 25,
    maxStorageBytes: 100 * 1024 * 1024,              // 100 MB
    queryRateLimit: { windowMs: 60_000, max: 20 },   // 20/min
    ingestRateLimit: { windowMs: 60_000, max: 5 },   // 5/min
    treeNavRateLimit: { windowMs: 60_000, max: 120 }, // getToC, fetchSection, etc.
  },
  pro: {
    name: "Pro",
    monthlyQueries: 20_000,
    monthlyIngestPages: 10_000,
    maxDocumentsStored: 500,
    maxStorageBytes: 10 * 1024 * 1024 * 1024,        // 10 GB
    queryRateLimit: { windowMs: 60_000, max: 200 },
    ingestRateLimit: { windowMs: 60_000, max: 30 },
    treeNavRateLimit: { windowMs: 60_000, max: 1200 },
  },
  enterprise: {
    name: "Enterprise",
    monthlyQueries: Infinity,
    monthlyIngestPages: Infinity,
    maxDocumentsStored: Infinity,
    maxStorageBytes: Infinity,
    queryRateLimit: { windowMs: 60_000, max: 1000 },
    ingestRateLimit: { windowMs: 60_000, max: 200 },
    treeNavRateLimit: { windowMs: 60_000, max: 10_000 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
```

### 6.2 New tables

```ts
export const userPlans = pgTable(
  "user_plans",
  {
    userId: text("user_id").primaryKey(),
    plan: text("plan", { enum: ["free", "pro", "enterprise"] }).notNull().default("free"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export const usageRecords = pgTable(
  "usage_records",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    userId: text("user_id").notNull(),
    projectId: text("project_id").notNull(),
    kind: text("kind", { enum: ["query", "ingest_page", "tree_nav"] }).notNull(),
    count: integer("count").notNull().default(1),
    metadata: jsonb("metadata"),                       // doc_id, tool_name, token counts
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("usage_user_time_idx").on(t.userId, t.recordedAt),
    index("usage_kind_time_idx").on(t.kind, t.recordedAt),
  ]
);
```

### 6.3 Rate limiting middleware

**Store:** Upstash Redis — add a new workspace env var `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.

```ts
// apps/api/src/middleware/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function makeLimiter(windowMs: number, max: number) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${windowMs / 1000} s`),
    prefix: "vl:rl",
  });
}

export function rateLimitFor(kind: "query" | "ingest" | "tree_nav") {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth");
    const plan = PLANS[auth.plan as PlanKey] ?? PLANS.free;
    const cfg = {
      query: plan.queryRateLimit,
      ingest: plan.ingestRateLimit,
      tree_nav: plan.treeNavRateLimit,
    }[kind];

    const limiter = makeLimiter(cfg.windowMs, cfg.max);
    const identifier = `${auth.userId}:${kind}`;
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.floor(reset / 1000)));

    if (!success) {
      c.header("Retry-After", String(Math.ceil((reset - Date.now()) / 1000)));
      throw tooManyRequests(`Rate limit exceeded for ${kind}. Upgrade at vectorless.store/dashboard/billing.`);
    }
    await next();
  };
}
```

Apply per-route:

```ts
// apps/api/src/routes/query.ts
app.post("/v1/documents/:id/query", authMiddleware, rateLimitFor("query"), quotaCheck("query"), queryHandler);
```

### 6.4 Monthly quota enforcement

A second middleware checks the aggregate monthly count (not just the sliding window):

```ts
// apps/api/src/middleware/quota.ts
export function quotaCheck(kind: "query" | "ingest") {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth");
    const plan = PLANS[auth.plan as PlanKey] ?? PLANS.free;
    const cap = kind === "query" ? plan.monthlyQueries : plan.monthlyIngestPages;
    if (cap === Infinity) return next();

    // Cached in Redis for 60s so we don't count-star on every request
    const cacheKey = `vl:quota:${auth.userId}:${kind}:${monthBucket()}`;
    let used = Number(await redis.get(cacheKey));
    if (!used) {
      used = await countUsage(auth.userId, kind, currentPeriodStart(auth));
      await redis.set(cacheKey, used, { ex: 60 });
    }

    if (used >= cap) {
      throw quotaExceeded(`Monthly ${kind} quota reached (${cap}). Upgrade at vectorless.store/dashboard/billing.`);
    }
    await next();
  };
}
```

Usage is written **after** the request succeeds (in a `finally` hook), so failed requests don't count against the quota.

### 6.5 Checklist — Phase 4

- [ ] Add `@upstash/redis` and `@upstash/ratelimit` to `apps/api`
- [ ] Create `user_plans` and `usage_records` tables via migration
- [ ] Backfill `user_plans` with `free` for every existing user
- [ ] Implement `rate-limit.ts` middleware
- [ ] Implement `quota.ts` middleware
- [ ] Apply both to `/v1/documents/:id/query`, `/v1/documents` (ingest), and the MCP route
- [ ] Write usage records from a fire-and-forget hook on successful responses
- [ ] Build `apps/web/app/(dashboard)/dashboard/usage/page.tsx` — today, this week, this month, chart
- [ ] Build `apps/web/app/(dashboard)/dashboard/billing/page.tsx` — current plan, upgrade button, invoice history

---

## 7. Phase 5 — Billing + usage dashboard polish

Billing provider: **Polar** (friendlier to open source + cheaper fees than Stripe, and we're launching as open source). Fallback: Stripe.

- Create Polar products for Pro ($49/mo) and Pro Annual ($490/yr). Enterprise is contact-sales.
- Webhook handler at `/webhooks/polar` that updates `user_plans` on subscription events
- "Upgrade" button on `/dashboard/billing` opens Polar Checkout
- When a subscription lapses, downgrade to `free` and fire a notification — do not lock the account

### 7.1 Checklist — Phase 5

- [ ] Create Polar account + products
- [ ] Implement `/webhooks/polar` handler with signature verification
- [ ] Polar Checkout integration on billing page
- [ ] Email template "you upgraded to Pro", "your subscription is ending", "you've hit 80% of your quota"
- [ ] Admin script: migrate a user to Enterprise manually

---

## 8. Dashboard changes — consolidated

New pages to add under `apps/web/app/(dashboard)/dashboard/`:

| Path | Purpose |
|---|---|
| `connected-apps/page.tsx` | List OAuth clients the user has granted access. Revoke button per client. Shows granted scopes, last-used timestamp, created date. |
| `usage/page.tsx` | Real-time usage chart. Queries today, this week, this month. Breakdown by document. Colored bar at N% of plan cap. |
| `billing/page.tsx` | Current plan, invoice history, upgrade button, quota summary. |

Modifications to existing pages:

| Path | Change |
|---|---|
| `api-keys/page.tsx` | Add a "Scopes" column. For now, existing keys show "All scopes" (read+write+query). New keys can be created with a subset. |
| `settings/page.tsx` | Link to `/dashboard/connected-apps`. |
| `(marketing)/pricing/page.tsx` (new) | Public pricing page. Free / Pro / Enterprise columns matching `PLANS`. |

New pages under `apps/web/app/(auth)/oauth/`:

| Path | Purpose |
|---|---|
| `consent/page.tsx` | The OAuth consent screen shown during `/oauth/authorize`. Described in §5.7. |
| `error/page.tsx` | Fallback error page for OAuth failures (invalid client, expired code, denied consent). |

---

## 9. Environment variables — additions

```bash
# Phase 2 — remote MCP (none required — reuses existing API auth)

# Phase 3 — OAuth
OAUTH_JWT_SECRET=<64-byte hex>            # signing key for access tokens
OAUTH_ACCESS_TOKEN_TTL_SECONDS=900        # 15 minutes
OAUTH_REFRESH_TOKEN_TTL_SECONDS=2592000   # 30 days
OAUTH_ISSUER=https://api.vectorless.store

# Phase 4 — rate limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Phase 5 — billing
POLAR_ACCESS_TOKEN=...
POLAR_WEBHOOK_SECRET=...
POLAR_ORGANIZATION_ID=...
```

Add these to the existing DEPLOYMENT.md env-var block and to Vercel project settings.

---

## 10. Security checklist

Do not ship any phase without walking through this list:

- [ ] API keys and OAuth secrets are hashed at rest (SHA-256 for keys, bcrypt/argon2 for client secrets)
- [ ] Access tokens are signed with HS256 using a secret that lives only in env, never in the repo
- [ ] Refresh tokens are opaque, hashed before DB insert, rotated on every use, and the old token is marked `revoked_at` on rotation
- [ ] PKCE is enforced — `code_challenge` required on `/oauth/authorize`, `code_verifier` verified on `/oauth/token`
- [ ] Authorization codes are single-use: consuming one marks `consumed_at`, re-use rejects
- [ ] `redirect_uri` on `/oauth/token` must **exactly** match the one used on `/oauth/authorize`
- [ ] Consent screen is CSRF-protected via Better Auth session + a separate form token
- [ ] DCR endpoint is rate-limited per IP
- [ ] `/oauth/authorize` only accepts registered redirect URIs — no open redirect
- [ ] Access tokens include a `jti`; revoked jtis live in a Redis set (checked on every verify) until their `exp`
- [ ] Every error message scrubs `vl_sk_live_` and `eyJ` tokens before logging
- [ ] Rate limits apply to OAuth endpoints too — `/oauth/token` must be throttled per client to prevent refresh-token brute force
- [ ] The MCP stdio binary never logs `process.env.VECTORLESS_API_KEY`
- [ ] `/oauth/register` requires HTTPS for all redirect URIs except `http://127.0.0.1` and `http://localhost` (RFC 8252)
- [ ] Unit tests cover the "revoked refresh token is still tried to rotate" case — the server must blacklist the entire chain

---

## 11. Testing strategy

**Unit:**
- Every tool handler in `packages/mcp-tools/src/handlers.ts`
- PKCE verifier
- JWT signing + verification
- Rate-limit middleware (mock Redis)

**Integration (vitest + test DB):**
- Full OAuth authorization code flow, end to end
- DCR → authorize → token → /mcp call → refresh → revoke → expect 401
- Quota enforcement: insert 500 usage records for a free user, expect the 501st query to fail
- Rate-limit sliding window: 21 queries in 60s on free plan, expect the 21st to fail

**End-to-end (playwright against local dev):**
- Spin up `apps/mcp-stdio` against a local API
- Run `tools/list` and `tools/call vectorless_query` via the MCP SDK client
- Assert the trace comes back and token budget works

**Manual:**
- Install the stdio server in a real Claude Desktop
- Ask a question against a real document
- Watch the traversal trace come through
- Disconnect and reconnect

---

## 12. Rollout order (concrete)

**Week 1 (now → 2026-04-20):**
- Day 1–2: `packages/mcp-tools/` + `apps/mcp-stdio/` (phase 1)
- Day 3: Unit tests + publish `vectorless-mcp@1.0.0-rc.1` to npm under a beta tag
- Day 4: Test in Claude Desktop, Cursor, Windsurf
- Day 5: Promote to `1.0.0`, update README, record install video

**Week 2 (2026-04-21 → 2026-04-27):**
- Ship phase 2 (remote MCP with bearer auth) behind a feature flag
- Launch day uses stdio; remote MCP becomes the "day 4 drip post" about MCP+Claude Desktop
- Day 6–7: Start phase 3 schema migrations in a branch

**Week 3 (2026-04-28 → 2026-05-04):**
- OAuth endpoints + consent screen + connected-apps dashboard page
- E2E tests
- Post: "Connect Claude Desktop to vectorless in one click" — second MCP-themed drip

**Week 4 (2026-05-05 → 2026-05-11):**
- Phase 4 plans + rate limits + usage dashboard
- Publicly announce Pro plan
- Post: "How we rate-limit without making the free tier useless"

**Week 5 (2026-05-12 → 2026-05-18):**
- Phase 5 billing via Polar
- First Pro upgrade eligible

---

## 13. Open questions (decide before starting each phase)

1. **Phase 1:** Ship `vectorless-mcp` as a separate package, or add a `bin` entry to the existing `vectorless` npm package? → Recommendation: separate. Keeps the SDK install clean.
2. **Phase 2:** Use the official MCP SDK's HTTP transport, or implement the JSON-RPC envelope parsing directly in a Hono handler? → Recommendation: use the SDK. It handles spec edge cases (session IDs, SSE framing) we don't want to chase.
3. **Phase 3:** Do we support OAuth for end-user access to the dashboard (i.e. "Sign in with GitHub"), or only for third-party clients? → Out of scope. Better Auth already handles user login.
4. **Phase 3:** Are first-party clients (Claude Desktop registered by us, not via DCR) handled differently? → Yes — pre-seed a row in `oauth_clients` with `source='first_party'`, skip consent screen for them if the user has previously consented (auto-approve). MCP spec allows this.
5. **Phase 4:** Do we count tree-navigation (`getToC`, `fetchSection`) toward the query quota? → No. Only `vectorless_query` counts as a query. Tree navigation is free. Ingests count per-page against the ingest quota.
6. **Phase 5:** Polar or Stripe? → Polar first, Stripe as fallback if enterprise procurement requires it.

---

## 14. Linked files in the current repo

| Path | Relevance |
|---|---|
| `apps/api/src/middleware/auth.ts` | Existing API key middleware — extend, don't replace |
| `apps/api/src/db/schema.ts` | Append OAuth + plans + usage tables here |
| `apps/api/src/routes/` | Add `mcp.ts` and `oauth.ts` here |
| `apps/api/src/app.ts` | Wire new routes |
| `apps/web/app/(dashboard)/dashboard/` | Add `connected-apps/`, `usage/`, `billing/` |
| `apps/web/app/(auth)/` | Add `oauth/consent/`, `oauth/error/` |
| `packages/shared/` | Shared types between api + web + sdks — add OAuth + plan types here |
| `packages/ts-sdk/` | No changes for MCP phase 1; consider adding `client.oauth.*` helpers later |
| `DEPLOYMENT.md` | Update env-var block after phase 3 and phase 4 |
| `README.md` | Add MCP section after phase 1 |
| `IMPROVEMENTS.md` | Mark #19 (MCP server) and #25 (rate limiting tiers) as "in progress" then "done" as each phase ships |

---

## 15. Definition of done

**Phase 1 is done when:**
- `npx vectorless-mcp` starts the server, lists tools, and successfully executes `vectorless_query` against a real document in Claude Desktop.
- The package is published to npm as `vectorless-mcp@1.0.0`.
- The README has a working install block.

**Phase 2 is done when:**
- `curl -X POST https://api.vectorless.store/mcp -H "Authorization: Bearer vl_sk_live_..." -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'` returns the 6 tools.
- An MCP-spec-compliant client can call any of the 6 tools via HTTP.
- Scope enforcement blocks out-of-scope tools with HTTP 403.

**Phase 3 is done when:**
- Claude Desktop's "Connect Vectorless" flow takes the user through login → consent → redirect → first working `vectorless_query` call.
- The user can see the connected app under `/dashboard/connected-apps` and click "Revoke" to kill the access token immediately.
- The full E2E test in `apps/api/test/oauth.e2e.test.ts` passes.

**Phase 4 is done when:**
- A free-tier user hitting the 501st query of the month gets HTTP 429 with a helpful message.
- The `/dashboard/usage` page shows a real chart populated from `usage_records`.
- `X-RateLimit-*` headers are present on every `/v1/*` and `/mcp` response.

**Phase 5 is done when:**
- A user can click "Upgrade to Pro" and complete a Polar checkout in staging.
- The Polar webhook updates `user_plans.plan` and the user's rate limits immediately reflect the new plan.
- The first real paying customer can subscribe.
