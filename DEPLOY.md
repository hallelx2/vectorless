# Deploy Guide

After merging Phases A–E, follow these steps to take the new architecture live.

## Architecture Recap

```
AI Client (Claude / Cursor / Windsurf)
    │  Streamable HTTP + Bearer JWT
    ▼
mcp.vectorless.store         ← Vercel (Next.js apps/web, second domain)
    │
    │  /api/mcp validates token via control plane introspection,
    │  forwards /v1/* tool calls with the user's bearer token.
    │
    ▼
api.vectorless.store         ← Control plane (Go)
    │  /oauth/*               OAuth 2.1 server (DCR, authorize, token,
    │                          revoke, introspect, internal/issue-code)
    │  /admin/internal/identity/*  Better Auth CRUD (service-token auth)
    │  /admin/v1/*             Dashboard CRUD (session-cookie auth)
    │  /v1/*                   API key / OAuth-JWT auth → proxies to
    │                          vectorless-server
    │
    ▼
vectorless-server (Go) → vectorless-engine
```

## 1. Control Plane (deploy first)

### 1a. Run new migrations

```bash
cd vectorless-control-plane
go run ./cmd/controlplane --config /etc/vectorless/cp-config.yaml --migrate-only
# Applies migrations 008_oauth.sql + 009_better_auth.sql
```

### 1b. Set environment variables

| Variable                          | Value                                         |
| --------------------------------- | --------------------------------------------- |
| `VLC_OAUTH_JWT_SECRET`            | `openssl rand -base64 64`                     |
| `VLC_OAUTH_ISSUER`                | `https://api.vectorless.store`                |
| `VLC_OAUTH_ACCESS_TOKEN_TTL`      | `900`                                         |
| `VLC_OAUTH_REFRESH_TOKEN_TTL`     | `2592000`                                     |
| `VLC_OAUTH_MCP_RESOURCE_URL`      | `https://mcp.vectorless.store/api/mcp`        |
| `VLC_DASHBOARD_URL`               | `https://vectorless.store`                    |
| `VLC_DASHBOARD_SERVICE_TOKEN`     | `openssl rand -base64 48`                     |
| `VLC_SESSION_COOKIE_DOMAIN`       | `.vectorless.store`                            |
| `VLC_SESSION_SECURE`              | `true`                                         |

### 1c. Deploy and smoke-test

```bash
curl https://api.vectorless.store/.well-known/oauth-authorization-server
# → 200 with discovery JSON

curl -X POST https://api.vectorless.store/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{"client_name":"smoke-test","redirect_uris":["http://127.0.0.1:9999/callback"]}'
# → 201 with { client_id, ... }
```

## 2. Dashboard (Next.js apps/web)

### 2a. Vercel project setup

In the Vercel project for `apps/web`:

1. Add **two domains**: `vectorless.store` and `mcp.vectorless.store`. Both
   point at the same project. `mcp.vectorless.store` exists so AI clients
   have a clean URL — every route works on both.
2. Set environment variables:

| Variable                           | Value                                      |
| ---------------------------------- | ------------------------------------------ |
| `CONTROL_PLANE_URL`                | `https://api.vectorless.store`             |
| `CONTROL_PLANE_SERVICE_TOKEN`      | (same as `VLC_DASHBOARD_SERVICE_TOKEN`)    |
| `BETTER_AUTH_SECRET`               | `openssl rand -base64 48`                  |
| `BETTER_AUTH_URL`                  | `https://vectorless.store`                 |
| `NEXT_PUBLIC_APP_URL`              | `https://vectorless.store`                 |
| `COOKIE_DOMAIN`                    | `.vectorless.store`                        |
| `GOOGLE_CLIENT_ID` / `_SECRET`     | (your Google OAuth app)                    |
| `GITHUB_CLIENT_ID` / `_SECRET`     | (your GitHub OAuth app)                    |

3. Deploy from the `main` branch.

### 2b. Verify

```bash
# Discovery
curl https://mcp.vectorless.store/.well-known/oauth-protected-resource
# → { "resource": "https://mcp.vectorless.store/api/mcp",
#     "authorization_servers": ["https://api.vectorless.store"], ... }

# Login flow
# Browse to https://vectorless.store/login, sign up, verify the
# user appears in control plane's auth_users table.
```

### 2c. End-to-end MCP test

Using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

1. Run `npx @modelcontextprotocol/inspector`
2. Configure URL `https://mcp.vectorless.store/api/mcp`, Streamable HTTP transport
3. Click Connect — should redirect through `vectorless.store/oauth/consent`
4. Approve, get redirected back, MCP session active
5. Call `tools/list` — returns 7 scope-filtered tools
6. Call `vectorless_list_documents` — returns the user's org's documents

## 3. Deprecate the old npm package

After the remote MCP is verified working:

```bash
npm deprecate vectorless-mcp \
  "Use the remote MCP at https://mcp.vectorless.store/api/mcp. See https://docs.vectorless.store/mcp for setup."
```

This shows a yellow warning to anyone still installing the package and
points them at the new URL. The old versions stay published (npm
doesn't allow unpublishing after 24h).

## 4. Update AI Client Docs

Replace the old "stdio install" docs with:

```json
{
  "mcpServers": {
    "vectorless": {
      "url": "https://mcp.vectorless.store/api/mcp"
    }
  }
}
```

## Outstanding Work (post-cutover)

The following are still backed by the dashboard's local Drizzle DB
and need control plane endpoints + adapter rewrites:

- `apps/web/lib/actions/api-keys.ts` (could use `/admin/v1/orgs/{orgId}/api-keys` already)
- `apps/web/lib/actions/llm-keys.ts` (needs new control plane endpoints)
- `apps/web/lib/actions/connected-apps.ts` (read consents from `/admin/v1/orgs/{orgId}/oauth-consents`)
- `apps/web/lib/actions/documents.ts` (forward to control plane `/v1/documents`)
- `apps/web/lib/actions/playground.ts` (forward to control plane `/v1/query`)

Once those are done, the dashboard's `apps/web/lib/db/` and
`drizzle.config.ts` can be deleted entirely and `drizzle-orm` /
`@neondatabase/serverless` removed from dependencies.
