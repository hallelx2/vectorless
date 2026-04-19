import { db } from "../db/client.js";
import { documents } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import type { ToCManifest, ToCTreeManifest } from "@vectorless/shared";

export async function createDocument(data: {
  projectId: string;
  title: string;
  sourceType: "pdf" | "docx" | "txt" | "url";
  tocStrategy: "extract" | "generate" | "hybrid";
  originalFileUrl?: string;
}) {
  const [doc] = await db
    .insert(documents)
    .values({
      projectId: data.projectId,
      title: data.title,
      sourceType: data.sourceType,
      tocStrategy: data.tocStrategy,
      originalFileUrl: data.originalFileUrl ?? null,
      status: "processing",
    })
    .returning();
  return doc!;
}

export async function getDocument(docId: string, projectId: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, docId), eq(documents.projectId, projectId)))
    .limit(1);
  return doc ?? null;
}

export async function listDocuments(
  projectId: string,
  limit = 20,
  cursor?: string
) {
  let query = db
    .select()
    .from(documents)
    .where(eq(documents.projectId, projectId))
    .orderBy(desc(documents.createdAt))
    .limit(limit + 1);

  // Simple cursor-based pagination using createdAt
  const results = await query;

  const hasMore = results.length > limit;
  const docs = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? docs[docs.length - 1]!.id : null;

  return { documents: docs, next_cursor: nextCursor, has_more: hasMore };
}

export async function updateDocumentReady(
  docId: string,
  toc: ToCManifest,
  sectionCount: number,
  treeToc?: ToCTreeManifest
) {
  await db
    .update(documents)
    .set({
      status: "ready",
      toc: toc as unknown as Record<string, unknown>,
      treeToc: (treeToc ?? null) as unknown as Record<string, unknown>,
      sectionCount,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, docId));
}

export async function updateDocumentFailed(
  docId: string,
  errorMessage: string
) {
  await db
    .update(documents)
    .set({
      status: "failed",
      errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, docId));
}

export async function deleteDocument(docId: string, projectId: string) {
  await db
    .delete(documents)
    .where(and(eq(documents.id, docId), eq(documents.projectId, projectId)));
}
