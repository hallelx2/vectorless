/**
 * Server-side helpers for proxying Vercel route handlers to the
 * control plane on behalf of the logged-in user.
 *
 * Each helper:
 *  1. Pulls the cookie header from the incoming request (the
 *     vls_session cookie is shared across .vectorless.store).
 *  2. Looks up the user's primary org so the CP can scope quota +
 *     storage correctly.
 *  3. Forwards the request to the CP at /v1/* with the cookie and
 *     X-Vectorless-Org header.
 *
 * Why route through Vercel at all when we could go direct from the
 * browser? Two reasons:
 *  - Existing API routes already do auth checks + caching headers,
 *    so the dashboard's component code stays small.
 *  - These payloads are tiny (JSON list, JSON detail) so Vercel's
 *    4.5 MB body cap is not an issue. Only document UPLOAD goes
 *    direct (see app/(dashboard)/dashboard/documents/upload/page.tsx).
 */
import { headers } from "next/headers";

const CP_BASE =
  process.env.CONTROL_PLANE_URL ||
  process.env.VECTORLESS_API_URL ||
  "https://api.vectorless.store";

export interface OrgRef {
  id: string;
  name?: string;
  slug?: string;
}

/**
 * Returns the cookie header from the current request, or "" if none.
 */
async function getCookieHeader(): Promise<string> {
  return (await headers()).get("cookie") ?? "";
}

/**
 * Returns the user's first org id (orgs are listed in created_at
 * order on the CP). Returns null if the user has no orgs OR the
 * cookie isn't valid.
 */
export async function getPrimaryOrgId(): Promise<string | null> {
  const cookie = await getCookieHeader();
  if (!cookie) return null;
  try {
    const res = await fetch(`${CP_BASE}/admin/v1/orgs`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const orgs = (await res.json()) as OrgRef[] | null;
    return orgs?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

interface ForwardOptions {
  /** HTTP method (defaults to GET). */
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** JSON body — serialized for non-GET. */
  body?: unknown;
  /** Optional org id; falls back to the user's primary org. */
  orgId?: string;
}

interface ForwardResult {
  ok: boolean;
  status: number;
  data: unknown;
}

/**
 * Forward a request to a CP /v1/* endpoint as the logged-in user.
 * Returns the parsed JSON body (or null) and status. Caller decides
 * how to respond.
 */
export async function forwardToCP(
  path: string,
  opts: ForwardOptions = {},
): Promise<ForwardResult> {
  const cookie = await getCookieHeader();
  if (!cookie) {
    return { ok: false, status: 401, data: { error: "Unauthorized" } };
  }
  const orgId = opts.orgId ?? (await getPrimaryOrgId());
  if (!orgId) {
    return {
      ok: false,
      status: 400,
      data: {
        error:
          "No org found on your account. Create one before using this endpoint.",
      },
    };
  }

  const headersInit: Record<string, string> = {
    cookie,
    "X-Vectorless-Org": orgId,
  };
  let body: BodyInit | undefined;
  const method = opts.method ?? "GET";
  if (opts.body !== undefined && method !== "GET") {
    headersInit["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  try {
    const res = await fetch(`${CP_BASE}${path}`, {
      method,
      headers: headersInit,
      body,
      cache: "no-store",
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      data: {
        error:
          err instanceof Error ? err.message : "Failed to reach control plane",
      },
    };
  }
}
