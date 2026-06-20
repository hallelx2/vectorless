/**
 * Control plane HTTP client.
 *
 * The control plane (vectorless-control-plane, Go) is the single source
 * of truth for users, sessions, orgs, API keys, OAuth tokens, billing,
 * and the document API proxy. The dashboard talks to it for everything
 * backend-y.
 *
 * Two auth contexts:
 *
 *   - Service token: used for /admin/internal/* endpoints. The dashboard
 *     proves it's the dashboard. Used by Better Auth's custom adapter
 *     and by OAuth consent server actions.
 *
 *   - Session cookie: used for /admin/v1/* endpoints called on behalf
 *     of a logged-in user. The browser's vls_session cookie is
 *     forwarded.
 *
 * This module never imports React or Next.js — it's pure fetch wrapper.
 * Callers (server actions, route handlers) supply the request context.
 */

const CONTROL_PLANE_URL =
  process.env.CONTROL_PLANE_URL ||
  process.env.VECTORLESS_API_URL ||
  "http://localhost:9090";

const SERVICE_TOKEN = process.env.CONTROL_PLANE_SERVICE_TOKEN || "";

export class ControlPlaneError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ControlPlaneError";
  }
}

interface CallOptions {
  /** HTTP method. Defaults to POST. */
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** JSON body — serialized for non-GET. */
  body?: unknown;
  /** Override base URL (rarely needed). */
  baseUrl?: string;
  /** Additional headers. */
  headers?: Record<string, string>;
}

/**
 * Service-context call: authenticated with the dashboard service token.
 *
 * Used by Better Auth's custom adapter (identity CRUD) and by OAuth
 * consent server actions (validate-request, issue-code, introspect).
 *
 * Throws ControlPlaneError on non-2xx responses.
 */
