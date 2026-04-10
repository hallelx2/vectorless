import type { Context, Next } from "hono";
import { createHash } from "node:crypto";
import { db } from "../db/client.js";
import { apiKeys } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { unauthorized } from "./error-handler.js";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw unauthorized("Missing Authorization header. Use: Bearer <api_key>");
  }

  const key = authHeader.slice(7);
  if (!key.startsWith("vl_")) {
    throw unauthorized("Invalid API key format");
  }

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
  });

  await next();
}
