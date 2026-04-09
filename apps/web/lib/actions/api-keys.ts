"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "vl_live_sk_";
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (const byte of array) {
    key += chars[byte % chars.length];
  }
  return key;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createApiKey(data: {
  name: string;
  permissions?: string;
  expiresAt?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const rawKey = generateApiKey();
    const keyHash = await hashKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);
    const id = generateId();

    await db.insert(apiKeys).values({
      id,
      userId: session.user.id,
      name: data.name,
      keyPrefix,
      keyHash,
      permissions: data.permissions || "full",
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });

    // Return the raw key - it can only be shown once
    return {
      success: true,
      key: rawKey,
      keyId: id,
      name: data.name,
      prefix: keyPrefix,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to create API key",
    };
  }
}

export async function revokeApiKey(keyId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)));

    return { success: true };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to revoke API key",
    };
  }
}

export async function listApiKeys() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized", keys: [] };
  }

  try {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        rateLimit: apiKeys.rateLimit,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(
        and(eq(apiKeys.userId, session.user.id), isNull(apiKeys.revokedAt))
      );

    return { success: true, keys };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to list API keys",
      keys: [],
    };
  }
}
