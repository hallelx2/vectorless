import type { NativeHeading, ParsedDocument } from "../parser/types.js";
import type {
  ToCEntry,
  ToCManifest,
  ToCTreeNode,
  ToCTreeManifest,
} from "@vectorless/shared";
import type { ToCResult, ToCResultSection } from "./index.js";

/**
 * Extract strategy: Preserves the document's native heading hierarchy as a tree.
 *
 * Previously this flattened the tree into a list. Now it walks NativeHeading.children
 * recursively, assigning section IDs at every level and preserving parent-child links.
 */
export function extractToC(
  doc: ParsedDocument,
  docId: string
): ToCResult {
  const headings = doc.nativeStructure;

  if (!headings || headings.length === 0) {
    // No structure found — treat entire document as one leaf section
    const sectionId = `${docId}-s0`;
    const summary = generateExcerptSummary(doc.fullText);
    const tokenCount = estimateTokens(doc.fullText);

    const section: ToCResultSection = {
      id: sectionId,
      title: doc.title,
      summary,
      content: doc.fullText,
      level: 1,
      orderIndex: 0,
      pageRange: null,
      parentId: null,
      childIds: [],
      isLeaf: true,
    };

    const tocEntry: ToCEntry = {
      section_id: sectionId,
      title: doc.title,
      summary,
      page_range: null,
      link: `/v1/documents/${docId}/sections/${sectionId}`,
    };

    const treeNode: ToCTreeNode = {
      section_id: sectionId,
      title: doc.title,
      summary,
      level: 1,
      page_range: null,
      token_count: tokenCount,
      child_count: 0,
      is_leaf: true,
      link: `/v1/documents/${docId}/sections/${sectionId}`,
      children: [],
    };

    return {
      toc: {
        doc_id: docId,
        title: doc.title,
        source_type: doc.sourceType,
        section_count: 1,
        created_at: new Date().toISOString(),
        sections: [tocEntry],
      },
      treeToc: {
        doc_id: docId,
        title: doc.title,
        source_type: doc.sourceType,
        section_count: 1,
        depth: 1,
        created_at: new Date().toISOString(),
        tree: [treeNode],
      },
      sections: [section],
    };
  }

  // Build hierarchical sections from the heading tree
  const counter = { value: 0 };
  const sections = buildSectionsFromTree(
    headings,
    docId,
    doc.fullText,
    null,
    counter
  );

  // Re-index orderIndex for flat ordering
  sections.forEach((s, i) => {
    s.orderIndex = i;
  });

  // Build flat ToC (backward-compatible)
  const flatEntries: ToCEntry[] = sections.map((s) => ({
    section_id: s.id,
    title: s.title,
    summary: s.summary,
    page_range: s.pageRange,
    link: `/v1/documents/${docId}/sections/${s.id}`,
  }));

  // Build tree ToC
  const treeNodes = buildTreeNodes(sections, docId);
  const maxDepth = sections.reduce((max, s) => Math.max(max, s.level), 0);

  return {
    toc: {
      doc_id: docId,
      title: doc.title,
      source_type: doc.sourceType,
      section_count: sections.length,
      created_at: new Date().toISOString(),
      sections: flatEntries,
    },
    treeToc: {
      doc_id: docId,
      title: doc.title,
      source_type: doc.sourceType,
      section_count: sections.length,
      depth: maxDepth,
      created_at: new Date().toISOString(),
      tree: treeNodes,
    },
    sections,
  };
}

/**
 * Recursively walk the NativeHeading tree to produce ToCResultSection[].
 *
 * Branch nodes get content = text from heading start to first child's start (intro text).
 * Leaf nodes get content = full text range.
 */
function buildSectionsFromTree(
  headings: NativeHeading[],
  docId: string,
  fullText: string,
  parentId: string | null,
  counter: { value: number }
): ToCResultSection[] {
  const sections: ToCResultSection[] = [];

  for (const heading of headings) {
    const sectionId = `${docId}-s${counter.value++}`;
    const isLeaf = heading.children.length === 0;

    // Determine content boundaries
    let content: string;
    if (isLeaf) {
      content = fullText.slice(heading.startOffset, heading.endOffset);
    } else {
      // Branch node: text from this heading's start to first child's start
      const firstChildStart = heading.children[0]!.startOffset;
      content = fullText.slice(heading.startOffset, firstChildStart);
    }

    // Build children first so we can collect their IDs
    const childSections = buildSectionsFromTree(
      heading.children,
      docId,
      fullText,
      sectionId,
      counter
    );

    const directChildIds = childSections
      .filter((cs) => cs.parentId === sectionId)
      .map((cs) => cs.id);

    const pageRange =
      heading.pageStart != null
        ? {
            start: heading.pageStart,
            end: heading.pageEnd ?? heading.pageStart,
          }
        : null;

    const section: ToCResultSection = {
      id: sectionId,
      title: heading.title,
      summary: generateExcerptSummary(content),
      content,
      level: heading.level,
      orderIndex: 0, // Will be re-indexed after full tree is built
      pageRange,
      parentId,
      childIds: directChildIds,
      isLeaf,
    };

    sections.push(section, ...childSections);
  }

  return sections;
}

/**
 * Build ToCTreeNode[] from a flat list of ToCResultSection[] (root nodes only).
 */
function buildTreeNodes(
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

  // Root sections have no parent
  const rootSections = sections.filter((s) => s.parentId === null);
  return rootSections.map(buildNode);
}

function generateExcerptSummary(content: string): string {
  const sentences = content
    .replace(/\n+/g, " ")
    .trim()
    .match(/[^.!?]+[.!?]+/g);

  if (!sentences || sentences.length === 0) {
    return content.slice(0, 300).trim();
  }

  // Take first 2-3 sentences, skip transitional ones
  const transitionalPrefixes = [
    "as discussed",
    "as mentioned",
    "as noted",
    "in the previous",
    "building on",
  ];

  const usable = sentences.filter(
    (s) =>
      !transitionalPrefixes.some((p) =>
        s.trim().toLowerCase().startsWith(p)
      )
  );

  const selected = usable.slice(0, 3);
  const summary = selected.join(" ").trim();

  return summary.length > 500 ? summary.slice(0, 500) + "..." : summary;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
