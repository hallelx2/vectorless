import { Hono } from "hono";
import { lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  oauthRevokedJtis,
  oauthAuthorizationCodes,
} from "../../db/schema.js";

const app = new Hono();

/**
 * POST /v1/webhooks/cleanup
 *
 * Nightly cleanup cron job (triggered by QStash).
 * Removes expired:
 *  - Revoked JTIs (access token blacklist entries past their expiry)
 *  - Authorization codes (consumed or expired, past their window)
 *
 * Schedule in QStash dashboard:
 *   POST https://api.vectorless.store/v1/webhooks/cleanup
 *   Cron: 0 3 * * *  (daily at 03:00 UTC)
 */
app.post("/cleanup", async (c) => {
  const now = new Date();

  // Delete expired revoked JTIs
  const deletedJtis = await db
    .delete(oauthRevokedJtis)
    .where(lt(oauthRevokedJtis.expiresAt, now))
    .returning({ jti: oauthRevokedJtis.jti });

  // Delete expired authorization codes
  const deletedCodes = await db
    .delete(oauthAuthorizationCodes)
    .where(lt(oauthAuthorizationCodes.expiresAt, now))
    .returning({ code: oauthAuthorizationCodes.code });

  return c.json({
    deleted_jtis: deletedJtis.length,
    deleted_auth_codes: deletedCodes.length,
    cleaned_at: now.toISOString(),
  });
});

export { app as cleanupRoutes };
