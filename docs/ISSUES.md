# Vectorless — Launch Blocking Issues

> **Audit date:** 2026-04-14
> **Context:** Audit of the implemented MCP server, OAuth 2.1 provider, and rate-limiting work against `docs/MCP_AND_AUTH_PLAN.md`.
> **Status:** A lot of code is written and correct. Three specific gaps will stop the stack from running in production. This doc lists them with exact fix recipes in the order they must be addressed.

---

## Summary

| # | Blocker | Severity | Est. fix time | Owner |
|---|---|---|---|---|
| 1 | New tables have no migration file | 🔴 Hard block — runtime crash | 30 min | backend |
| 2 | OAuth consent screen page does not exist | 🔴 Hard block — OAuth 404s | 0.5 day | frontend |
| 3 | Rate-limit / quota middleware is not wired to any route | 🔴 Soft block — no enforcement | 1 hour | backend |
| 4 | Rate-limit store is in-memory, not Upstash | 🟡 Serverless-breaking | 1 hour | backend |
| 5 | MCP sessions kept in process memory | 🟡 Serverless fragility | 1 hour | backend |
| 6 | `handleMcpRequest` hand-rolled Node req/res mock | 🟡 Fragile, needs tests | testing | backend |
| 7 | DCR has no abuse protection | 🟡 Abuse risk | 30 min | backend |
| 8 | No cleanup for `oauth_revoked_jtis` | 🟢 Grows unbounded | 30 min | backend |
| 9 | Missing env vars in `DEPLOYMENT.md` | 🟢 Docs | 15 min | docs |
| 10 | No integration tests for MCP / OAuth / rate-limit | 🟡 Launch risk | 0.5 day | testing |

**Total estimated time to unblock launch:** ~2 focused days.

---

## What's already working (do not touch)

Before the blockers, here is what the audit confirmed is implemented correctly and should not be refactored:

- **`packages/mcp-tools/`** — all 6 tool definitions, Zod schemas, `scopeForTool` mapping, clean exports. Matches the plan.
- **`apps/mcp-stdio/`** — `bin` entry, tsup build, `@modelcontextprotocol/sdk@^1.12`, zod input validation, secret scrubbing in error messages. `handlers.ts` additionally server-side fetches URL sources into buffers (improvement over the original plan).
- **`apps/api/src/routes/mcp.ts`** — POST/GET/DELETE routes using `StreamableHTTPServerTransport`, session TTL cleanup, 30-min session timeout.
- **`apps/api/src/services/mcp-server.ts`** — scope-filtered `tools/list`, scope-enforced `tools/call`, scrubs both `vl_*` and `eyJ*` tokens from error messages.
- **`apps/api/src/routes/oauth.ts`** — full OAuth 2.1 surface: well-known metadata (RFC 8414 + RFC 9728), dynamic client registration (RFC 7591), authorize GET+POST, token endpoint for authorization_code + refresh_token grants, revoke (RFC 7009), introspect (RFC 7662), internal validate-request. PKCE S256 verification, single-use authorization codes, refresh rotation with parent chain tracking, JWT signing via `jose`, JTI revocation blacklist.
- **`apps/api/src/middleware/auth.ts`** — unified middleware that routes `vl_*` → API key path and `eyJ*` → OAuth JWT path, sets consistent `{projectId, apiKeyId, scopes, userId, clientId, plan}` on the Hono context.
- **`apps/api/src/config/plans.ts`** — exact numerical copy of Free/Pro/Enterprise limits from the plan.
- **`apps/api/src/db/schema.ts`** — `oauthClients`, `oauthAuthorizationCodes`, `oauthRefreshTokens`, `oauthConsents`, `oauthRevokedJtis`, `userPlans`, `usageRecords` are all defined on lines 243–355.
- **Dashboard routes exist:** `dashboard/connected-apps/page.tsx`, `dashboard/usage/page.tsx`, `dashboard/billing/page.tsx`.

---

## Blocker 1 — Missing Drizzle migration for the 7 new tables

**Severity:** 🔴 Hard block — the API will crash on any OAuth / quota / usage query with `relation "oauth_clients" does not exist`.

**Evidence:**
- `apps/api/src/db/migrations/` contains only `0000_warm_mattie_franklin.sql` and `0001_flawless_human_torch.sql`.
- Neither migration mentions `oauth_clients`, `user_plans`, or `usage_records`.
- The 7 new tables are defined in `apps/api/src/db/schema.ts` (lines 243–355) but have never been promoted to a migration file.

