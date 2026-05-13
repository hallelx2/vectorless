# Vectorless deployment

End-to-end deploy of the private + open-source Vectorless stack to Cloud Run + Neon + R2, with the Vercel dashboard already shipping.

## Where things live

The Vectorless stack is split across multiple repos. Each open-source
repo ships its own self-contained `docker-compose.yml` so anyone can
`docker compose up` and have *that* piece working without cloning the
others:

| Repo | Status | Standalone compose | Image |
|---|---|---|---|
| `vectorless-engine` | OSS public | `vectorless-engine/docker-compose.yml` | `ghcr.io/hallelx2/vectorless-engine` |
| `vectorless-server` | OSS public | `vectorless-server/docker-compose.yml` | `ghcr.io/hallelx2/vectorless-server` |
| `vectorless-control-plane` | private | `vectorless-control-plane/docker-compose.yml` | private (build locally) |
| `vectorless-dashboard` | public, this repo | `apps/web/` lives here; deploy/ tooling lives here | runs on Vercel |

This `deploy/` tree is the **all-up** wiring: a single
`local/docker-compose.yml` that brings the whole stack up by pulling
the pre-built images, and Cloud Run scripts that do the same for prod.

### Two ways to bring up the local stack

```bash
# Default — pulls pre-built images from ghcr.io (fast, no Docker build):
docker compose -f deploy/local/docker-compose.yml up -d

# Build everything from your local source instead:
docker compose -f deploy/local/docker-compose.yml --profile build up -d --build
```

The `build` profile expects the other repos to be siblings of
`vectorless-dashboard/` on your filesystem:

```
~/your-workspace/
├── vectorless-dashboard/      ← this repo (deploy/ is inside)
├── vectorless-server/         ← github.com/hallelx2/vectorless-server
├── vectorless-engine/         ← github.com/hallelx2/vectorless-engine
├── vectorless-control-plane/  ← private
└── llmgate/                   ← LLM provider abstraction
```

If your checkout is different, edit the `context:` keys in
`local/docker-compose.yml` and the `PROJECT_ROOT` resolution in the
cloudrun scripts.

### Image publishing

Each OSS repo has a `.github/workflows/docker-publish.yml` that builds
on every push to `main` and every `vX.Y.Z` tag, pushing to
`ghcr.io/hallelx2/<repo>`. Anyone with `docker pull` can grab the
images — no auth needed for public repos.

## What we're actually deploying

```
AI clients ─┐
            ├─► mcp.vectorless.store ─┐
Dashboard ──┤    (same Next.js app on │
            │     Vercel as the       │
            │     dashboard)          ▼
            └─► api.vectorless.store ──► control-plane (Go, Cloud Run, port 9090)
                                         │  VLC_UPSTREAM_AUTH_TOKEN
                                         ▼
                                      vectorless-server (Go, Cloud Run, port 8080)
                                         │  embeds the engine in-process
                                         ▼
                                      Neon Postgres + Cloudflare R2 + Anthropic
```

Only **two Go services** need new infrastructure — `vectorless-server` (open source) and `vectorless-control-plane` (private). The "engine" isn't a separate service; the server binary embeds it. The dashboard and MCP both ship from the existing Vercel project.

## Phase order — do not skip

```
Phase 0  Local docker-compose          (free, validates the whole stack)
        ↓
Phase 1  Sign up Neon, R2, GCP         (15 min, real-world account setup)
        ↓
Phase 2  bootstrap.sh                  (create GCP project + Artifact Registry)
        ↓
Phase 3  deploy-server.sh              (server live at *.run.app)
        ↓
Phase 4  deploy-control-plane.sh       (CP live, wired to server)
        ↓
Phase 5  map-domain.sh                 (api.vectorless.store → CP)
        ↓
Phase 6  Vercel env update             (dashboard talks to the live CP)
        ↓
Phase 7  k6 stress test                (find the breakpoints)
```

---

## Phase 0 — Local validation (do this first)

You can verify the entire stack runs together on your laptop before paying for anything.

```bash
# 1. Set your Anthropic API key (or OpenAI / Gemini — see local/server.config.yaml)
export ANTHROPIC_API_KEY="sk-ant-..."

# 2. Bring up the stack — Postgres × 2, MinIO (S3-compatible), server, control-plane
cd deploy/local
docker compose up -d

# 3. Watch the logs come up clean
docker compose logs -f server control-plane

# 4. Smoke-test the server
curl http://localhost:8080/healthz                           # → 200

# 5. Smoke-test the control-plane
curl http://localhost:9090/.well-known/oauth-authorization-server   # → discovery JSON
```

When both health checks pass and you see no error logs, you know the stack actually works together. Tear down with `docker compose down -v`.

---

## Phase 1 — Cloud accounts

Three signups, all free to create:

1. **Neon** — <https://neon.tech> → create project `vectorless` → create two databases inside it: `server` and `control_plane`. Copy both connection strings.
2. **Cloudflare R2** — <https://dash.cloudflare.com> → R2 Object Storage → create bucket `vectorless-docs` → R2 → Manage R2 API Tokens → "Create API Token" with Read+Write on the bucket. Save the access key, secret key, and account endpoint URL (`https://<account-id>.r2.cloudflarestorage.com`).
3. **Google Cloud** — <https://console.cloud.google.com> → New Project `vectorless-prod` → enable billing (card required, but you stay in free tier). Note the project ID.

