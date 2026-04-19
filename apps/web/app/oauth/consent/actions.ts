"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Validate an OAuth authorization request against the API.
 * Called before showing the consent screen.
 */
export async function validateOAuthRequest(params: {
  client_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge: string;
  code_challenge_method: string;
}) {
  try {
    const res = await fetch(`${API_URL}/oauth/internal/validate-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: data.error?.message ?? `Validation failed (${res.status})`,
      };
    }

    const data = await res.json();
    return {
      valid: true,
      client: data.client as {
        id: string;
        name: string;
        logo_uri: string | null;
        policy_uri: string | null;
        tos_uri: string | null;
      },
      scopes: data.scopes as string[],
    };
  } catch {
    return { valid: false, error: "Could not connect to the API." };
  }
}

/**
 * Submit the OAuth consent decision (approve or deny).
 * This runs server-side to avoid cross-origin issues between
 * the dashboard (vectorless.store) and API (api.vectorless.store).
 *
 * Returns the redirect URL that the browser should navigate to.
 */
export async function submitOAuthConsent(params: {
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
  project_id: string;
  approved: boolean;
}): Promise<{ redirectUrl?: string; error?: string }> {
  // Verify the user is authenticated
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Not authenticated" };
  }

  try {
    const res = await fetch(`${API_URL}/oauth/authorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      redirect: "manual", // Don't follow the redirect — we need the Location header
      body: JSON.stringify({
        ...params,
        user_id: session.user.id,
      }),
    });

    // The API returns a 302 redirect
    const location = res.headers.get("location");
    if (location) {
      return { redirectUrl: location };
    }

    // If the API returned a non-redirect response, something unexpected happened
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error?.message ?? "Unexpected response from authorization server" };
    }

    return { error: `Authorization failed (${res.status})` };
  } catch {
    return { error: "Failed to connect to the authorization server" };
  }
}