**Affected tables (all need to be in the new migration):**
1. `oauth_clients`
2. `oauth_authorization_codes`
3. `oauth_refresh_tokens`
4. `oauth_consents`
5. `oauth_revoked_jtis`
6. `user_plans`
7. `usage_records`

**Fix recipe:**

```bash
# From repo root
cd apps/api

# Generate migration SQL from schema.ts
pnpm drizzle-kit generate
# Expected output: apps/api/src/db/migrations/0002_<random>.sql

# Inspect the generated file — confirm it contains CREATE TABLE statements
# for ALL 7 tables above, plus any new indexes

# Apply to local dev DB
pnpm drizzle-kit migrate

# After verifying locally, apply to production Neon via your normal flow
# (either drizzle-kit migrate against prod URL, or commit the SQL and run
# it through your migration pipeline)
```

**Validation:**

```sql
-- Against the target DB
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'oauth_clients',
    'oauth_authorization_codes',
    'oauth_refresh_tokens',
    'oauth_consents',
    'oauth_revoked_jtis',
    'user_plans',
    'usage_records'
  )
ORDER BY table_name;
-- Must return 7 rows.
```

**Do this before deploying any code that touches the new tables to production.** If the migration runs on prod after the code lands, the time window between deploy and migration will produce 500s on every OAuth / usage request.

---

## Blocker 2 — OAuth consent screen missing in the dashboard

**Severity:** 🔴 Hard block — the entire OAuth flow is broken end-to-end.

**Evidence:**
- `apps/api/src/routes/oauth.ts:260–269` (GET `/oauth/authorize`) redirects to `${DASHBOARD_URL}/oauth/consent?...`.
- `apps/web/app/(auth)/` contains only: `login/`, `register/`, `forgot-password/`, `reset-password/`, `layout.tsx`.
- There is **no** `oauth/` folder.

**Consequence:** A client that starts the authorization code flow — including Claude Desktop after it self-registers via DCR — will successfully get redirected and then land on a 404.

**Files to create:**

```
apps/web/app/(auth)/oauth/
  consent/
    page.tsx        # the approve/deny screen
    actions.ts      # server action that POSTs to /oauth/authorize
  error/
    page.tsx        # fallback for invalid_client / expired_code / denied
```

**`consent/page.tsx` responsibilities:**

1. Parse query params: `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge`, `code_challenge_method`, `client_name`
2. Require an authenticated Better Auth session (redirect to `/login?next=/oauth/consent?...` if missing)
3. POST the query params to the existing backend endpoint `${VECTORLESS_API_URL}/oauth/internal/validate-request` (defined at `apps/api/src/routes/oauth.ts:727`) to verify the client exists, the redirect URI is registered, and the scopes are valid. This returns `{ valid, client: { id, name, logo_uri, policy_uri, tos_uri }, scopes }`.
4. Render the consent UI:

   ```
   [vectorless logo]

   {client_name}
   wants to connect to your Vectorless account

   This will allow {client_name} to:
     ☑ Read your documents and table-of-contents maps      (documents:read)
     ☑ Ask queries against your documents                  (query)
     ☑ Upload new documents on your behalf                 (documents:write)

   Project: [ Personal ▾ ]    ← user picks which project this grant is scoped to

   [ Cancel ]                              [ Allow access ]
   ```

5. On **Allow access**, call a server action that POSTs to `${VECTORLESS_API_URL}/oauth/authorize` with JSON body:

   ```json
   {
     "client_id": "...",
     "redirect_uri": "...",
     "scope": "documents:read query",
     "state": "...",
     "code_challenge": "...",
     "code_challenge_method": "S256",
     "user_id": "<from session>",
     "project_id": "<from project picker>",
     "approved": true
   }
   ```

   The backend returns a 302 to the client's `redirect_uri` with `?code=...&state=...`. The server action should follow that redirect or extract the Location header and return it to the browser.

6. On **Cancel**, same POST but with `"approved": false`. Backend returns a 302 with `?error=access_denied`.

**`error/page.tsx` responsibilities:**

Simple client-side rendering of `error` and `error_description` query params with a "Return to Vectorless" button linking to `/dashboard`.

**Security notes:**
- The dashboard MUST be served from the same origin as the session cookie that Better Auth issues. If the dashboard is on `vectorless.store` and the API is on `api.vectorless.store`, the consent page's POST to `/oauth/authorize` must either be cross-origin with CORS + credentials, or go through a Next.js server action that calls the API server-to-server and forwards the Location header.
- Use a CSRF token on the form (Next.js server actions handle this).
- Validate `redirect_uri` on the client side as well — defense in depth.

