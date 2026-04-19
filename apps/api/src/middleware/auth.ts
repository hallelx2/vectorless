import type { Context, Next } from "hono";
import { createHash } from "node:crypto";
import { jwtVerify } from "jose";
import { db } from "../db/client.js";
import { apiKeys, oauthRevokedJtis } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { unauthorized, forbidden } from "./error-handler.js";
import type { OAuthScope } from "@vectorless/mcp-tools";

/**
 * All scopes — granted implicitly to API key auth.
 * OAuth tokens will receive only the scopes the user consented to.
 */
const ALL_SCOPES: OAuthScope[] = [
  "documents:read",
  "documents:write",
  "query",
];

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Unified auth middleware.
 *
 * Supports two auth paths:
 * 1. API key (vl_sk_live_...) — existing path, gets all scopes
 * 2. OAuth JWT (eyJ...) — Phase 3, gets scoped access
 *
 * Sets `c.set("auth", { projectId, apiKeyId, scopes })` for downstream handlers.
 */
export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw unauthorized("Missing Authorization header. Use: Bearer <api_key>");
  }

  const token = authHeader.slice(7);

  // Route to the appropriate auth path based on token format
  if (token.startsWith("vl_")) {
    return apiKeyAuth(c, next, token);
  }

  // Phase 3: OAuth JWT tokens start with "eyJ" (base64-encoded JSON)
  if (token.startsWith("eyJ")) {
    return oauthJwtAuth(c, next, token);
  }

  throw unauthorized("Unrecognized token format");
}

/**
 * API key authentication — existing path.
 * API keys get all scopes implicitly.
 */
async function apiKeyAuth(c: Context, next: Next, key: string) {
  const keyHash = hashApiKey(key);

  const [found] = await db
    .select({
      id: apiKeys.id,
      projectId: apiKeys.projectId,
      status: apiKeys.status,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!found) {
    throw unauthorized("Invalid API key");
  }

  if (found.status !== "active") {
    throw unauthorized("API key has been revoked");
  }

  if (found.expiresAt && new Date(found.expiresAt) < new Date()) {
    throw unauthorized("API key has expired");
  }

  // Update last used timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, found.id))
    .execute()
    .catch(() => {});

  c.set("auth", {
    projectId: found.projectId,
    apiKeyId: found.id,
    scopes: ALL_SCOPES,
  });

  await next();
}

/**
 * OAuth JWT authentication.
 *
 * Verifies the JWT signature, checks expiry, validates the JTI hasn't been revoked,
 * and extracts scopes + project info from the token claims.
 */
async function oauthJwtAuth(c: Context, next: Next, token: string) {
  const jwtSecret = process.env.OAUTH_JWT_SECRET;
  if (!jwtSecret) {
    throw unauthorized("OAuth is not configured on this server");
  }

  const issuer =
    process.env.OAUTH_ISSUER ?? "https://api.vectorless.store";
  const secret = new TextEncoder().encode(jwtSecret);

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer,
      audience: `${issuer}/mcp`,
    });

    // Check if the JTI has been revoked
    if (payload.jti) {
      const [revoked] = await db
        .select({ jti: oauthRevokedJtis.jti })
        .from(oauthRevokedJtis)
        .where(eq(oauthRevokedJtis.jti, payload.jti))
        .limit(1);

      if (revoked) {
        throw unauthorized("Access token has been revoked");
      }
    }

    const claims = payload as Record<string, unknown>;

    c.set("auth", {
      projectId: claims.project_id as string,
      apiKeyId: payload.jti ?? "oauth",
      userId: payload.sub,
      clientId: claims.client_id as string,
      scopes: (claims.scopes as OAuthScope[]) ?? ALL_SCOPES,
      plan: claims.plan as string | undefined,
    });

    await next();
  } catch (err) {
    if (err instanceof Error && err.message.includes("revoked")) {
      throw err; // Re-throw our own revocation error
    }
    throw unauthorized("Invalid or expired OAuth access token");
  }
}
