# Vectorless -- Deployment Plan

## Domain: vectorless.store (Spaceship registrar)

## Architecture

```
                         vectorless.store
                               |
            +------------------+------------------+
            |                                     |
    vectorless.store              api.vectorless.store
    (Marketing + Dashboard)       (Fastify API Server)
    Cloudflare Pages              Railway
            |                          |
            +----------+    +---------+----------+
                       |    |         |          |
                    Neon DB  Neon DB  R2      QStash
                  (dashboard) (api)  (files) (jobs)

    npm: vectorless          PyPI: vectorless
    (TypeScript SDK)         (Python SDK)
```

---

## 1. DNS Setup (Spaceship → Cloudflare)

Transfer DNS management to Cloudflare for free CDN, DDoS protection, and Pages integration.

### Steps:
1. **Add site to Cloudflare**: Go to https://dash.cloudflare.com → Add Site → `vectorless.store` → Free plan
2. **Cloudflare gives you nameservers** (e.g., `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
3. **Update nameservers in Spaceship**: Login to Spaceship → Domain → `vectorless.store` → Nameservers → Custom → paste the Cloudflare nameservers
4. **Wait 24-48h** for propagation (usually faster)
5. **Add DNS records in Cloudflare**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | `vectorless.pages.dev` | Proxied |
| CNAME | `www` | `vectorless.pages.dev` | Proxied |
| CNAME | `api` | `your-app.up.railway.app` | DNS only |
| CNAME | `docs` | `vectorless.pages.dev` | Proxied |

**Note**: Railway custom domains require "DNS only" (grey cloud), not "Proxied" (orange cloud).

---

## 2. Dashboard + Marketing Site → Cloudflare Pages

**URL**: `vectorless.store` (+ `www.vectorless.store`)

### What gets deployed
The Next.js app at `apps/web/` — includes:
- Marketing landing page (`/`)
- Auth pages (`/login`, `/register`)
- Dashboard (`/dashboard/*`)
- API docs, settings, playground

### Setup Steps

1. **Go to** Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git

2. **Connect GitHub**: Authorize → Select `vectorlessflow/vectorless`

3. **Configure build settings:**
   ```
   Project name:         vectorless
   Production branch:    main
   Framework preset:     Next.js (Static HTML Export)
   Root directory:       apps/web
   Build command:        npx @cloudflare/next-on-pages
   Build output:         .vercel/output/static
   ```

   **If `@cloudflare/next-on-pages` has issues with server components**, switch to Vercel:
   ```
   Framework preset:     Next.js
   Root directory:       apps/web
   Build command:        next build
   ```

4. **Environment variables** (Settings → Environment Variables):
   ```
   NODE_VERSION=20

   # Database (Neon — dashboard DB)
   DATABASE_URL=postgresql://neondb_owner:npg_ntkCOeiyK9D5@ep-dry-flower-am6y9u6t.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require

   # Auth
   BETTER_AUTH_SECRET=0bbdfbb40bfa6cc73b1782f3ea61f96f113e6d682d1543e6becc3f77b29deb78
   BETTER_AUTH_URL=https://vectorless.store
   NEXT_PUBLIC_APP_URL=https://vectorless.store

   # API Connection (points to Railway)
   VECTORLESS_API_URL=https://api.vectorless.store
   VECTORLESS_INTERNAL_API_KEY=vl_live_sk_...  (generate from dashboard)
   ```

5. **Custom domain**: Pages → Custom domains → Add `vectorless.store` + `www.vectorless.store`

6. **SSL**: Automatic (Cloudflare handles it)

### Fallback: Vercel

If Cloudflare Pages doesn't work well with the Next.js server components:
1. Go to https://vercel.com → Import → `vectorlessflow/vectorless`
2. Root directory: `apps/web`
3. Same environment variables as above
4. Custom domain: `vectorless.store` → add CNAME in Cloudflare pointing to `cname.vercel-dns.com`

---

## 3. API Server → Railway

**URL**: `api.vectorless.store`

### What gets deployed
The Fastify server at `apps/api/` — handles:
- Document upload, parsing, ingestion
- ToC generation (with Vertex AI Gemini)
- Section storage and retrieval
- API key authentication
- QStash webhook callbacks
- LLM key management (BYOK)

### Option A: Deploy via Railway Dashboard (easiest)

1. **Create account** at https://railway.app
2. **New Project** → Deploy from GitHub → Select `vectorlessflow/vectorless`
3. **Settings**:
   ```
   Root Directory:    apps/api
   Build Command:     pnpm install && pnpm --filter=@vectorless/shared build && pnpm --filter=@vectorless/api build
   Start Command:     node dist/server.js
   ```
4. **Set environment variables** (see section below)
5. **Generate domain**: Settings → Networking → Generate Domain → gives you `xxxx.up.railway.app`
6. **Custom domain**: Settings → Networking → Custom Domain → `api.vectorless.store`
7. **Update Cloudflare DNS**: Add CNAME `api` → `xxxx.up.railway.app` (DNS only, grey cloud)

### Option B: Deploy via Dockerfile

Create this at the monorepo root:

```
apps/api/Dockerfile
```

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app

RUN npm install -g pnpm@10

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json packages/shared/tsup.config.ts ./packages/shared/
COPY apps/api/package.json apps/api/tsconfig.json apps/api/tsup.config.ts ./apps/api/

RUN pnpm install --frozen-lockfile

COPY packages/shared/src/ packages/shared/src/
COPY apps/api/src/ apps/api/src/
COPY apps/api/.env apps/api/.env

RUN pnpm --filter=@vectorless/shared build
RUN pnpm --filter=@vectorless/api build

FROM node:20-slim
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/vertex-credentials.json ./vertex-credentials.json 2>/dev/null || true

ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/server.js"]
```

Railway auto-detects the Dockerfile if present.

### Environment Variables (Railway)

```bash
# Database (Neon — API DB)
DATABASE_URL=postgresql://neondb_owner:npg_2BHZCo8iMlKq@ep-frosty-smoke-amnx2ayn.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require

# Cloudflare R2
R2_ACCOUNT_ID=c8bea05e04728d860333b91cf095340b
R2_ACCESS_KEY_ID=49ac853162ee9e1e4e06b0481bfac97e
R2_SECRET_ACCESS_KEY=f005043b14c95ccd08eea6b8369d581073f2df950c810fe057b8cfb3f72f787c
R2_BUCKET_NAME=vectorless
R2_PUBLIC_URL=https://c8bea05e04728d860333b91cf095340b.r2.cloudflarestorage.com/vectorless

# QStash
QSTASH_URL=https://qstash-us-east-1.upstash.io
QSTASH_TOKEN=eyJVc2VySUQiOiI5MDk3Y2QxOC01OTBhLTRkYmYtYjgyOS0xMGMwZjViZmMyNzkiLCJQYXNzd29yZCI6IjYxOGJlYjFiMDNmZTQ5NGFiNjc2MGUwZmZhMTdkMjIzIn0=
QSTASH_CURRENT_SIGNING_KEY=sig_5zFWRHkMzYy546bc5GPm28CfXD38
QSTASH_NEXT_SIGNING_KEY=sig_5XBxt9T7pfWACuwGYb7WRNFWdEnA

# IMPORTANT: Update this to Railway's public URL after first deploy
API_BASE_URL=https://api.vectorless.store
PORT=3001

# LLM (Vertex AI Gemini)
LLM_PROVIDER=gemini
GOOGLE_CLOUD_PROJECT=ai-projects-481815
GOOGLE_CLOUD_LOCATION=us-central1

# For Vertex AI auth, base64-encode the credentials JSON:
#   base64 -w0 vertex-credentials.json
# Then set GOOGLE_APPLICATION_CREDENTIALS_JSON and decode at startup
# OR: Mount the file via Railway volume

# Auth
BETTER_AUTH_SECRET=0bbdfbb40bfa6cc73b1782f3ea61f96f113e6d682d1543e6becc3f77b29deb78
```

### Handling Vertex AI Credentials on Railway

The `vertex-credentials.json` file can't be committed to git. Two options:

**Option A: Base64 env var (recommended)**
```bash
# Locally, encode the credentials:
base64 -w0 apps/api/vertex-credentials.json
# Copy the output and set as env var in Railway:
GOOGLE_CREDENTIALS_BASE64=ewogICJ0eXBl...
```
Then decode at startup in `config.ts` (code change needed).

**Option B: Railway volume**
Mount a persistent volume, upload the JSON file once via Railway CLI.

---

## 4. SDK Publishing

### TypeScript SDK → npm

```bash
# Manual publish
cd packages/ts-sdk && pnpm build && npm publish --access public

# CI publish (on git tag)
git tag ts-sdk-v0.1.0 && git push --tags
# → .github/workflows/publish-ts-sdk.yml runs automatically
```

**Requirements:**
- npm account → generate Automation token
- Add `NPM_TOKEN` to GitHub repo secrets

### Python SDK → PyPI

```bash
# Manual publish
cd sdks/python && uv build && uv publish --token pypi-YOUR-TOKEN

# CI publish (on git tag)
git tag py-sdk-v0.2.0 && git push --tags
# → .github/workflows/publish-py-sdk.yml runs automatically
```

**Requirements:**
- You already own `vectorless` on PyPI
- Generate new API token at PyPI → Account Settings → API Tokens
- Add `PYPI_TOKEN` to GitHub repo secrets

---

## 5. Deployment Order (Step by Step)

### Phase 1: DNS & Infrastructure

- [ ] Add `vectorless.store` to Cloudflare (get nameservers)
- [ ] Update Spaceship nameservers to Cloudflare's
- [ ] Wait for DNS propagation (~1-24 hours)

### Phase 2: API Server (Railway)

- [ ] Create Railway account at https://railway.app
- [ ] Connect GitHub repo `vectorlessflow/vectorless`
- [ ] Create service → Root directory: `apps/api`
- [ ] Set all environment variables (see list above)
- [ ] Deploy → get Railway public URL (e.g., `vectorless-api.up.railway.app`)
- [ ] Test: `curl https://vectorless-api.up.railway.app/health`
- [ ] Add custom domain: `api.vectorless.store`
- [ ] Add CNAME in Cloudflare: `api` → Railway URL (DNS only)
- [ ] Update `API_BASE_URL` env to `https://api.vectorless.store`
- [ ] Redeploy
- [ ] Test: `curl https://api.vectorless.store/health`

### Phase 3: Dashboard (Cloudflare Pages)

- [ ] Cloudflare → Pages → Create → Connect GitHub → `vectorlessflow/vectorless`
- [ ] Configure: Root directory `apps/web`, framework Next.js
- [ ] Set environment variables (DATABASE_URL, auth, API URL)
- [ ] Deploy → get `vectorless.pages.dev`
- [ ] Test: visit `https://vectorless.pages.dev` → marketing page loads
- [ ] Test: login/register works
- [ ] Add custom domain: `vectorless.store` + `www.vectorless.store`
- [ ] Update env vars: `BETTER_AUTH_URL` + `NEXT_PUBLIC_APP_URL` → `https://vectorless.store`
- [ ] Redeploy
- [ ] Test: `https://vectorless.store` → everything works

### Phase 4: QStash Webhook

- [ ] Update QStash callback URL in env: `API_BASE_URL=https://api.vectorless.store`
- [ ] Test: upload a document via API → QStash delivers webhook → ingestion completes
- [ ] Verify in Upstash console: webhook delivered successfully

### Phase 5: SDK Publishing

- [ ] Create npm account, generate token, add as `NPM_TOKEN` GitHub secret
- [ ] Generate PyPI token, add as `PYPI_TOKEN` GitHub secret
- [ ] Publish TS SDK: `git tag ts-sdk-v0.1.0 && git push --tags`
- [ ] Verify: `npm install vectorless` → test import
- [ ] Publish Python SDK: `git tag py-sdk-v0.2.0 && git push --tags`
- [ ] Verify: `pip install vectorless --upgrade` → test import

### Phase 6: End-to-End Verification

- [ ] `curl https://api.vectorless.store/health` → OK
- [ ] Sign up on `https://vectorless.store` → create account
- [ ] Generate API key in dashboard
- [ ] Upload document via dashboard UI → verify processing
- [ ] Test TypeScript SDK against production:
      ```typescript
      const client = new VectorlessClient({ apiKey: "vl_...", baseUrl: "https://api.vectorless.store" });
      const result = await client.addDocument(file);
      ```
- [ ] Test Python SDK against production:
      ```python
      client = VectorlessClient(api_key="vl_...", base_url="https://api.vectorless.store")
      result = client.add_document("doc.pdf")
      ```
- [ ] Check analytics in dashboard
- [ ] Configure BYOK key in Settings → LLM Keys
- [ ] Upload another document → verify it uses BYOK key

---

## 6. Domain Structure

| URL | What | Platform |
|-----|------|----------|
| `vectorless.store` | Marketing site + Dashboard | Cloudflare Pages |
| `www.vectorless.store` | Redirects to above | Cloudflare Pages |
| `api.vectorless.store` | REST API for SDKs | Railway |
| `docs.vectorless.store` | API documentation (future) | Cloudflare Pages |

---

## 7. Cost Estimate (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| **Railway** (API server) | Hobby | $5/mo |
| **Cloudflare Pages** (Dashboard) | Free | $0 |
| **Cloudflare R2** (File storage) | Free tier (10GB) | $0 |
| **Cloudflare DNS** | Free | $0 |
| **Neon** (2x Postgres) | Free tier (0.5GB each) | $0 |
| **Upstash QStash** | Free tier (500 msgs/day) | $0 |
| **Vertex AI / Gemini** | Pay per use | ~$0.001/page |
| **Spaceship** (domain) | Annual | ~$10/yr |
| **npm** (TS SDK) | Free (public) | $0 |
| **PyPI** (Python SDK) | Free | $0 |
| **GitHub** (repo + actions) | Free (public) | $0 |
| **Total** | | **~$6/mo** |

---

## 8. Auto-Deploy Configuration

### Railway (API)
Railway auto-deploys on push to `main` by default. Configure:
- **Auto-deploy**: ON (pushes to main → instant deploy)
- **Branch deploys**: OFF (only main)
- **Health check**: `GET /health` → 200

### Cloudflare Pages (Dashboard)
Pages auto-deploys on push to `main` by default. Configure:
- **Production branch**: `main`
- **Preview deployments**: ON (every PR gets a preview URL)
- **Build cache**: ON

### SDK Publishing
Manual via git tags — NOT auto-deploy. You control when to publish:
```bash
# Only when you're ready to release:
git tag ts-sdk-v0.1.0 && git push --tags    # → npm
git tag py-sdk-v0.2.0 && git push --tags    # → PyPI
```