**Test plan:**

```bash
# 1. Manual — open the browser to:
#    http://localhost:3000/oauth/consent?client_id=test&redirect_uri=http://localhost:8080/cb&scope=documents:read+query&state=xyz&code_challenge=abc&code_challenge_method=S256&client_name=Test+Client
# 2. Should show the consent card
# 3. Click Allow — should 302 to http://localhost:8080/cb?code=...&state=xyz
# 4. Click Cancel — should 302 to http://localhost:8080/cb?error=access_denied&state=xyz
```

---

## Blocker 3 — Rate-limit / quota middleware is not wired to any route

**Severity:** 🔴 Soft block — the middleware exists but is dead code. Production traffic has zero enforcement.

**Evidence:**
- `apps/api/src/middleware/rate-limit.ts` exports `rateLimitFor` — never imported.
- `apps/api/src/middleware/quota.ts` exports `quotaCheck` and `recordUsage` — never imported.
- Grepping `apps/api/src/routes/` for `rateLimitFor|quotaCheck|recordUsage` returns zero matches.

**Files to modify:**

### `apps/api/src/routes/query.ts`

```ts
// Add imports
import { rateLimitFor } from "../middleware/rate-limit.js";
import { quotaCheck, recordUsage } from "../middleware/quota.js";

// Update the route handler
app.post(
  "/documents/:id/query",
  authMiddleware,
  rateLimitFor("query"),
  quotaCheck("query"),
  async (c) => {
    // ... existing body ...

    // After the query succeeds, before the return:
    const auth = c.get("auth");
    recordUsage({
      userId: auth.userId ?? auth.projectId,
      projectId: auth.projectId,
      kind: "query",
      metadata: { doc_id: id, tool: "query" },
    });

    return c.json(result);
  }
);
```

### `apps/api/src/routes/documents.ts`

Ingest is heavier — use `ingest` rate limit and `ingest` quota. Record usage AFTER the ingest job is queued (not after the async processing completes):

```ts
import { rateLimitFor } from "../middleware/rate-limit.js";
import { quotaCheck, recordUsage } from "../middleware/quota.js";

app.post(
  "/documents",
  authMiddleware,
  rateLimitFor("ingest"),
  quotaCheck("ingest"),
  async (c) => {
    // ... existing body ...
    // After successful enqueue:
    recordUsage({
      userId: auth.userId ?? auth.projectId,
      projectId: auth.projectId,
      kind: "ingest_page",
      count: estimatedPageCount, // from the parser's pre-scan
      metadata: { doc_id: newDocId },
    });
    return c.json(result);
  }
);
```

### `apps/api/src/routes/toc.ts` and `apps/api/src/routes/sections.ts`

Tree navigation is cheap — apply only the rate limit, no quota:

```ts
import { rateLimitFor } from "../middleware/rate-limit.js";

app.get("/documents/:id/toc", authMiddleware, rateLimitFor("tree_nav"), handler);
app.get("/documents/:id/sections/:sectionId", authMiddleware, rateLimitFor("tree_nav"), handler);
```

### `apps/api/src/routes/mcp.ts`

MCP calls go through the same cost surface — apply the same protections. But since tool calls dispatch to different operations, apply the rate limit at the tool level inside the handler rather than as middleware. Simpler: apply the most permissive limit as middleware (`tree_nav`) and let the inner call recurse through `query.ts` / `documents.ts` which already have their own limits:

```ts
import { rateLimitFor } from "../middleware/rate-limit.js";

app.post("/", authMiddleware, rateLimitFor("tree_nav"), async (c) => {
  // ... existing body ...
});
```

### `apps/api/src/routes/oauth.ts` — DCR specifically

See Blocker 7 — DCR needs a separate per-IP limit, not a per-user one.

**Validation:**

```bash
# Spam query endpoint, expect 429 on the 21st request (free plan)
API_KEY=vl_sk_live_yourtestkey
for i in {1..25}; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" \
    http://localhost:3001/v1/documents/SOMEID/query \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"query":"hi"}')
  echo "req $i: $code"
done
# Expect: 200 (x20) then 429 (x5)
```

---

## Blocker 4 — Rate-limit store is in-memory, not Upstash

