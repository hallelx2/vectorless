/**
 * Thin OAuth callback proxy.
 *
 * The dashboard no longer runs Better Auth — all auth lives in the
 * control plane (api.vectorless.store). But the GCP / GitHub OAuth
 * clients are still registered with redirect URIs pointing here:
 *
 *   https://www.vectorless.store/api/auth/callback/google
 *   https://www.vectorless.store/api/auth/callback/github
 *
 * Keeping those registrations means we never have to touch the
 * provider consoles when migrating. This handler just forwards the
 * {code, state} from the provider to the CP's /exchange endpoint,
 * pipes the resulting Set-Cookie header back to the browser, and
 * 302s to wherever the original /start request asked us to go.
 *
 * Every other /api/auth/* path is a leftover Better Auth route — we
 * 404 those so nothing accidentally reaches a stale handler.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CP_BASE =
  process.env.CONTROL_PLANE_URL ||
  process.env.VECTORLESS_API_URL ||
  "https://api.vectorless.store";

const SUPPORTED_PROVIDERS = new Set(["google", "github"]);

async function handleProviderCallback(
  req: Request,
  provider: string,
): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const providerError = url.searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(providerError)}`,
        url.origin,
      ),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_missing_params", url.origin),
    );
  }

  // Reconstruct the same redirect_uri /start used; the CP verifies it
  // matches what's signed into the JWT state.
  const redirectURI = `${url.origin}/api/auth/callback/${provider}`;

  let cpRes: Response;
  try {
    cpRes = await fetch(
      `${CP_BASE}/admin/v1/auth/oauth/${provider}/exchange`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          state,
          redirect_uri: redirectURI,
        }),
      },
    );
  } catch (err) {
    console.error("[oauth-proxy] CP unreachable", provider, err);
    return NextResponse.redirect(
      new URL("/login?error=oauth_cp_unreachable", url.origin),
    );
  }

  if (!cpRes.ok) {
    const errText = await cpRes.text().catch(() => "");
    console.error(
      "[oauth-proxy] CP exchange failed",
      provider,
      cpRes.status,
      errText,
    );
    return NextResponse.redirect(
      new URL(
        `/login?error=oauth_failed_${cpRes.status}`,
        url.origin,
      ),
    );
  }

  const body = (await cpRes.json().catch(() => ({}))) as {
    next?: string;
  };
  const next = body.next || "/dashboard";
  const nextUrl = next.startsWith("http") ? next : new URL(next, url.origin);

  const response = NextResponse.redirect(nextUrl);

  // Forward every Set-Cookie from the CP. The cookie is scoped to
  // .vectorless.store, so the browser will accept it on www.* too.
  const setCookieHeaders = collectSetCookies(cpRes.headers);
  for (const sc of setCookieHeaders) {
    response.headers.append("set-cookie", sc);
  }

  return response;
}

function collectSetCookies(h: Headers): string[] {
  // Headers#getSetCookie is the standards-compliant way (Node 20+).
  const headersWithGetSetCookie = h as Headers & {
    getSetCookie?: () => string[];
  };
  if (typeof headersWithGetSetCookie.getSetCookie === "function") {
    return headersWithGetSetCookie.getSetCookie();
  }
  const single = h.get("set-cookie");
  return single ? [single] : [];
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ all: string[] }> },
): Promise<Response> {
  const { all } = await ctx.params;
  if (
    all &&
    all[0] === "callback" &&
    all.length >= 2 &&
    SUPPORTED_PROVIDERS.has(all[1])
  ) {
    return handleProviderCallback(req, all[1]);
  }
  return new NextResponse("Not Found", { status: 404 });
}

export async function POST(
  _req: Request,
  _ctx: { params: Promise<{ all: string[] }> },
): Promise<Response> {
  return new NextResponse("Not Found", { status: 404 });
}

export async function OPTIONS(): Promise<Response> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}
