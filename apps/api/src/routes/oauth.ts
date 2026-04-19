import { Hono } from "hono";
import { createHash, randomBytes } from "node:crypto";
import { nanoid } from "nanoid";
import { SignJWT, jwtVerify } from "jose";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  oauthClients,
  oauthAuthorizationCodes,
  oauthRefreshTokens,
  oauthConsents,
  oauthRevokedJtis,
} from "../db/schema.js";
import {
  badRequest,
  unauthorized,
  forbidden,
  notFound,
} from "../middleware/error-handler.js";
import { dcrRateLimit } from "../middleware/ip-rate-limit.js";
import type { Variables } from "../app.js";

const app = new Hono<{ Variables: Variables }>();

// ── Configuration ──

const ISSUER =
  process.env.OAUTH_ISSUER ?? "https://api.vectorless.store";
const JWT_SECRET_HEX = process.env.OAUTH_JWT_SECRET ?? "";
const ACCESS_TOKEN_TTL =
  Number(process.env.OAUTH_ACCESS_TOKEN_TTL_SECONDS) || 900; // 15 min
const REFRESH_TOKEN_TTL =
  Number(process.env.OAUTH_REFRESH_TOKEN_TTL_SECONDS) || 2_592_000; // 30 days
const AUTH_CODE_TTL = 600; // 10 minutes

const VALID_SCOPES = ["documents:read", "documents:write", "query"] as const;

