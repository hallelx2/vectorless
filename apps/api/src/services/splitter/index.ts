import type { ToCTreeNode } from "@vectorless/shared";
import type { ToCResult, ToCResultSection } from "../toc/index.js";

const MAX_TOKENS = 15_000;
const MIN_TOKENS = 100;

// Rough token estimation: ~4 chars per token
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Tree-aware section processing.
 *
 * Rules:
 * - Only split/merge LEAF nodes. Branch nodes are navigational (typically small).
 * - When splitting an oversized leaf, sub-parts become children of the original
 *   (which becomes a branch node). This preserves tree invariants.
 * - When merging undersized leaves, only merge with siblings (same parent).
 *   Never merge across branches.
 */
export function processSections(tocResult: ToCResult): ToCResult {
  const sections = [...tocResult.sections];
  const processedSections: ToCResultSection[] = [];

  // Group leaves by parent for sibling-aware merging
  const leavesByParent = new Map<string | null, ToCResultSection[]>();
  const branchSections: ToCResultSection[] = [];

  for (const section of sections) {
    if (!section.isLeaf) {
      branchSections.push({ ...section });
    } else {
      const parentKey = section.parentId;
      const group = leavesByParent.get(parentKey) ?? [];
      group.push({ ...section });
      leavesByParent.set(parentKey, group);
    }
  }

  // Process each group of sibling leaves
  for (const [parentId, leaves] of leavesByParent) {
    const processedLeaves: ToCResultSection[] = [];

    for (const leaf of leaves) {
      const tokenCount = estimateTokens(leaf.content);

      if (tokenCount > MAX_TOKENS) {
        // Split oversized leaf: original becomes branch, parts become children
        const parts = splitOversizedLeaf(leaf);
        if (parts.length > 1) {
          // Original becomes a branch node
          const branchVersion: ToCResultSection = {
            ...leaf,
            isLeaf: false,
            childIds: parts.map((p) => p.id),
            // Keep intro content (first ~500 chars) for the branch summary
            content: leaf.content.slice(0, 500),
          };
          branchSections.push(branchVersion);
          processedLeaves.push(...parts);
        } else {
          // Couldn't split further, keep as-is
          processedLeaves.push(leaf);
        }
      } else if (tokenCount < MIN_TOKENS && processedLeaves.length > 0) {
        // Merge with previous sibling (same parent)
        const prev = processedLeaves[processedLeaves.length - 1]!;
        if (prev.parentId === leaf.parentId) {
          prev.content += "\n\n" + leaf.content;
          prev.summary += " " + leaf.summary;
        } else {
          processedLeaves.push(leaf);
        }
      } else {
        processedLeaves.push(leaf);
      }
    }

    processedSections.push(...processedLeaves);
  }

  // Combine branch and leaf sections, sort by a consistent order
  const allSections = [...branchSections, ...processedSections];

  // Re-index orderIndex
  // Sort: branches first (by level, then by original order), then leaves
  allSections.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.orderIndex - b.orderIndex;
  });
  allSections.forEach((s, i) => {
    s.orderIndex = i;
  });

  // Update childIds for any branches that had their children split
  const sectionIds = new Set(allSections.map((s) => s.id));
  for (const section of allSections) {
    section.childIds = section.childIds.filter((id) => sectionIds.has(id));
  }

  // Rebuild flat ToC entries
  const tocEntries = allSections.map((s) => ({
    section_id: s.id,
    title: s.title,
    summary: s.summary,
    page_range: s.pageRange,
    link: `/v1/documents/${tocResult.toc.doc_id}/sections/${s.id}`,
  }));

  // Rebuild tree ToC
  const treeToc = tocResult.treeToc
    ? {
        ...tocResult.treeToc,
        section_count: allSections.length,
        tree: buildTreeNodesFromSections(allSections, tocResult.toc.doc_id),
      }
    : tocResult.treeToc;

  return {
    toc: {
      ...tocResult.toc,
      section_count: allSections.length,
      sections: tocEntries,
    },
    treeToc,
    sections: allSections,
  };
}

function splitOversizedLeaf(
  section: ToCResultSection
): ToCResultSection[] {
  const paragraphs = section.content.split(/\n\n+/);

  if (paragraphs.length <= 1) {
    return [section];
  }

  const targetSize = MAX_TOKENS;
  const parts: string[] = [];
  let currentPart = "";

  for (const para of paragraphs) {
    if (
      estimateTokens(currentPart + "\n\n" + para) > targetSize &&
      currentPart.length > 0
    ) {
      parts.push(currentPart.trim());
      currentPart = para;
    } else {
      currentPart += (currentPart ? "\n\n" : "") + para;
    }
  }
  if (currentPart.trim()) {
    parts.push(currentPart.trim());
  }

  if (parts.length <= 1) {
    return [section];
  }

  return parts.map((content, i) => ({
    id: `${section.id}-p${i}`,
    title:
      parts.length > 1
        ? `${section.title} (Part ${i + 1} of ${parts.length})`
        : section.title,
    summary: section.summary,
    content,
    level: section.level + 1,
    orderIndex: section.orderIndex + i,
    pageRange: section.pageRange
      ? estimatePartPageRange(section.pageRange, i, parts.length)
      : null,
    parentId: section.id,
    childIds: [],
    isLeaf: true,
  }));
}

/**
 * Estimate page range for a split part based on proportional position.
 * Better than naively copying the parent's full range to every part.
 */
function estimatePartPageRange(
  parentRange: { start: number; end: number },
  partIndex: number,
  totalParts: number
): { start: number; end: number } {
  const totalPages = parentRange.end - parentRange.start + 1;
  const pagesPerPart = totalPages / totalParts;

  const start = Math.floor(parentRange.start + partIndex * pagesPerPart);
  const end = Math.floor(
    parentRange.start + (partIndex + 1) * pagesPerPart - 1
  );

  return {
    start: Math.max(start, parentRange.start),
    end: Math.min(Math.max(end, start), parentRange.end),
  };
}

/**
 * Build tree nodes from flat section list (used for rebuilding after splitting).
 */
function buildTreeNodesFromSections(
  sections: ToCResultSection[],
  docId: string
): ToCTreeNode[] {
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
  return rootSections.map(buildNode);
}