Save everything into `deploy/cloudrun/.env` (gitignored — file is generated by the bootstrap script):

```
PROJECT_ID=vectorless-prod
REGION=us-central1
ANTHROPIC_API_KEY=sk-ant-...
NEON_SERVER_URL=postgres://...neon.tech/server?sslmode=require
NEON_CP_URL=postgres://...neon.tech/control_plane?sslmode=require
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=vectorless-docs
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
```

---

## Phase 2 — Bootstrap GCP

```bash
./deploy/cloudrun/01-bootstrap.sh
```

This does:
- `gcloud config set project $PROJECT_ID`
- enables Cloud Run + Artifact Registry + Secret Manager APIs
- creates Artifact Registry repo `vectorless` in your region
- configures docker auth for `*.pkg.dev`

---

## Phase 3 — Deploy server

```bash
./deploy/cloudrun/02-deploy-server.sh
```

This does:
- builds `vectorless-server` image with the project-root build context
- pushes to `<region>-docker.pkg.dev/$PROJECT_ID/vectorless/server`
- generates `server.config.yaml` from `server.config.yaml.tpl` (fills in Neon + R2 + Anthropic)
- uploads as Cloud Run secret `server-config`
- deploys service `vectorless-server` with 256 MiB / 1 vCPU, mounts the secret as `/etc/vectorless/config.yaml`, command override `--config /etc/vectorless/config.yaml`
- prints the assigned `*.run.app` URL — copy it for the next phase

**Verify:**
```bash
SERVER_URL=$(gcloud run services describe vectorless-server --region us-central1 --format='value(status.url)')
curl $SERVER_URL/healthz                         # → 200
```

---

## Phase 4 — Deploy control-plane

```bash
./deploy/cloudrun/03-deploy-control-plane.sh
```

This does:
- builds `vectorless-control-plane` image
- pushes to Artifact Registry
- generates `control-plane.config.yaml`, fills in:
  - Neon control-plane DB URL
  - `VLC_UPSTREAM_URL` = the server's `*.run.app` URL from phase 3
  - `VLC_UPSTREAM_AUTH_TOKEN` = freshly-generated 48-byte token
  - `VLC_OAUTH_JWT_SECRET` = 64-byte secret
  - `VLC_DASHBOARD_SERVICE_TOKEN` = 48-byte token (also added to Vercel)
- **also** updates the server's secret with the same `VLS_AUTH_API_KEY` so the bearer token check matches
- uploads as `control-plane-config` secret
- deploys service `vectorless-control-plane`

**Verify:**
```bash
CP_URL=$(gcloud run services describe vectorless-control-plane --region us-central1 --format='value(status.url)')
curl $CP_URL/.well-known/oauth-authorization-server     # → discovery JSON
```

---

## Phase 5 — Map domain

```bash
./deploy/cloudrun/04-map-domain.sh api.vectorless.store
```

This does:
- `gcloud beta run domain-mappings create --domain api.vectorless.store --service vectorless-control-plane`
- prints the DNS records you need to add to your domain registrar

Then in Cloudflare (where vectorless.store is presumably hosted):
1. Add the CNAME record GCP prints (usually `ghs.googlehosted.com`)
2. Wait ~5 min for provisioning
3. Verify: `curl https://api.vectorless.store/.well-known/oauth-authorization-server`

---

## Phase 6 — Wire the dashboard

The dashboard's existing Vercel project needs these env vars updated:

```bash
cd vectorless-dashboard
vercel env add CONTROL_PLANE_URL production         # https://api.vectorless.store
vercel env add CONTROL_PLANE_SERVICE_TOKEN production  # paste VLC_DASHBOARD_SERVICE_TOKEN from phase 4
vercel env add NEXT_PUBLIC_APP_URL production       # https://vectorless.store
vercel env add COOKIE_DOMAIN production             # .vectorless.store
vercel --prod                                       # redeploy
```

(Better Auth secrets like `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID` should already be set from earlier.)

---

## Phase 7 — Stress test

```bash
# install k6 if you don't have it
scoop install k6     # or: choco install k6 / brew install k6 / winget install k6

# server hot path: doc upload + query
SERVER_URL=https://api.vectorless.store VLS_API_KEY=<key> k6 run deploy/stress/server.js

# control-plane OAuth + proxy path
CP_URL=https://api.vectorless.store k6 run deploy/stress/control-plane.js
```

See `deploy/stress/README.md` for what each script does and how to interpret the output.

---

## Cost expectations (free-tier path)

| Component | Free-tier limit | Realistic monthly bill at low usage |
|---|---|---|
| Cloud Run (server) | 2M req/mo + 360k GB-sec | $0 |
| Cloud Run (control-plane) | shares the same pool | $0 |
| Neon (Postgres × 2) | 0.5 GB storage, 191 compute hours | $0 |
| Cloudflare R2 | 10 GB storage + zero egress | $0 |
| Artifact Registry | 0.5 GB storage | $0 |
| Vercel (dashboard) | already on Hobby plan | $0 |
| Anthropic | pay-per-token | depends on your LLM usage |

You will likely run $0 of cloud bill at dev/early traffic. The only metered cost is your LLM provider.
