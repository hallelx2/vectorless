import type { ToCTreeNode, ToCTreeManifest } from "@vectorless/shared";
import type { ParsedDocument } from "../parser/types.js";
import type { ToCResultSection } from "./index.js";

/**
 * Build a ToCTreeManifest from a flat list of ToCResultSection[].
 * Assembles parent-child relationships into nested ToCTreeNode[].
 */
export function buildTreeToCFromSections(
  sections: ToCResultSection[],
  docId: string,
  doc: ParsedDocument
): ToCTreeManifest {
  const sectionMap = new Map<string, ToCResultSection>();
  for (const s of sections) {
    sectionMap.set(s.id, s);
  }

  function buildNode(section: ToCResultSection): ToCTreeNode {
    const children = section.childIds
      .map((id) => sectionMap.get(id))
      .filter((s): s is ToCResultSection => s != null)
      .map(buildNode);

    return {
      section_id: section.id,
      title: section.title,
      summary: section.summary,
      level: section.level,
      page_range: section.pageRange,
      token_count: estimateTokens(section.content),
      child_count: children.length,
      is_leaf: section.isLeaf,
      link: `/v1/documents/${docId}/sections/${section.id}`,
      children,
    };
  }

  const rootSections = sections.filter((s) => s.parentId === null);
  const treeNodes = rootSections.map(buildNode);
  const maxDepth = sections.reduce((max, s) => Math.max(max, s.level), 0);

  return {
    doc_id: docId,
    title: doc.title,
    source_type: doc.sourceType,
    section_count: sections.length,
    depth: maxDepth || 1,
    created_at: new Date().toISOString(),
    tree: treeNodes,
  };
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
