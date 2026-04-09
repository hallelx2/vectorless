"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { playgroundSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

export async function runPlaygroundQuery(data: {
  query: string;
  docIds: string[];
  strategy: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/playground`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: data.query,
        doc_id: data.docIds.length > 0 ? data.docIds[0] : undefined,
        strategy: data.strategy,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body?.error?.message || `Query failed: ${res.status}` };
    }

    const result = await res.json();
    return { success: true, data: result };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to run playground query",
    };
  }
}

export async function savePlaygroundSession(data: {
  name?: string;
  query: string;
  docIds: string[];
  tocStrategy: string;
  selectedSections?: unknown;
  reasoning?: string;
  timing?: unknown;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const id = generateId();

    await db.insert(playgroundSessions).values({
      id,
      userId: session.user.id,
      name: data.name || `Query: ${data.query.slice(0, 50)}`,
      query: data.query,
      docIds: data.docIds,
      tocStrategy: data.tocStrategy,
      selectedSections: data.selectedSections ?? null,
      reasoning: data.reasoning ?? null,
      timing: data.timing ?? null,
    });

    return { success: true, sessionId: id };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to save playground session",
    };
  }
}

export async function listPlaygroundSessions() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized", sessions: [] };
  }

  try {
    const sessions = await db
      .select({
        id: playgroundSessions.id,
        name: playgroundSessions.name,
        query: playgroundSessions.query,
        docIds: playgroundSessions.docIds,
        tocStrategy: playgroundSessions.tocStrategy,
        selectedSections: playgroundSessions.selectedSections,
        reasoning: playgroundSessions.reasoning,
        timing: playgroundSessions.timing,
        createdAt: playgroundSessions.createdAt,
      })
      .from(playgroundSessions)
      .where(eq(playgroundSessions.userId, session.user.id))
      .orderBy(desc(playgroundSessions.createdAt))
      .limit(50);

    return { success: true, sessions };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to list playground sessions",
      sessions: [],
    };
  }
}
