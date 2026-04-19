import { db } from "../db/client.js";
import { sections } from "../db/schema.js";
import { eq, and, inArray, asc, isNull } from "drizzle-orm";

export interface CreateSectionInput {
  id: string; // Use the ToC-generated section ID so DB and ToC match
  docId: string;
  title: string;
  summary: string | null;
  content: string;
  pageRange: { start: number; end: number } | null;
  orderIndex: number;
  level: number;
  isLeaf: boolean;
  tokenCount: number;
  parentSectionId?: string | null;
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
    isLeaf: input.isLeaf ? "true" : "false",
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

// ── Tree Query Functions ──

/**
 * Get root-level sections (no parent) for a document.
 * These are the top-level branches of the document tree.
 */
export async function getRootSections(docId: string) {
  return db
    .select()
    .from(sections)
    .where(and(eq(sections.docId, docId), isNull(sections.parentSectionId)))
    .orderBy(asc(sections.orderIndex));
}

/**
 * Get children of a specific section.
 */
export async function getChildSections(docId: string, parentSectionId: string) {
  return db
    .select()
    .from(sections)
    .where(
      and(
        eq(sections.docId, docId),
        eq(sections.parentSectionId, parentSectionId)
      )
    )
    .orderBy(asc(sections.orderIndex));
}

/**
 * Get siblings of a section (same parent, including itself).
 */
export async function getSiblingSections(docId: string, sectionId: string) {
  // First get the section to find its parent
  const [section] = await db
    .select({ parentSectionId: sections.parentSectionId })
    .from(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.docId, docId)))
    .limit(1);

  if (!section) return [];

  if (section.parentSectionId === null) {
    // Root-level section — siblings are all other root sections
    return getRootSections(docId);
  }

  return getChildSections(docId, section.parentSectionId);
}

/**
 * Get a section and its ancestor chain up to the root.
 */
export async function getSectionWithAncestors(docId: string, sectionId: string) {
  const ancestors: Awaited<ReturnType<typeof getAllSections>> = [];
  let currentId: string | null = sectionId;

  while (currentId) {
    const [section] = await db
      .select()
      .from(sections)
      .where(and(eq(sections.id, currentId), eq(sections.docId, docId)))
      .limit(1);

    if (!section) break;
    ancestors.push(section);
    currentId = section.parentSectionId;
  }

  return ancestors.reverse(); // Root first, target last
}
