/**
 * Server-side session resolver.
 *
 * Replaces `auth.api.getSession({ headers })` from Better Auth. Reads
 * the `vls_session` cookie from the incoming request and validates it
 * against the control plane's /admin/v1/auth/me endpoint.
 *
 * The control plane is the single source of truth — sessions live in
 * its `sessions` table, and the cookie is shared across the
 * .vectorless.store family (so the dashboard, MCP server, and API
 * subdomain all see the same session).
 *
 * On every successful resolve we also upsert a "shadow" row in the
 * dashboard's local `user` table so legacy app-side foreign keys
 * (api_keys.user_id, usage_logs.user_id, …) keep validating. Long
 * term those tables move to the CP, but until then the shadow keeps
 * the existing flow alive.
 */
import { headers } from "next/headers";
import { db } from "@/db";
import { user as localUser } from "@/db/schema";

const CP_BASE =
  process.env.CONTROL_PLANE_URL ||
  process.env.VECTORLESS_API_URL ||
  "https://api.vectorless.store";

const SESSION_COOKIE = "vls_session";

export interface ServerSessionUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified?: boolean;
}

export interface ServerSession {
  user: ServerSessionUser;
}

/**
 * Returns the session for the current request, or null if the user
 * is not authenticated. Forwards the session cookie to the control
 * plane and trusts whatever the CP says.
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const cookieHeader = (await headers()).get("cookie") ?? "";
  if (!cookieHeader.includes(`${SESSION_COOKIE}=`)) {
    return null;
  }

  let user: ServerSessionUser;
  try {
    const res = await fetch(`${CP_BASE}/admin/v1/auth/me`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    user = (await res.json()) as ServerSessionUser;
  } catch {
    return null;
  }

  // Best-effort shadow upsert. Failure here doesn't kill auth — it
  // just means an old user predates this code or the local DB is
  // unreachable, both of which the caller can survive.
  try {
    await db
      .insert(localUser)
      .values({
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        emailVerified: !!user.email_verified,
        image: user.avatar_url || null,
      })
      .onConflictDoNothing({ target: localUser.id });
  } catch (err) {
    console.warn("[server-auth] shadow user upsert failed", err);
  }

  return { user };
}