export async function controlPlaneServiceCall<T = unknown>(
  path: string,
  opts: CallOptions = {},
): Promise<T> {
  if (!SERVICE_TOKEN) {
    throw new ControlPlaneError(
      503,
      "CONTROL_PLANE_SERVICE_TOKEN is not configured",
    );
  }

  const baseUrl = opts.baseUrl ?? CONTROL_PLANE_URL;
  const url = `${baseUrl}${path}`;
  const method = opts.method ?? "POST";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${SERVICE_TOKEN}`,
    ...opts.headers,
  };
  let body: BodyInit | undefined;

  if (opts.body !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, { method, headers, body });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = await res.text().catch(() => undefined);
    }
    throw new ControlPlaneError(
      res.status,
      `control plane ${method} ${path} failed: ${res.status}`,
      errorBody,
    );
  }

  if (res.status === 204) return undefined as T;

  // Some 200 responses have empty bodies (notably `null` for a missing
  // findOne). JSON parse and pass through.
  const text = await res.text();
  if (text === "" || text === "null") return null as T;
  return JSON.parse(text) as T;
}

/**
 * User-context call: authenticated with the user's session cookie.
 *
 * Used by server actions on behalf of the logged-in dashboard user.
 * Pass the request headers from `next/headers` so the cookie flows
 * through.
 */
export async function controlPlaneUserCall<T = unknown>(
  path: string,
  cookieHeader: string,
  opts: CallOptions = {},
): Promise<T> {
  const baseUrl = opts.baseUrl ?? CONTROL_PLANE_URL;
  const url = `${baseUrl}${path}`;
  const method = opts.method ?? "GET";

  const headers: Record<string, string> = {
    Cookie: cookieHeader,
    ...opts.headers,
  };
  let body: BodyInit | undefined;

  if (opts.body !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, { method, headers, body });

  if (!res.ok) {
    let errorBody: unknown;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = undefined;
    }
    throw new ControlPlaneError(
      res.status,
      `control plane ${method} ${path} failed: ${res.status}`,
      errorBody,
    );
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (text === "") return null as T;
  return JSON.parse(text) as T;
}

/**
 * Pre-baked typed wrappers for common control-plane operations.
 */
export const controlPlane = {
  /** Identity CRUD endpoints used by Better Auth's custom adapter. */
  identity: {
    create: <T = Record<string, unknown>>(model: string, data: Record<string, unknown>) =>
      controlPlaneServiceCall<T>(`/admin/internal/identity/${model}`, {
        method: "POST",
        body: { data },
      }),

    findOne: <T = Record<string, unknown>>(
      model: string,
      where: Array<{ field: string; value: unknown; operator?: string }>,
    ) =>
      controlPlaneServiceCall<T>(`/admin/internal/identity/${model}/find`, {
        method: "POST",
        body: { where },
      }),

    findMany: <T = Record<string, unknown>>(
      model: string,
      where: Array<{ field: string; value: unknown; operator?: string }>,
      opts: {
        limit?: number;
        offset?: number;
        sortBy?: Array<{ field: string; direction: "asc" | "desc" }>;
      } = {},
    ) =>
      controlPlaneServiceCall<T[]>(`/admin/internal/identity/${model}/find-many`, {
        method: "POST",
        body: {
          where,
          limit: opts.limit,
          offset: opts.offset,
          sortBy: opts.sortBy,
        },
      }),

    update: <T = Record<string, unknown>>(
      model: string,
      where: Array<{ field: string; value: unknown; operator?: string }>,
      update: Record<string, unknown>,
    ) =>
      controlPlaneServiceCall<T>(`/admin/internal/identity/${model}`, {
        method: "PATCH",
        body: { where, update },
      }),

    updateMany: (
      model: string,
      where: Array<{ field: string; value: unknown; operator?: string }>,
      update: Record<string, unknown>,
    ) =>
      controlPlaneServiceCall<{ count: number }>(
        `/admin/internal/identity/${model}/many`,
        { method: "PATCH", body: { where, update } },
      ),

    delete: (model: string, where: Array<{ field: string; value: unknown; operator?: string }>) =>
      controlPlaneServiceCall<{ count: number }>(`/admin/internal/identity/${model}`, {
        method: "DELETE",
        body: { where },
      }),

    deleteMany: (model: string, where: Array<{ field: string; value: unknown; operator?: string }>) =>
      controlPlaneServiceCall<{ count: number }>(
        `/admin/internal/identity/${model}/many`,
        { method: "DELETE", body: { where } },
      ),

    count: (model: string, where: Array<{ field: string; value: unknown; operator?: string }>) =>
      controlPlaneServiceCall<{ count: number }>(`/admin/internal/identity/${model}/count`, {
        method: "POST",
        body: { where },
      }),
  },

  /** OAuth endpoints called by the dashboard. */
  oauth: {
    validateRequest: (params: {
      client_id: string;
      redirect_uri: string;
      scope: string;
    }) =>
      controlPlaneServiceCall<{
        client: {
          client_id: string;
          name: string;
          logo_uri: string;
          client_uri: string;
          policy_uri: string;
          tos_uri: string;
        };
        scopes: string[];
      }>(`/oauth/internal/validate-request`, {
        method: "POST",
        body: params,
      }),

    issueCode: (params: {
      client_id: string;
      user_id: string;
      org_id: string;
      scopes: string[];
      redirect_uri: string;
      code_challenge: string;
      code_challenge_method: string;
      state?: string;
    }) =>
      controlPlaneServiceCall<{
        code: string;
        redirect_uri: string;
        state?: string;
      }>(`/oauth/internal/issue-code`, {
        method: "POST",
        body: params,
      }),

    /**
     * RFC 7662 token introspection.
     *
     * Called by the MCP route on every request to validate the bearer
     * token. Returns claims if active, `{active: false}` otherwise.
     */
    introspect: async (
      token: string,
    ): Promise<
      | { active: false }
      | {
          active: true;
          sub: string;
          client_id: string;
          org_id: string;
          scope: string;
          exp: number;
          iat: number;
          iss: string;
          aud: string;
          jti: string;
        }
    > => {
      if (!SERVICE_TOKEN) {
        throw new ControlPlaneError(503, "service token not configured");
      }
      const res = await fetch(`${CONTROL_PLANE_URL}/oauth/introspect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_TOKEN}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ token }).toString(),
      });
      if (!res.ok) {
        throw new ControlPlaneError(res.status, "introspect failed");
      }
      return res.json();
    },
  },
};

/** Convenience: the configured control plane base URL. */
export function controlPlaneUrl(): string {
  return CONTROL_PLANE_URL;
}