function getJwtSecret(): Uint8Array {
  if (!JWT_SECRET_HEX) {
    throw new Error("OAUTH_JWT_SECRET environment variable is required for OAuth");
  }
  return new TextEncoder().encode(JWT_SECRET_HEX);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Validate that all redirect URIs are HTTPS (or localhost/127.0.0.1 for dev).
 * Per RFC 8252, localhost and 127.0.0.1 are allowed with HTTP.
 */
function validateRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol === "https:") return true;
    if (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Verify PKCE code_verifier against code_challenge (S256 only).
 */
function verifyPkce(
  codeVerifier: string,
  codeChallenge: string,
  method: string
): boolean {
  if (method !== "S256") return false;
  const computed = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return computed === codeChallenge;
}

// ── Well-Known Metadata ──

/**
 * GET /.well-known/oauth-authorization-server
 * RFC 8414 — Authorization Server Metadata
 */
app.get("/.well-known/oauth-authorization-server", (c) => {
  return c.json({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/oauth/authorize`,
    token_endpoint: `${ISSUER}/oauth/token`,
    registration_endpoint: `${ISSUER}/oauth/register`,
    revocation_endpoint: `${ISSUER}/oauth/revoke`,
    introspection_endpoint: `${ISSUER}/oauth/introspect`,
    scopes_supported: VALID_SCOPES,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: [
      "client_secret_basic",
      "client_secret_post",
      "none",
    ],
    code_challenge_methods_supported: ["S256"],
    service_documentation: "https://vectorless.store/docs",
  });
});

/**
 * GET /.well-known/oauth-protected-resource
 * RFC 9728 — Protected Resource Metadata
 */
app.get("/.well-known/oauth-protected-resource", (c) => {
  return c.json({
    resource: `${ISSUER}/mcp`,
    authorization_servers: [ISSUER],
    scopes_supported: VALID_SCOPES,
    bearer_methods_supported: ["header"],
  });
});

// ── Dynamic Client Registration (RFC 7591) ──

/**
 * POST /oauth/register
 *
 * Register a new OAuth client. Used by Claude Desktop and other MCP clients
 * to self-register before starting the authorization flow.
 */
app.post("/oauth/register", dcrRateLimit, async (c) => {
  const body = await c.req.json<{
    client_name?: string;
    redirect_uris?: string[];
    grant_types?: string[];
    token_endpoint_auth_method?: string;
    logo_uri?: string;
    policy_uri?: string;
    tos_uri?: string;
    software_statement?: string;
  }>();

  if (!body.client_name?.trim()) {
    throw badRequest("client_name is required");
  }

  if (!body.redirect_uris?.length) {
    throw badRequest("At least one redirect_uri is required");
  }

  // Validate all redirect URIs
  for (const uri of body.redirect_uris) {
    if (!validateRedirectUri(uri)) {
      throw badRequest(
        `Invalid redirect_uri: ${uri}. Must use HTTPS (or HTTP with localhost/127.0.0.1)`
      );
    }
  }

  const grantTypes = body.grant_types ?? [
    "authorization_code",
    "refresh_token",
  ];
  const authMethod = body.token_endpoint_auth_method ?? "client_secret_basic";

  // Generate client credentials
  const clientId = nanoid(21);
  let clientSecret: string | null = null;
  let clientSecretHash: string | null = null;

  if (authMethod !== "none") {
    clientSecret = `vl_cs_${randomBytes(24).toString("base64url")}`;
    clientSecretHash = hashToken(clientSecret);
  }

  await db.insert(oauthClients).values({
    id: clientId,
    clientName: body.client_name.trim(),
    clientSecretHash,
    redirectUris: body.redirect_uris,
    grantTypes,
    tokenEndpointAuthMethod: authMethod,
    source: "dcr",
    logoUri: body.logo_uri ?? null,
    policyUri: body.policy_uri ?? null,
    tosUri: body.tos_uri ?? null,
  });

  const response: Record<string, unknown> = {
    client_id: clientId,
    client_name: body.client_name.trim(),
    redirect_uris: body.redirect_uris,
    grant_types: grantTypes,
    token_endpoint_auth_method: authMethod,
  };

  if (clientSecret) {
    response.client_secret = clientSecret;
  }

  return c.json(response, 201);
});

// ── Authorization Endpoint ──

/**
 * GET /oauth/authorize
 *
 * Validates the authorization request and redirects to the dashboard consent screen.
 * The consent screen is hosted at apps/web and handles user login + approval.
 */
app.get("/oauth/authorize", async (c) => {
  const clientId = c.req.query("client_id");
  const redirectUri = c.req.query("redirect_uri");
  const responseType = c.req.query("response_type");
  const scope = c.req.query("scope");
  const state = c.req.query("state");
  const codeChallenge = c.req.query("code_challenge");
  const codeChallengeMethod = c.req.query("code_challenge_method");

  // Validate required parameters
  if (!clientId) throw badRequest("client_id is required");
  if (!redirectUri) throw badRequest("redirect_uri is required");
  if (responseType !== "code") throw badRequest("response_type must be 'code'");
  if (!codeChallenge) throw badRequest("code_challenge is required (PKCE)");
  if (codeChallengeMethod !== "S256")
    throw badRequest("code_challenge_method must be S256");

  // Validate client exists and redirect_uri is registered
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.id, clientId))
    .limit(1);

  if (!client) throw badRequest("Unknown client_id");

  if (!client.redirectUris.includes(redirectUri)) {
    throw badRequest("redirect_uri is not registered for this client");
  }

  // Validate scopes
  const requestedScopes = scope
    ? scope.split(" ").filter(Boolean)
    : [...VALID_SCOPES];

  for (const s of requestedScopes) {
    if (!(VALID_SCOPES as readonly string[]).includes(s)) {
      throw badRequest(`Invalid scope: ${s}`);
    }
  }

  // Redirect to the dashboard consent screen
  const dashboardUrl =
    process.env.DASHBOARD_URL ?? "https://vectorless.store";
  const consentUrl = new URL("/oauth/consent", dashboardUrl);
  consentUrl.searchParams.set("client_id", clientId);
  consentUrl.searchParams.set("redirect_uri", redirectUri);
  consentUrl.searchParams.set("scope", requestedScopes.join(" "));
  consentUrl.searchParams.set("state", state ?? "");
  consentUrl.searchParams.set("code_challenge", codeChallenge);
  consentUrl.searchParams.set("code_challenge_method", codeChallengeMethod);
  consentUrl.searchParams.set("client_name", client.clientName);

  return c.redirect(consentUrl.toString(), 302);
});

/**
 * POST /oauth/authorize
 *
 * Called from the dashboard consent screen after the user approves.
 * Issues an authorization code and redirects back to the client.
 *
 * Body: {
 *   client_id, redirect_uri, scope, state,
 *   code_challenge, code_challenge_method,
 *   user_id, project_id, approved: boolean
 * }
 */
app.post("/oauth/authorize", async (c) => {
  const body = await c.req.json<{
    client_id: string;
    redirect_uri: string;
    scope: string;
    state?: string;
    code_challenge: string;
    code_challenge_method: string;
    user_id: string;
    project_id: string;
    approved: boolean;
  }>();

  if (!body.approved) {
    // User denied — redirect back with error
    const redirectUrl = new URL(body.redirect_uri);
    redirectUrl.searchParams.set("error", "access_denied");
    redirectUrl.searchParams.set("error_description", "User denied consent");
    if (body.state) redirectUrl.searchParams.set("state", body.state);
    return c.redirect(redirectUrl.toString(), 302);
  }

  // Validate client
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.id, body.client_id))
    .limit(1);

  if (!client) throw badRequest("Unknown client_id");
  if (!client.redirectUris.includes(body.redirect_uri)) {
    throw badRequest("redirect_uri mismatch");
  }

  const scopes = body.scope.split(" ").filter(Boolean);

  // Generate authorization code
  const rawCode = generateOpaqueToken();
  const codeHash = hashToken(rawCode);

  await db.insert(oauthAuthorizationCodes).values({
    code: codeHash,
    clientId: body.client_id,
    userId: body.user_id,
    projectId: body.project_id,
    redirectUri: body.redirect_uri,
    scopes,
    codeChallenge: body.code_challenge,
    codeChallengeMethod: body.code_challenge_method,
    expiresAt: new Date(Date.now() + AUTH_CODE_TTL * 1000),
  });

  // Record consent
  await db
    .insert(oauthConsents)
    .values({
      userId: body.user_id,
      clientId: body.client_id,
      scopes,
    })
    .onConflictDoUpdate({
      target: [oauthConsents.userId, oauthConsents.clientId],
      set: {
        scopes,
        grantedAt: new Date(),
        revokedAt: null,
      },
    });

  // Redirect back to client with the code
  const redirectUrl = new URL(body.redirect_uri);
  redirectUrl.searchParams.set("code", rawCode);
  if (body.state) redirectUrl.searchParams.set("state", body.state);

  return c.redirect(redirectUrl.toString(), 302);
});

// ── Token Endpoint ──

/**
 * POST /oauth/token
 *
 * Exchange an authorization code for tokens, or refresh an existing token.
 * Supports: authorization_code, refresh_token grant types.
 */
app.post("/oauth/token", async (c) => {
  const body = await c.req.json<{
    grant_type: string;
    code?: string;
    redirect_uri?: string;
    client_id?: string;
    client_secret?: string;
    code_verifier?: string;
    refresh_token?: string;
  }>();

  // Also check Basic auth header for client credentials
  let clientId = body.client_id;
  let clientSecret = body.client_secret;

  const authHeader = c.req.header("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice(6));
    const colonIdx = decoded.indexOf(":");
    if (colonIdx > 0) {
      clientId = decodeURIComponent(decoded.slice(0, colonIdx));
      clientSecret = decodeURIComponent(decoded.slice(colonIdx + 1));
    }
  }

  if (body.grant_type === "authorization_code") {
    return handleAuthorizationCodeGrant(c, {
      code: body.code,
      redirectUri: body.redirect_uri,
      clientId,
      clientSecret,
      codeVerifier: body.code_verifier,
    });
  }

  if (body.grant_type === "refresh_token") {
    return handleRefreshTokenGrant(c, {
      refreshToken: body.refresh_token,
      clientId,
      clientSecret,
    });
  }

  throw badRequest(`Unsupported grant_type: ${body.grant_type}`);
});

async function handleAuthorizationCodeGrant(
  c: any,
  params: {
    code?: string;
    redirectUri?: string;
    clientId?: string;
    clientSecret?: string;
    codeVerifier?: string;
  }
) {
  if (!params.code) throw badRequest("code is required");
  if (!params.redirectUri) throw badRequest("redirect_uri is required");
  if (!params.clientId) throw badRequest("client_id is required");
  if (!params.codeVerifier) throw badRequest("code_verifier is required (PKCE)");

  const codeHash = hashToken(params.code);

  // Find and validate the authorization code
  const [authCode] = await db
    .select()
    .from(oauthAuthorizationCodes)
    .where(eq(oauthAuthorizationCodes.code, codeHash))
    .limit(1);

  if (!authCode) throw unauthorized("Invalid authorization code");
  if (authCode.consumedAt) throw unauthorized("Authorization code already used");
  if (new Date(authCode.expiresAt) < new Date())
    throw unauthorized("Authorization code expired");
  if (authCode.clientId !== params.clientId)
    throw unauthorized("client_id mismatch");
  if (authCode.redirectUri !== params.redirectUri)
    throw unauthorized("redirect_uri mismatch");

  // Verify PKCE
  if (
    !verifyPkce(
      params.codeVerifier,
      authCode.codeChallenge,
      authCode.codeChallengeMethod
    )
  ) {
    throw unauthorized("PKCE verification failed");
  }

  // Verify client secret if client is confidential
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.id, params.clientId))
    .limit(1);

  if (!client) throw unauthorized("Unknown client");

  if (client.clientSecretHash) {
    if (!params.clientSecret) throw unauthorized("client_secret is required");
    if (hashToken(params.clientSecret) !== client.clientSecretHash) {
      throw unauthorized("Invalid client_secret");
    }
  }

  // Mark code as consumed (single-use)
  await db
    .update(oauthAuthorizationCodes)
    .set({ consumedAt: new Date() })
    .where(eq(oauthAuthorizationCodes.code, codeHash));

  // Issue tokens
  const { accessToken, refreshToken, expiresIn } = await issueTokens({
    userId: authCode.userId,
    projectId: authCode.projectId,
    clientId: params.clientId,
    scopes: authCode.scopes,
  });

  return c.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    refresh_token: refreshToken,
    scope: authCode.scopes.join(" "),
  });
}

async function handleRefreshTokenGrant(
  c: any,
  params: {
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
  }
) {
  if (!params.refreshToken) throw badRequest("refresh_token is required");
  if (!params.clientId) throw badRequest("client_id is required");

  const tokenHash = hashToken(params.refreshToken);

  // Find the refresh token
  const [storedToken] = await db
    .select()
    .from(oauthRefreshTokens)
    .where(
      and(
        eq(oauthRefreshTokens.tokenHash, tokenHash),
        isNull(oauthRefreshTokens.revokedAt)
      )
    )
    .limit(1);

  if (!storedToken) throw unauthorized("Invalid or revoked refresh token");
  if (new Date(storedToken.expiresAt) < new Date())
    throw unauthorized("Refresh token expired");
  if (storedToken.clientId !== params.clientId)
    throw unauthorized("client_id mismatch");

  // Verify client secret if confidential
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.id, params.clientId))
    .limit(1);

  if (!client) throw unauthorized("Unknown client");

  if (client.clientSecretHash) {
    if (!params.clientSecret) throw unauthorized("client_secret is required");
    if (hashToken(params.clientSecret) !== client.clientSecretHash) {
      throw unauthorized("Invalid client_secret");
    }
  }

  // Rotate: revoke old token
  await db
    .update(oauthRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(oauthRefreshTokens.id, storedToken.id));

  // Issue new tokens (with rotation chain tracking)
  const { accessToken, refreshToken, expiresIn } = await issueTokens({
    userId: storedToken.userId,
    projectId: storedToken.projectId,
    clientId: params.clientId,
    scopes: storedToken.scopes,
    parentRefreshTokenId: storedToken.id,
  });

  return c.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    refresh_token: refreshToken,
    scope: storedToken.scopes.join(" "),
  });
}

/**
 * Issue an access token (JWT) + refresh token (opaque, DB-stored).
 */
async function issueTokens(params: {
  userId: string;
  projectId: string;
  clientId: string;
  scopes: string[];
  parentRefreshTokenId?: string;
}) {
  const jti = `jti_${nanoid(21)}`;

  // Sign JWT access token
  const accessToken = await new SignJWT({
    project_id: params.projectId,
    client_id: params.clientId,
    scopes: params.scopes,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setSubject(params.userId)
    .setAudience(`${ISSUER}/mcp`)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .sign(getJwtSecret());

  // Generate opaque refresh token
  const rawRefresh = generateOpaqueToken();
  const refreshHash = hashToken(rawRefresh);

  await db.insert(oauthRefreshTokens).values({
    tokenHash: refreshHash,
    clientId: params.clientId,
    userId: params.userId,
    projectId: params.projectId,
    scopes: params.scopes,
    parentId: params.parentRefreshTokenId ?? null,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
  });

  return {
    accessToken,
    refreshToken: rawRefresh,
    expiresIn: ACCESS_TOKEN_TTL,
  };
}

// ── Revocation Endpoint (RFC 7009) ──

/**
 * POST /oauth/revoke
 *
 * Revoke an access token (by JTI) or refresh token.
 */
app.post("/oauth/revoke", async (c) => {
  const body = await c.req.json<{
    token: string;
    token_type_hint?: "access_token" | "refresh_token";
  }>();

  if (!body.token) throw badRequest("token is required");

  // Try as refresh token first
  if (body.token_type_hint !== "access_token") {
    const hash = hashToken(body.token);
    const [found] = await db
      .select({ id: oauthRefreshTokens.id })
      .from(oauthRefreshTokens)
      .where(eq(oauthRefreshTokens.tokenHash, hash))
      .limit(1);

    if (found) {
      await db
        .update(oauthRefreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(oauthRefreshTokens.id, found.id));
      return c.json({ ok: true });
    }
  }

  // Try as access token (JWT) — extract JTI and add to revoked set
  if (body.token_type_hint !== "refresh_token") {
    try {
      const { payload } = await jwtVerify(body.token, getJwtSecret(), {
        issuer: ISSUER,
      });

      if (payload.jti && payload.exp) {
        await db.insert(oauthRevokedJtis).values({
          jti: payload.jti,
          expiresAt: new Date(payload.exp * 1000),
        }).onConflictDoNothing();
      }
      return c.json({ ok: true });
    } catch {
      // Token may be expired or invalid — still return 200 per RFC 7009
    }
  }

  // Per RFC 7009, always return 200 even if token was not found
  return c.json({ ok: true });
});

// ── Introspection Endpoint (RFC 7662) ──

/**
 * POST /oauth/introspect
 *
 * Introspect a token to check its validity and claims.
 * Intended for internal use by resource servers.
 */
app.post("/oauth/introspect", async (c) => {
  const body = await c.req.json<{ token: string }>();

  if (!body.token) throw badRequest("token is required");

  try {
    const { payload } = await jwtVerify(body.token, getJwtSecret(), {
      issuer: ISSUER,
      audience: `${ISSUER}/mcp`,
    });

    // Check if JTI has been revoked
    if (payload.jti) {
      const [revoked] = await db
        .select({ jti: oauthRevokedJtis.jti })
        .from(oauthRevokedJtis)
        .where(eq(oauthRevokedJtis.jti, payload.jti))
        .limit(1);

      if (revoked) {
        return c.json({ active: false });
      }
    }

    return c.json({
      active: true,
      sub: payload.sub,
      client_id: (payload as any).client_id,
      scope: ((payload as any).scopes ?? []).join(" "),
      exp: payload.exp,
      iat: payload.iat,
      iss: payload.iss,
      jti: payload.jti,
      project_id: (payload as any).project_id,
    });
  } catch {
    return c.json({ active: false });
  }
});

/**
 * POST /oauth/internal/validate-request
 *
 * Internal endpoint called by the dashboard consent screen to validate
 * an OAuth authorization request before showing it to the user.
 */
app.post("/oauth/internal/validate-request", async (c) => {
  const body = await c.req.json<{
    client_id: string;
    redirect_uri: string;
    scope: string;
    code_challenge: string;
    code_challenge_method: string;
  }>();

  const [client] = await db
    .select({
      id: oauthClients.id,
      clientName: oauthClients.clientName,
      logoUri: oauthClients.logoUri,
      policyUri: oauthClients.policyUri,
      tosUri: oauthClients.tosUri,
      redirectUris: oauthClients.redirectUris,
    })
    .from(oauthClients)
    .where(eq(oauthClients.id, body.client_id))
    .limit(1);

  if (!client) throw notFound("Client not found");
  if (!client.redirectUris.includes(body.redirect_uri)) {
    throw badRequest("redirect_uri is not registered for this client");
  }

  if (body.code_challenge_method !== "S256") {
    throw badRequest("code_challenge_method must be S256");
  }

  const scopes = body.scope.split(" ").filter(Boolean);
  for (const s of scopes) {
    if (!(VALID_SCOPES as readonly string[]).includes(s)) {
      throw badRequest(`Invalid scope: ${s}`);
    }
  }

  return c.json({
    valid: true,
    client: {
      id: client.id,
      name: client.clientName,
      logo_uri: client.logoUri,
      policy_uri: client.policyUri,
      tos_uri: client.tosUri,
    },
    scopes,
  });
});

export { app as oauthRoutes };
