"use client";

/**
 * Browser-side auth client. Talks straight to the control plane
 * (api.vectorless.store) using cross-subdomain cookies. The shape
 * intentionally mirrors Better Auth's so existing call sites keep
 * compiling without churn.
 *
 * - signIn.email / signUp.email / signOut return Better-Auth-flavored
 *   `{ data, error }` objects so LoginForm + RegisterForm don't have
 *   to change.
 * - signIn.social just `window.location`s to the CP /start endpoint;
 *   the rest of the OAuth dance happens server-side via the
 *   /api/auth/callback/{provider} proxy route on Vercel.
 * - useSession is an SWR wrapper around GET /admin/v1/auth/me.
 */

import useSWR from "swr";

const CP_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.vectorless.store";

interface AuthResult<T> {
  data: T | null;
  error: { message: string } | null;
}

async function postCP<T>(path: string, body: unknown): Promise<AuthResult<T>> {
  try {
    const res = await fetch(`${CP_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const j = (await res.json()) as { error?: string; message?: string };
        message = j.error || j.message || message;
      } catch {
        /* swallow non-JSON error bodies */
      }
      return { data: null, error: { message } };
    }
    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (e) {
    return {
      data: null,
      error: { message: e instanceof Error ? e.message : "Network error" },
    };
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  email_verified?: boolean;
}

export const signIn = {
  email: async (args: { email: string; password: string }) =>
    postCP<SessionUser>("/admin/v1/auth/login", args),

  /**
   * Kicks off an OAuth flow by redirecting the browser to the
   * control plane's /start endpoint. The CP then 302s to the
   * provider; the provider redirects back to
   * /api/auth/callback/{provider} on this Vercel app.
   *
   * Returns void because the navigation never resolves.
   */
  social: async (args: {
    provider: "google" | "github";
    callbackURL?: string;
  }) => {
    const next = args.callbackURL ?? "/dashboard";
    const absoluteNext = next.startsWith("http")
      ? next
      : `${window.location.origin}${next}`;
    window.location.href = `${CP_BASE}/admin/v1/auth/oauth/${
      args.provider
    }/start?next=${encodeURIComponent(absoluteNext)}`;
  },
};

export const signUp = {
  email: async (args: { email: string; password: string; name: string }) =>
    postCP<SessionUser>("/admin/v1/auth/signup", args),
};

export async function signOut(): Promise<void> {
  await fetch(`${CP_BASE}/admin/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => {});
}

interface UseSessionResult {
  data: { user: SessionUser } | null | undefined;
  error: Error | undefined;
  isPending: boolean;
  refetch: () => Promise<unknown>;
}

export function useSession(): UseSessionResult {
  const { data, error, isLoading, mutate } = useSWR<{
    user: SessionUser;
  } | null>(
    "vls:session",
    async () => {
      const res = await fetch(`${CP_BASE}/admin/v1/auth/me`, {
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) return null;
      if (!res.ok) throw new Error(`session fetch failed (${res.status})`);
      const user = (await res.json()) as SessionUser;
      return { user };
    },
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  return {
    data,
    error,
    isPending: isLoading,
    refetch: () => mutate(),
  };
}

/**
 * Compatibility wrapper — keeps the named export the few admin pages
 * (settings/account, reset-password) import. The methods that aren't
 * yet wired to the CP throw a clear error so the rest of the build
 * compiles and the user just sees a "not yet supported" message if
 * they trigger them.
 */
export const authClient = {
  signIn,
  signUp,
  signOut,
  useSession,
  changePassword: async (_args: {
    currentPassword: string;
    newPassword: string;
  }): Promise<unknown> => {
    throw new Error(
      "Password change is temporarily unavailable. Please use the forgot-password flow.",
    );
  },
  deleteUser: async (): Promise<unknown> => {
    throw new Error(
      "Account deletion is temporarily unavailable. Please contact support.",
    );
  },
  resetPassword: async (_args: {
    newPassword: string;
    token: string;
  }): Promise<unknown> => {
    throw new Error(
      "Password reset is not yet wired to the new auth backend.",
    );
  },
};
