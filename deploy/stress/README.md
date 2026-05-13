# Stress tests

Two k6 scripts that exercise the hot paths once the stack is deployed.

## Install k6

```bash
# Windows
winget install k6 --source winget        # or `scoop install k6`

# macOS
brew install k6

# Linux
sudo apt-get update && sudo apt-get install -y k6
```

## Server hot path — `server.js`

Hits the server directly with a bearer token. Useful for understanding
the engine's raw retrieval performance independent of OAuth + proxy
overhead.

```bash
SERVER_URL=https://api.vectorless.store \
VLS_API_KEY="$(grep ^UPSTREAM_AUTH_TOKEN deploy/cloudrun/.env | cut -d= -f2)" \
DOC_ID=<existing-doc-id> \
k6 run deploy/stress/server.js
```

What it does:

- 5 min ramp from 0 → 50 virtual users
- Each VU does 1 query/sec against `/v1/query` with `doc_id`
- Reports p95, p99 latency + error rate

Pass/fail thresholds (configured inline):

- `http_req_duration p95 < 3000ms` — the engine must answer in <3s at p95
- `http_req_failed rate < 0.01` — less than 1% of queries should error

## Control-plane proxy path — `control-plane.js`

Goes through the OAuth introspect → upstream proxy path that the
real dashboard / MCP take. Catches issues with the bearer-token
validation hop and CP→server connection pooling.

```bash
CP_URL=https://api.vectorless.store \
JWT="$(node deploy/stress/mint-jwt.js)" \
DOC_ID=<existing-doc-id> \
k6 run deploy/stress/control-plane.js
```

The `mint-jwt.js` helper mints a short-lived JWT against
`VLC_OAUTH_JWT_SECRET` so you can stress the auth path without
running real OAuth client registrations.

## Interpreting output

k6 prints a summary at the end. Pay attention to:

- **`http_req_duration` p95 / p99** — the slow-tail latency
- **`http_req_failed`** — error rate; should be near 0
- **`vus_max`** — peak concurrency you sustained
- **`iterations` total** — how many queries completed

If p95 > 3s or errors > 1%, Cloud Run is probably cold-starting too
often. Try:
1. Increase `--min-instances` from 0 to 1 (costs ~$5/mo per service)
2. Increase `--concurrency` so a single instance handles more
3. Increase `--cpu` and `--memory` so the LLM call doesn't queue
