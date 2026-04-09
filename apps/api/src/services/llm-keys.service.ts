import { db } from "../db/client.js";
import { llmKeys } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { encrypt, decrypt, maskKey } from "./encryption.service.js";

export type LLMProviderName = "gemini" | "anthropic" | "openai";

export interface CreateLLMKeyInput {
  projectId: string;
  provider: LLMProviderName;
  label: string;
  apiKey: string; // plaintext — will be encrypted before storage
}

export interface LLMKeyPublic {
  id: string;
  provider: LLMProviderName;
  label: string;
  key_mask: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Store a new LLM API key (encrypted).
 */
export async function createLLMKey(input: CreateLLMKeyInput): Promise<LLMKeyPublic> {
  const encrypted = encrypt(input.apiKey);
  const mask = maskKey(input.apiKey);

  const [key] = await db
    .insert(llmKeys)
    .values({
      projectId: input.projectId,
      provider: input.provider,
      label: input.label,
      encryptedKey: encrypted,
      keyMask: mask,
      isActive: "true",
    })
    .returning();

  return toPublic(key!);
}

/**
 * List all LLM keys for a project (no decryption — returns masked keys).
 */
export async function listLLMKeys(projectId: string): Promise<LLMKeyPublic[]> {
  const keys = await db
    .select()
    .from(llmKeys)
    .where(eq(llmKeys.projectId, projectId))
    .orderBy(llmKeys.createdAt);

  return keys.map(toPublic);
}

/**
 * Get a specific LLM key by ID (no decryption).
 */
export async function getLLMKey(
  keyId: string,
  projectId: string
): Promise<LLMKeyPublic | null> {
  const [key] = await db
    .select()
    .from(llmKeys)
    .where(and(eq(llmKeys.id, keyId), eq(llmKeys.projectId, projectId)))
    .limit(1);

  return key ? toPublic(key) : null;
}

/**
 * Get the ACTIVE decrypted key for a specific provider in a project.
 * This is what the ingest pipeline calls to get the actual API key.
 * Returns null if no BYOK key exists → caller should fall back to platform key.
 */
export async function getDecryptedKeyForProvider(
  projectId: string,
  provider: LLMProviderName
): Promise<{ id: string; apiKey: string } | null> {
  const [key] = await db
    .select()
    .from(llmKeys)
    .where(
      and(
        eq(llmKeys.projectId, projectId),
        eq(llmKeys.provider, provider),
        eq(llmKeys.isActive, "true")
      )
    )
    .limit(1);

  if (!key) return null;

  // Update last_used_at (fire and forget)
  db.update(llmKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(llmKeys.id, key.id))
    .execute()
    .catch(() => {});

  return {
    id: key.id,
    apiKey: decrypt(key.encryptedKey),
  };
}

/**
 * Update a key's label or replace the API key.
 */
export async function updateLLMKey(
  keyId: string,
  projectId: string,
  updates: { label?: string; apiKey?: string; isActive?: boolean }
): Promise<LLMKeyPublic | null> {
  const existing = await db
    .select()
    .from(llmKeys)
    .where(and(eq(llmKeys.id, keyId), eq(llmKeys.projectId, projectId)))
    .limit(1);

  if (!existing[0]) return null;

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (updates.label !== undefined) {
    updateValues.label = updates.label;
  }
  if (updates.apiKey !== undefined) {
    updateValues.encryptedKey = encrypt(updates.apiKey);
    updateValues.keyMask = maskKey(updates.apiKey);
  }
  if (updates.isActive !== undefined) {
    updateValues.isActive = updates.isActive ? "true" : "false";
  }

  const [updated] = await db
    .update(llmKeys)
    .set(updateValues)
    .where(and(eq(llmKeys.id, keyId), eq(llmKeys.projectId, projectId)))
    .returning();

  return updated ? toPublic(updated) : null;
}

/**
 * Delete an LLM key.
 */
export async function deleteLLMKey(
  keyId: string,
  projectId: string
): Promise<boolean> {
  const result = await db
    .delete(llmKeys)
    .where(and(eq(llmKeys.id, keyId), eq(llmKeys.projectId, projectId)));

  return true;
}

/**
 * Convert DB row to public-safe response (no encrypted data exposed).
 */
function toPublic(key: typeof llmKeys.$inferSelect): LLMKeyPublic {
  return {
    id: key.id,
    provider: key.provider as LLMProviderName,
    label: key.label,
    key_mask: key.keyMask,
    is_active: key.isActive === "true",
    last_used_at: key.lastUsedAt?.toISOString() ?? null,
    created_at: key.createdAt.toISOString(),
    updated_at: key.updatedAt.toISOString(),
  };
}
