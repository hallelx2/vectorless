"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { oauthConsents, oauthClients, oauthRefreshTokens } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export interface ConnectedApp {
  id: string;
  clientId: string;
  clientName: string;
  logoUri: string | null;
  scopes: string[];
  grantedAt: Date;
  source: string;
}

/**
 * List all OAuth apps the current user has granted consent to.
 */
export async function listConnectedApps(): Promise<{
  apps: ConnectedApp[];
  error?: string;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { apps: [], error: "Unauthorized" };

  const rows = await db
    .select({
      consentId: oauthConsents.id,
      clientId: oauthConsents.clientId,
      scopes: oauthConsents.scopes,
      grantedAt: oauthConsents.grantedAt,
      clientName: oauthClients.clientName,
      logoUri: oauthClients.logoUri,
      source: oauthClients.source,
    })
    .from(oauthConsents)
    .innerJoin(oauthClients, eq(oauthConsents.clientId, oauthClients.id))
    .where(
      and(
        eq(oauthConsents.userId, session.user.id),
        isNull(oauthConsents.revokedAt)
      )
    );

  return {
    apps: rows.map((r) => ({
      id: r.consentId,
      clientId: r.clientId,
      clientName: r.clientName,
      logoUri: r.logoUri,
      scopes: r.scopes,
      grantedAt: r.grantedAt,
      source: r.source,
    })),
  };
}

/**
 * Revoke consent for an OAuth app, invalidating all its tokens.
 */
export async function revokeConnectedApp(
  consentId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Unauthorized" };

  // Find the consent record
  const [consent] = await db
    .select()
    .from(oauthConsents)
    .where(
      and(
        eq(oauthConsents.id, consentId),
        eq(oauthConsents.userId, session.user.id)
      )
    )
    .limit(1);

  if (!consent) return { success: false, error: "Consent not found" };

  // Mark the consent as revoked
  await db
    .update(oauthConsents)
    .set({ revokedAt: new Date() })
    .where(eq(oauthConsents.id, consentId));

  // Revoke all refresh tokens for this client + user
  await db
    .update(oauthRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(oauthRefreshTokens.userId, session.user.id),
        eq(oauthRefreshTokens.clientId, consent.clientId),
        isNull(oauthRefreshTokens.revokedAt)
      )
    );

  return { success: true };
}