**Severity:** 🟡 Serverless-breaking — in-memory counters reset per Vercel lambda instance, effectively making `limit × warm_lambdas` the real ceiling.

**Evidence:** `apps/api/src/middleware/rate-limit.ts:20` → `const store = new Map<string, RateLimitEntry>();`

The file header comment already acknowledges this:
> Production should use Upstash Redis (`@upstash/ratelimit`) for distributed rate limiting across edge workers. This in-memory implementation works for single-process deployments and dev.

**Fix recipe:**

```bash
cd apps/api
pnpm add @upstash/ratelimit @upstash/redis
```

Refactor `apps/api/src/middleware/rate-limit.ts`:

```ts
import type { Context, Next } from "hono";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { PLANS, type PlanKey } from "../config/plans.js";
import { tooManyRequests } from "./error-handler.js";

// Upstash client (auto-reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

// Cache limiter instances per (windowMs, max) pair
const limiters = new Map<string, Ratelimit>();

function getLimiter(windowMs: number, max: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${windowMs}:${max}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowMs / 1000} s`),
      prefix: "vl:rl",
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// ... keep the existing in-memory fallback as a private function ...
// Use the Upstash path if redis is configured, else fall back to in-memory.

export function rateLimitFor(kind: "query" | "ingest" | "tree_nav") {
  return async (c: Context, next: Next) => {
    const auth = c.get("auth") as {
      projectId: string;
      apiKeyId: string;
      userId?: string;
      plan?: string;
    };

    const planKey = (auth.plan ?? "free") as PlanKey;
    const plan = PLANS[planKey] ?? PLANS.free;
    const cfg = {
      query: plan.queryRateLimit,
      ingest: plan.ingestRateLimit,
      tree_nav: plan.treeNavRateLimit,
    }[kind];

    const identifier = `${auth.userId ?? auth.projectId}:${kind}`;

    const limiter = getLimiter(cfg.windowMs, cfg.max);
    let success: boolean, limit: number, remaining: number, resetMs: number;

    if (limiter) {
      const result = await limiter.limit(identifier);
      success = result.success;
      limit = result.limit;
      remaining = result.remaining;
      resetMs = result.reset;
    } else {
      // In-memory fallback for local dev
      ({ success, limit, remaining, resetMs } = inMemoryCheck(
        identifier,
        cfg.windowMs,
        cfg.max
      ));
    }

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(Math.floor(resetMs / 1000)));

    if (!success) {
      c.header("Retry-After", String(Math.ceil((resetMs - Date.now()) / 1000)));
      throw tooManyRequests(
        `Rate limit exceeded for ${kind}. Current plan: ${plan.name} ` +
          `(${cfg.max} per ${cfg.windowMs / 1000}s). ` +
          `Upgrade at vectorless.store/dashboard/billing.`
      );
    }

    await next();
  };
}
```

**Env vars to add in Vercel:**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Create a free Upstash Redis database at https://console.upstash.com (free tier is 10k commands/day — plenty for pre-launch).

---

## Blocker 5 — MCP sessions kept in process memory

**Severity:** 🟡 Serverless fragility — sessions disappear when the lambda cold-starts; two requests from the same client can land on different lambdas.

**Evidence:** `apps/api/src/routes/mcp.ts:15`

```ts
const sessions = new Map<string, { transport: StreamableHTTPServerTransport; createdAt: number }>();
```

**Consequence:** On Vercel, Claude Desktop's `initialize → tools/list → tools/call` sequence can land on three different warm lambda instances. The second and third request get "no session" and either fail or recreate — depending on SDK behaviour.

**Fix options (pick one before launch):**

**Option A — stateless per request (simplest, recommended for launch).** Remove the `sessions` Map entirely. Create a fresh `StreamableHTTPServerTransport` + `Server` on every request. Incurs a small per-request setup cost but is stateless and horizontally trivial. The MCP server itself holds no per-session state (our handlers are idempotent), so this is safe.

**Option B — Upstash Redis session store.** Serialize the session state to Redis keyed by `mcp-session-id`. More complex; only worth it if we actually need stateful streaming sessions, which we don't yet.

**Recommendation:** Option A for launch. Revisit if we ever add SSE push notifications from the server (which would need an actual open connection to hold).

**Fix sketch (Option A):**

```ts
app.post("/", authMiddleware, rateLimitFor("tree_nav"), async (c) => {
  const auth = c.get("auth");
  const sessionId = c.req.header("mcp-session-id") ?? randomUUID();

  const transport = new StreamableHTTPServerTransport({
    sessionId,
    onsessioninitialized: () => {},
  });

  const server = createMcpServer({
    projectId: auth.projectId,
    authId: auth.apiKeyId,
    scopes: auth.scopes ?? ALL_SCOPES,
  });

  await server.connect(transport);

  const body = await c.req.json();
  return handleMcpRequest(transport, body, sessionId);
});
```

Delete the `sessions` Map and the `setInterval` cleanup. DELETE `/mcp` becomes a no-op that returns 200.

---

## Blocker 6 — Hand-rolled Node req/res mock in `handleMcpRequest`

**Severity:** 🟡 Fragile — works today but will break if the MCP SDK uses any Node stream API we haven't mocked.

**Evidence:** `apps/api/src/routes/mcp.ts:154–270`. The function builds fake `req` and `res` objects and feeds them to `transport.handleRequest`. It mocks `writeHead`, `setHeader`, `write`, `end`, `on`, etc. — but only the surface we've seen the SDK use.

**Risk:** Any SDK update that touches `res.pipe`, `res.cork`, `res.uncork`, `res.socket`, or async error events will break silently.

**Fix options:**

**Option A — accept the fragility, cover with tests.** Write integration tests that exercise every tool through the HTTP endpoint. If a future SDK update breaks them, the tests fail loudly.

**Option B — use `@hono/node-server`'s underlying adapter.** If the API is deployed on Vercel Node runtime (not Edge), we have access to the real Node `req` / `res` objects via Hono's `honoRequest` → `NodeRequest` adapter. We can pass them directly to `transport.handleRequest` without the mock.

**Recommendation:** Option A for launch, Option B when we have bandwidth. Track in a separate issue.

**Test file to create:** `apps/api/test/mcp.integration.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { app } from "../src/app.js";

