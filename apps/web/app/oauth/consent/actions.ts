"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { ControlPlaneError, controlPlane } from "@/lib/control-plane";

interface ValidateParams {
  client_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
}

/**
 * Validate an OAuth authorization request against the control plane.
 *
 * Called from the consent page on mount, before showing the UI.
 * Returns the requesting client's metadata and the requested scopes
 * if everything checks out.
 */
export async function validateOAuthRequest(params: ValidateParams) {
  try {
    const result = await controlPlane.oauth.validateRequest({
      client_id: params.client_id,
      redirect_uri: params.redirect_uri,
      scope: params.scope,
    });

    return {
      valid: true as const,
      client: {
        // Map control-plane shape (`client_id`) to the page's expected
        // shape (`id`) so we don't have to touch page.tsx.
        id: result.client.client_id,
        name: result.client.name,
        logo_uri: result.client.logo_uri || null,
        policy_uri: result.client.policy_uri || null,
        tos_uri: result.client.tos_uri || null,
      },
      scopes: result.scopes,
    };
  } catch (e) {
    const message =
      e instanceof ControlPlaneError
        ? extractErrorMessage(e.body) ?? `Validation failed (${e.status})`
        : "Could not connect to the authorization server.";
    return { valid: false as const, error: message };
  }
}

interface ConsentParams {
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
  /**
   * Org the user is consenting to grant access to. Optional —
   * defaults to the user's primary org if omitted (we resolve it
   * server-side via the user's session).
   */
  org_id?: string;
  approved: boolean;
}

/**
 * Submit the OAuth consent decision (approve or deny).
 *
 * On approve: ask the control plane to mint an authorization code,
 * then build the redirect URL the browser should navigate to.
 * On deny: build a redirect with `error=access_denied`.
 *
 * Runs server-side so the dashboard service token is never sent to
 * the browser.
 */
export async function submitOAuthConsent(
  params: ConsentParams,
): Promise<{ redirectUrl?: string; error?: string }> {
  // Verify the user is authenticated
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Not authenticated" };
  }

  // Deny: build the error redirect ourselves and return it.
  if (!params.approved) {
    const url = safeUrl(params.redirect_uri);
    if (!url) return { error: "Invalid redirect_uri" };
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("error_description", "User denied consent");
    if (params.state) url.searchParams.set("state", params.state);
    return { redirectUrl: url.toString() };
  }

  // Approve: ask the control plane for an auth code, then build
  // the redirect.
  try {
    const orgId = params.org_id ?? (await resolvePrimaryOrgId(session.user.id));
    if (!orgId) {
      return {
        error:
          "No org found for this user. Please create or join an org before connecting an app.",
      };
    }

    const result = await controlPlane.oauth.issueCode({
      client_id: params.client_id,
      user_id: session.user.id,
      org_id: orgId,
      scopes: params.scope.split(" ").filter(Boolean),
      redirect_uri: params.redirect_uri,
      code_challenge: params.code_challenge,
      code_challenge_method: params.code_challenge_method,
      state: params.state || undefined,
    });

    const url = safeUrl(result.redirect_uri);
    if (!url) return { error: "Invalid redirect_uri returned by server" };
    url.searchParams.set("code", result.code);
    if (result.state) url.searchParams.set("state", result.state);

    return { redirectUrl: url.toString() };
  } catch (e) {
    const message =
      e instanceof ControlPlaneError
        ? extractErrorMessage(e.body) ?? `Authorization failed (${e.status})`
        : "Failed to connect to the authorization server.";
    return { error: message };
  }
}

/**
 * Resolve the user's primary org by listing orgs they belong to and
 * picking the first. Uses the user's session cookie via headers().
 *
 * For users with multiple orgs we'll eventually surface a picker on
 * the consent page; for now we default to the first org.
 */
async function resolvePrimaryOrgId(_userId: string): Promise<string | null> {
  // The control plane's /admin/v1/orgs returns the orgs the
  // authenticated user belongs to. Forward the dashboard's session
  // cookie — Better Auth sets it as `vls.session_token` after login.
  // (Future: replace with a dedicated /admin/internal/users/{id}/orgs
  // endpoint that takes the service token, so we don't depend on the
  // user having an active control-plane session cookie.)
  try {
    const cookieHeader = (await headers()).get("cookie") ?? "";
    const { controlPlaneUserCall } = await import("@/lib/control-plane");
    const orgs = await controlPlaneUserCall<Array<{ id: string }>>(
      "/admin/v1/orgs",
      cookieHeader,
    );
    if (Array.isArray(orgs) && orgs.length > 0) {
      return orgs[0].id;
    }
  } catch {
    // fall through
  }
  return null;
}

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.error_description === "string") return b.error_description;
  if (typeof b.error === "string") return b.error;
  if (typeof b.message === "string") return b.message;
  return null;
}
