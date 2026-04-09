import { db } from "../db/client.js";
import { sections } from "../db/schema.js";
import { eq, and, inArray, asc } from "drizzle-orm";

export interface CreateSectionInput {
  id: string; // Use the ToC-generated section ID so DB and ToC match
  docId: string;
  title: string;
  summary: string | null;
  content: string;
  pageRange: { start: number; end: number } | null;
  orderIndex: number;
  level: number;
  tokenCount: number;
  parentSectionId?: string;
  crossReferences?: unknown[];
}

export async function createSections(inputs: CreateSectionInput[]) {
  if (inputs.length === 0) return [];

  const values = inputs.map((input) => ({
    id: input.id,
    docId: input.docId,
    title: input.title,
    summary: input.summary,
    content: input.content,
    pageRange: input.pageRange as unknown as Record<string, unknown>,
    orderIndex: input.orderIndex,
    level: input.level,
    tokenCount: input.tokenCount,
    parentSectionId: input.parentSectionId ?? null,
    crossReferences: (input.crossReferences ?? null) as unknown as Record<string, unknown>,
  }));

  return db.insert(sections).values(values).returning();
}

export async function getSection(
  docId: string,
  sectionId: string,
  projectId: string
) {
  // Verify document belongs to project by joining
  const [section] = await db
    .select()
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.docId, docId)))
    .limit(1);

  return section ?? null;
}

export async function getSectionsByIds(docId: string, sectionIds: string[]) {
  if (sectionIds.length === 0) return [];

  return db
    .select()
    .from(sections)
    .where(and(eq(sections.docId, docId), inArray(sections.id, sectionIds)))
    .orderBy(asc(sections.orderIndex));
}

export async function getAllSections(docId: string) {
  return db
    .select()
    .from(sections)
    .where(eq(sections.docId, docId))
    .orderBy(asc(sections.orderIndex));
}