describe("POST /mcp", () => {
  it("tools/list returns 6 tools", async () => {
    const res = await app.request("/mcp", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TEST_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.tools).toHaveLength(6);
  });

  // Add one test per tool — validates the adapter handles every response shape
});
```

---

## Blocker 7 — DCR has no abuse protection

**Severity:** 🟡 Abuse risk — `/oauth/register` accepts unlimited registrations with no rate limiting.

**Evidence:** `apps/api/src/routes/oauth.ts:135` (`app.post("/oauth/register", ...)`) has no middleware applied.

**Fix recipe:**

Add an IP-based rate limiter for DCR specifically. Since we don't have a `userId` here, rate-limit by client IP:

```ts
// apps/api/src/middleware/ip-rate-limit.ts (new file)
import type { Context, Next } from "hono";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? Redis.fromEnv()
  : null;

const dcrLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 h"),
      prefix: "vl:dcr",
    })
  : null;

export async function dcrRateLimit(c: Context, next: Next) {
  if (!dcrLimiter) return next();
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0] ??
    c.req.header("x-real-ip") ??
    "unknown";
  const { success } = await dcrLimiter.limit(ip);
  if (!success) {
    return c.json({ error: "too_many_registrations" }, 429);
  }
  return next();
}
```

Apply in `apps/api/src/routes/oauth.ts`:

```ts
import { dcrRateLimit } from "../middleware/ip-rate-limit.js";

