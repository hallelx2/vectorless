"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { llmKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt, maskKey } from "@/lib/encryption";

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(21);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

export type LLMProvider = "gemini" | "anthropic" | "openai";

export interface LLMKeyPublic {
  id: string;
  provider: LLMProvider;
  label: string;
  keyMask: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createLLMKey(data: {
  provider: LLMProvider;
  label: string;
  apiKey: string;
}): Promise<{ success?: boolean; key?: LLMKeyPublic; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  try {
    const encrypted = encrypt(data.apiKey);
    const mask = maskKey(data.apiKey);
    const id = generateId();

    const [inserted] = await db
      .insert(llmKeys)
      .values({
        id,
        userId: session.user.id,
        provider: data.provider,
        label: data.label,
        encryptedKey: encrypted,
        keyMask: mask,
        isActive: true,
      })
      .returning();

    return {
      success: true,
      key: toPublic(inserted!),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to store LLM key" };
  }
}

export async function listLLMKeys(): Promise<{
  keys: LLMKeyPublic[];
  error?: string;
}> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { keys: [], error: "Unauthorized" };

  try {
    const keys = await db
      .select()
      .from(llmKeys)
      .where(eq(llmKeys.userId, session.user.id))
      .orderBy(llmKeys.createdAt);

    return { keys: keys.map(toPublic) };
  } catch (err) {
    return { keys: [], error: err instanceof Error ? err.message : "Failed to list keys" };
  }
}

export async function updateLLMKey(
  keyId: string,
  updates: { label?: string; apiKey?: string; isActive?: boolean }
): Promise<{ success?: boolean; key?: LLMKeyPublic; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  try {
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };

    if (updates.label !== undefined) updateValues.label = updates.label;
    if (updates.apiKey !== undefined) {
      updateValues.encryptedKey = encrypt(updates.apiKey);
      updateValues.keyMask = maskKey(updates.apiKey);
    }
    if (updates.isActive !== undefined) updateValues.isActive = updates.isActive;

    const [updated] = await db
      .update(llmKeys)
      .set(updateValues)
      .where(and(eq(llmKeys.id, keyId), eq(llmKeys.userId, session.user.id)))
      .returning();

    if (!updated) return { error: "Key not found" };
    return { success: true, key: toPublic(updated) };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update key" };
  }
}

export async function deleteLLMKey(
  keyId: string
): Promise<{ success?: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized" };

  try {
    await db
      .delete(llmKeys)
      .where(and(eq(llmKeys.id, keyId), eq(llmKeys.userId, session.user.id)));

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete key" };
  }
}

function toPublic(key: typeof llmKeys.$inferSelect): LLMKeyPublic {
  return {
    id: key.id,
    provider: key.provider as LLMProvider,
    label: key.label,
    keyMask: key.keyMask,
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    createdAt: key.createdAt.toISOString(),
    updatedAt: key.updatedAt.toISOString(),
  };
}
