# Vectorless -- Deployment Plan

## Domain: vectorless.store (Spaceship registrar)

## Architecture

```
                         vectorless.store
                               |
            +------------------+------------------+
            |                                     |
    vectorless.store              api.vectorless.store
    (Marketing + Dashboard)       (Hono API — Serverless)
    Vercel (Next.js)              Vercel (Serverless Functions)
            |                          |
            +----------+    +---------+----------+----------+
                       |    |         |          |          |
                    Neon DB  Neon DB  R2       QStash    Upstash
                  (dashboard) (api)  (files)  (jobs)    Redis
                                     (CF)              (rate-limit)

    npm: vectorless          npm: vectorless-mcp
    (TypeScript SDK)         (MCP Server)

    PyPI: vectorless-sdk
    (Python SDK)
```

---

## 1. DNS Setup (Spaceship → Cloudflare)

Transfer DNS management to Cloudflare for free CDN, DDoS protection, and caching.

### Steps:
1. **Add site to Cloudflare**: Go to https://dash.cloudflare.com → Add Site → `vectorless.store` → Free plan
2. **Cloudflare gives you nameservers** (e.g., `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
3. **Update nameservers in Spaceship**: Login to Spaceship → Domain → `vectorless.store` → Nameservers → Custom → paste the Cloudflare nameservers
4. **Wait 24-48h** for propagation (usually faster)
5. **Add DNS records in Cloudflare**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | DNS only |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only |
| CNAME | `api` | `cname.vercel-dns.com` | DNS only |

**Note**: Vercel custom domains require "DNS only" (grey cloud), not "Proxied" (orange cloud).

---

## 2. Dashboard + Marketing Site → Vercel

**URL**: `vectorless.store` (+ `www.vectorless.store`)

### What gets deployed
The Next.js app at `apps/web/` — includes:
- Marketing landing page (`/`)
- Auth pages (`/login`, `/register`)
- Dashboard (`/dashboard/*`)
- OAuth consent screen (`/oauth/consent`)
- Connected Apps, Usage, Billing pages

### Setup Steps

1. **Go to** https://vercel.com → Import → Connect GitHub → Select `hallelx2/vectorless`
2. **Configure**:
   ```
   Root Directory:       apps/web
   Framework Preset:     Next.js
   Build Command:        next build
   Output Directory:     .next
   ```
3. **Custom domain**: Settings → Domains → Add `vectorless.store` + `www.vectorless.store`

### Environment Variables (Vercel — Dashboard)

```bash
# Database (Neon — dashboard DB, shared with API)
DATABASE_URL=postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb?sslmode=require

# Auth (Better Auth)
BETTER_AUTH_SECRET=<64-byte hex>
BETTER_AUTH_URL=https://vectorless.store
NEXT_PUBLIC_APP_URL=https://vectorless.store

# API Connection (points to Vercel API project)
NEXT_PUBLIC_API_URL=https://api.vectorless.store

# GitHub / Google OAuth (social login)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Node version
NODE_VERSION=20
```

---

## 3. API Server → Vercel (Serverless Functions)

**URL**: `api.vectorless.store`

### What gets deployed
The Hono API at `apps/api/` running as a Vercel Serverless Function via `apps/api/api/index.ts`. Handles:
- Document upload, parsing, ingestion
- ToC generation (with Gemini)
- Section storage and retrieval
- API key + OAuth JWT authentication
- MCP server (Model Context Protocol) over HTTP
- OAuth 2.1 provider (DCR, authorize, token, revoke, introspect)
- Rate limiting and quota enforcement
- QStash webhook callbacks

### Setup Steps

1. **Create a second Vercel project** for the API:
   - Import same repo `hallelx2/vectorless`
   - **Root Directory**: `apps/api`
   - **Framework Preset**: Other
   - **Build Command**: (leave empty — `vercel.json` handles it)
   - Vercel detects `vercel.json` and uses the serverless function at `api/index.ts`

2. **Custom domain**: Settings → Domains → Add `api.vectorless.store`
3. **Update Cloudflare DNS**: Add CNAME `api` → `cname.vercel-dns.com` (DNS only)
4. **Function settings**: The `vercel.json` already sets `maxDuration: 300` (5 min) for the API function

### Environment Variables (Vercel — API)

```bash
# ── Database ──
DATABASE_URL=postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb?sslmode=require

# ── Cloudflare R2 (file storage) ──
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=vectorless
R2_PUBLIC_URL=https://<account-id>.r2.cloudflarestorage.com/vectorless

# ── Upstash QStash (background jobs) ──
QSTASH_URL=https://qstash-us-east-1.upstash.io
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...

# ── API config ──
API_BASE_URL=https://api.vectorless.store
PORT=3001

# ── LLM (Gemini) ──
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
GOOGLE_CLOUD_PROJECT=...
GOOGLE_CLOUD_LOCATION=us-central1

# ── Auth ──
BETTER_AUTH_SECRET=<same-as-dashboard>

# ── OAuth 2.1 (MCP + third-party client auth) ──
OAUTH_JWT_SECRET=<64-byte hex, generate with: openssl rand -hex 32>
OAUTH_ISSUER=https://api.vectorless.store
OAUTH_ACCESS_TOKEN_TTL_SECONDS=900
OAUTH_REFRESH_TOKEN_TTL_SECONDS=2592000

# ── Dashboard URL (for OAuth redirect to consent screen) ──
DASHBOARD_URL=https://vectorless.store

# ── Upstash Redis (rate limiting) ──
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

### How the API runs on Vercel

The `vercel.json` in `apps/api/` configures:
1. **Install**: Builds workspace dependencies (`@vectorless/shared`, `vectorless`, `@vectorless/mcp-tools`)
2. **Rewrites**: All routes (`/(.*)`) → `/api` (the single serverless function)
3. **Function**: `api/index.ts` — adapts Node.js req/res to Hono's Fetch API

The Hono app handles routing internally — all paths like `/v1/documents`, `/mcp`, `/oauth/register`, `/.well-known/*` are served by the same function.

---

## 4. Upstash Services Setup

### QStash (Background Jobs)
Already configured. Used for:
- Async document ingestion
- Nightly cleanup cron (`POST /v1/webhooks/cleanup` at 03:00 UTC)

### Redis (Rate Limiting) — NEW
1. Go to https://console.upstash.com → Create Database → Select region closest to Neon DB
2. Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Add to Vercel env vars for the API project
4. Free tier: 10k commands/day (sufficient for pre-launch)

Used for:
- Per-user sliding-window rate limits (query, ingest, tree_nav)
- Per-IP DCR abuse protection (5 registrations/hour)

**Note**: If Redis is not configured, the API falls back to in-memory rate limiting. This works for single-instance dev but is unreliable on serverless (each lambda has its own counter).

---

## 5. Database Migrations

### Initial setup (already done)
```bash
cd apps/api
pnpm db:push   # Push schema directly for first-time setup
```

### Applying new migrations
```bash
cd apps/api

# Generate migration from schema changes (already done — 0002_happy_night_thrasher.sql)
pnpm db:generate

# Apply to local dev DB
pnpm db:migrate

# Apply to production (set DATABASE_URL to production Neon URL)
DATABASE_URL="postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require" pnpm db:migrate
```

### Current migrations
| File | Tables |
|------|--------|
| `0000_warm_mattie_franklin.sql` | projects, api_keys, documents, sections, query_logs, section_relationships |
| `0001_flawless_human_torch.sql` | llm_keys |
| `0002_happy_night_thrasher.sql` | oauth_clients, oauth_authorization_codes, oauth_refresh_tokens, oauth_consents, oauth_revoked_jtis, user_plans, usage_records |

---

## 6. SDK & MCP Publishing

### TypeScript SDK → npm (`vectorless`)

```bash
cd packages/ts-sdk && pnpm build && npm publish --access public

# Or via CI (on git tag)
git tag ts-sdk-v0.1.1 && git push --tags
```

### MCP Server → npm (`vectorless-mcp`)

```bash
cd apps/mcp-stdio && pnpm build && npm publish --access public

# Or via CI (on git tag)
git tag mcp-v1.0.0 && git push --tags
```

### Python SDK → PyPI (`vectorless-sdk`)

```bash
cd sdks/python && uv build && uv publish --token pypi-YOUR-TOKEN

# Or via CI (on git tag)
git tag py-sdk-v0.2.0 && git push --tags
```

**Requirements:**
- npm: Generate Automation token → add as `NPM_TOKEN` GitHub secret
- PyPI: Generate API token → add as `PYPI_TOKEN` GitHub secret

---

## 7. QStash Cron Jobs

Set up in the Upstash QStash console:

| Endpoint | Schedule | Purpose |
|----------|----------|---------|
| `POST https://api.vectorless.store/v1/webhooks/cleanup` | `0 3 * * *` (daily 03:00 UTC) | Clean up expired OAuth JTIs and auth codes |

---

## 8. Deployment Order (Step by Step)

### Phase 1: DNS & Infrastructure

- [ ] Add `vectorless.store` to Cloudflare (get nameservers)
- [ ] Update Spaceship nameservers to Cloudflare's
- [ ] Wait for DNS propagation (~1-24 hours)
- [ ] Create Upstash Redis database (for rate limiting)

### Phase 2: API Server (Vercel)

- [ ] Create Vercel project → Root directory: `apps/api`
- [ ] Set all environment variables (see list above)
- [ ] Apply database migration: `DATABASE_URL=<prod> pnpm db:migrate`
- [ ] Deploy → get Vercel URL
- [ ] Test: `curl https://<vercel-url>/health`
- [ ] Add custom domain: `api.vectorless.store`
- [ ] Add CNAME in Cloudflare: `api` → `cname.vercel-dns.com` (DNS only)
- [ ] Update `API_BASE_URL` env to `https://api.vectorless.store`
- [ ] Redeploy
- [ ] Test: `curl https://api.vectorless.store/health`

### Phase 3: Dashboard (Vercel)

- [ ] Create Vercel project → Root directory: `apps/web`
- [ ] Set environment variables
- [ ] Deploy → get Vercel URL
- [ ] Test: login/register works
- [ ] Add custom domains: `vectorless.store` + `www.vectorless.store`
- [ ] Update env vars: `BETTER_AUTH_URL` + `NEXT_PUBLIC_APP_URL` → `https://vectorless.store`
- [ ] Redeploy
- [ ] Test: `https://vectorless.store` → everything works

### Phase 4: QStash & Cron

- [ ] Set QStash callback URL: `API_BASE_URL=https://api.vectorless.store`
- [ ] Add cleanup cron job in QStash console
- [ ] Test: upload a document → QStash webhook fires → ingestion completes

### Phase 5: SDK & MCP Publishing

- [ ] Set NPM_TOKEN and PYPI_TOKEN in GitHub secrets
- [ ] Publish TS SDK: `npm publish` from `packages/ts-sdk`
- [ ] Publish MCP Server: `npm publish` from `apps/mcp-stdio`
- [ ] Publish Python SDK: `uv publish` from `sdks/python`
- [ ] Test: `npx vectorless-mcp` starts and lists 6 tools

### Phase 6: OAuth & MCP Verification

- [ ] Test well-known metadata: `curl https://api.vectorless.store/.well-known/oauth-authorization-server`
- [ ] Test DCR: `curl -X POST https://api.vectorless.store/oauth/register -d '{"client_name":"test","redirect_uris":["http://localhost:8080/cb"]}'`
- [ ] Test MCP over HTTP: `curl -X POST https://api.vectorless.store/mcp -H "Authorization: Bearer vl_..." -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`
- [ ] Test consent screen: visit `https://vectorless.store/oauth/consent?...`
- [ ] Test rate-limit headers: check `X-RateLimit-*` headers on API responses
- [ ] Test Claude Desktop: install `npx vectorless-mcp`, ask a question

### Phase 7: End-to-End Verification

- [ ] `curl https://api.vectorless.store/health` → OK
- [ ] Sign up on `https://vectorless.store` → create account
- [ ] Generate API key in dashboard
- [ ] Upload document via dashboard → verify processing
- [ ] Query document via API with SDK
- [ ] Check usage page in dashboard
- [ ] Check connected apps page
- [ ] Configure Claude Desktop with MCP server
- [ ] Ask Claude a question about your document → see traversal trace

---

## 9. Domain Structure

| URL | What | Platform |
|-----|------|----------|
| `vectorless.store` | Marketing site + Dashboard | Vercel (Next.js) |
| `www.vectorless.store` | Redirects to above | Vercel |
| `api.vectorless.store` | REST API + MCP + OAuth | Vercel (Serverless Functions) |

---

## 10. Cost Estimate (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| **Vercel** (Dashboard) | Hobby | $0 |
| **Vercel** (API) | Hobby / Pro | $0-20/mo |
| **Cloudflare R2** (File storage) | Free tier (10GB) | $0 |
| **Cloudflare DNS** | Free | $0 |
| **Neon** (Postgres) | Free tier (0.5GB) | $0 |
| **Upstash QStash** | Free tier (500 msgs/day) | $0 |
| **Upstash Redis** | Free tier (10k cmds/day) | $0 |
| **Gemini API** | Pay per use | ~$0.001/page |
| **Spaceship** (domain) | Annual | ~$10/yr |
| **npm** (TS SDK + MCP) | Free (public) | $0 |
| **PyPI** (Python SDK) | Free | $0 |
| **Total** | | **~$1/mo** |

---

## 11. Auto-Deploy Configuration

### Vercel (API + Dashboard)
Vercel auto-deploys on push to `main` by default. Configure per project:
- **Production branch**: `main`
- **Preview deployments**: ON (every PR gets a preview URL)
- **Root directory**: `apps/api` or `apps/web` (per project)

### SDK Publishing
Manual via git tags — NOT auto-deploy:
```bash
# Only when ready to release:
git tag ts-sdk-v0.1.1 && git push --tags    # → npm (vectorless)
git tag mcp-v1.0.0 && git push --tags       # → npm (vectorless-mcp)
git tag py-sdk-v0.2.0 && git push --tags    # → PyPI
```

---

## 12. Serverless Considerations

Since the API runs as Vercel Serverless Functions:

1. **Cold starts**: First request after idle may take 1-3s. Vercel Pro plan reduces this.
2. **Max duration**: Set to 300s (5 min) for document ingestion. Free tier max is 60s — upgrade to Pro if needed.
3. **Rate limiting**: Uses Upstash Redis (distributed). In-memory fallback won't work reliably on serverless — each invocation gets its own counter.
4. **MCP sessions**: Stateless per-request (no in-process session store). Safe for serverless.
5. **File uploads**: Vercel has a 4.5MB body limit on Hobby plan. For large documents, consider using presigned R2 URLs for direct upload.