app.post("/oauth/register", dcrRateLimit, async (c) => { ... });
```

**Soft-cap additions to consider:**
- Reject DCR when `client_name` matches > 3 existing clients from the same IP in the last hour
- Log every registration to a `oauth_dcr_audit` table for post-hoc analysis

These can wait until after launch.

---

## Blocker 8 — No cleanup for `oauth_revoked_jtis`

**Severity:** 🟢 Low — grows unbounded, won't block launch but will eventually bloat the DB.

**Fix:** Add a QStash cron job (already have QStash in the stack) that runs nightly:

```ts
// apps/api/src/routes/webhooks/cleanup.ts (new file)
import { Hono } from "hono";
import { lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { oauthRevokedJtis, oauthAuthorizationCodes } from "../../db/schema.js";
import { verifyQstash } from "../../middleware/qstash.js";

const app = new Hono();

app.post("/cleanup", verifyQstash, async (c) => {
  // Delete expired revoked JTIs
  const deletedJtis = await db
    .delete(oauthRevokedJtis)
    .where(lt(oauthRevokedJtis.expiresAt, new Date()))
    .returning({ jti: oauthRevokedJtis.jti });

  // Delete expired authorization codes (consumed or not)
  const deletedCodes = await db
    .delete(oauthAuthorizationCodes)
    .where(lt(oauthAuthorizationCodes.expiresAt, new Date()))
    .returning({ code: oauthAuthorizationCodes.code });

  return c.json({
    deleted_jtis: deletedJtis.length,
    deleted_auth_codes: deletedCodes.length,
  });
});

export { app as cleanupRoutes };
```

Wire into `app.ts`:

```ts
import { cleanupRoutes } from "./routes/webhooks/cleanup.js";
app.route("/v1/webhooks", cleanupRoutes);
```

Schedule in QStash dashboard: `POST https://api.vectorless.store/v1/webhooks/cleanup` daily at 03:00 UTC.

---

## Blocker 9 — Missing env vars in `DEPLOYMENT.md`

**Severity:** 🟢 Docs — won't cause a crash but new contributors will miss them.

**Add to `DEPLOYMENT.md` under the Railway / Vercel env-var block:**

```bash
# OAuth 2.1
OAUTH_JWT_SECRET=<64-byte hex, generate with: openssl rand -hex 32>
OAUTH_ISSUER=https://api.vectorless.store
OAUTH_ACCESS_TOKEN_TTL_SECONDS=900
OAUTH_REFRESH_TOKEN_TTL_SECONDS=2592000

# Dashboard URL for OAuth redirects
DASHBOARD_URL=https://vectorless.store

# Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...

# QStash (likely already set, but confirm)
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...
```

---

## Blocker 10 — No integration tests for new code

**Severity:** 🟡 Launch risk — we have no automated way to catch regressions in the MCP, OAuth, or rate-limit layers.

**Minimum test set to write before launch:**

```
apps/api/test/
  mcp.integration.test.ts           # /mcp tools/list and one call per tool
  oauth.integration.test.ts         # full auth code flow + refresh + revoke
  rate-limit.integration.test.ts    # 429 on 21st query for free plan
  quota.integration.test.ts         # 429 on 501st query for free plan
```

Each test should:
- Spin up the Hono app in-process (`app.request(...)`)
- Use a test DATABASE_URL pointing at an ephemeral schema or a Neon branch
- Seed a test project + API key + user
- Exercise the full path end-to-end

**Smoke-test checklist (manual, run before every deploy):**

```bash
# 1. stdio server
cd apps/mcp-stdio
VECTORLESS_API_KEY=vl_sk_live_... VECTORLESS_API_URL=http://localhost:3001 \
  node dist/index.js <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"1.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
EOF

# 2. /mcp over HTTP
curl -sS http://localhost:3001/mcp \
  -H "Authorization: Bearer vl_sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq

# 3. Well-known metadata
curl -sS http://localhost:3001/.well-known/oauth-authorization-server | jq
curl -sS http://localhost:3001/.well-known/oauth-protected-resource | jq

# 4. DCR
curl -sS -X POST http://localhost:3001/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"smoke","redirect_uris":["http://localhost:8080/cb"]}' | jq

# 5. Rate limit header presence (after wiring)
curl -i http://localhost:3001/v1/documents/some-id/query \
  -H "Authorization: Bearer vl_sk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"query":"hi"}' | grep -i "x-ratelimit"
```

---

## Execution order

Do not parallelize these — each step depends on the previous in subtle ways:

1. **Blocker 1** (migration, 30 min) — unblocks everything else
2. **Blocker 3** (wire middleware, 1 hour) — pure code, no infra
3. **Blocker 4** (Upstash Redis swap, 1 hour) — needs Upstash account
4. **Blocker 5** (stateless MCP sessions, 1 hour) — pre-empts production bug
5. **Blocker 2** (consent screen, 0.5 day) — unblocks the OAuth flow end-to-end
6. **Blocker 7** (DCR abuse protection, 30 min) — needs Upstash from step 3
7. **Blocker 8** (JTI cleanup cron, 30 min)
8. **Blocker 10** (integration tests, 0.5 day) — writes the safety net
9. **Blocker 6** (mcp adapter hardening) — deferred, testing is sufficient
10. **Blocker 9** (DEPLOYMENT.md env vars, 15 min) — before the first push

**Total: ~2 focused days from start to launch-ready.**

---

## Linked docs

- Full implementation plan: `docs/MCP_AND_AUTH_PLAN.md`
- Product spec: `docs/PRODUCT_SPEC.md`
- Roadmap: `IMPROVEMENTS.md`
- Deployment guide: `DEPLOYMENT.md`
