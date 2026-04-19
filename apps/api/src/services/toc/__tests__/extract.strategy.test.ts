import { describe, it, expect } from "vitest";
import { extractToC } from "../extract.strategy.js";
import type { ParsedDocument } from "../../parser/types.js";

function makeDoc(overrides: Partial<ParsedDocument> = {}): ParsedDocument {
  return {
    title: "Test Document",
    sourceType: "pdf",
    fullText:
      "Chapter 1 Introduction\nThis is the intro to chapter 1.\n\n" +
      "Section 1.1 Background\nBackground content goes here. It covers historical context.\n\n" +
      "Section 1.2 Motivation\nMotivation content goes here. Why we do this.\n\n" +
      "Chapter 2 Methods\nThis is the methods chapter overview.\n\n" +
      "Section 2.1 Design\nDesign details here.\n\n" +
      "Section 2.2 Implementation\nImplementation specifics.\n\n" +
      "Chapter 3 Results\nResults are shown below.\n",
    nativeStructure: null,
    metadata: {},
    ...overrides,
  };
}

describe("extractToC — tree preservation", () => {
  it("handles a document with no structure as a single leaf", () => {
    const doc = makeDoc({ nativeStructure: null });
    const result = extractToC(doc, "doc1");

    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]!.isLeaf).toBe(true);
    expect(result.sections[0]!.parentId).toBe(null);
    expect(result.sections[0]!.childIds).toEqual([]);
    expect(result.toc.sections).toHaveLength(1);
    expect(result.treeToc.tree).toHaveLength(1);
    expect(result.treeToc.tree[0]!.is_leaf).toBe(true);
    expect(result.treeToc.depth).toBe(1);
  });

  it("handles a flat list of headings (no children)", () => {
    const fullText = "Chapter 1\nContent of ch1.\nChapter 2\nContent of ch2.\n";
    const doc = makeDoc({
      fullText,
      nativeStructure: [
        {
          title: "Chapter 1",
          level: 1,
          startOffset: 0,
          endOffset: 26,
          children: [],
        },
        {
          title: "Chapter 2",
          level: 1,
          startOffset: 26,
          endOffset: fullText.length,
          children: [],
        },
      ],
    });

    const result = extractToC(doc, "doc2");

    expect(result.sections).toHaveLength(2);
    // Both are leaf sections at root level
    expect(result.sections[0]!.isLeaf).toBe(true);
    expect(result.sections[1]!.isLeaf).toBe(true);
    expect(result.sections[0]!.parentId).toBe(null);
    expect(result.sections[1]!.parentId).toBe(null);
    expect(result.sections[0]!.childIds).toEqual([]);
    expect(result.sections[1]!.childIds).toEqual([]);

    // Tree has 2 root nodes, both leaves
    expect(result.treeToc.tree).toHaveLength(2);
    expect(result.treeToc.tree[0]!.is_leaf).toBe(true);
    expect(result.treeToc.tree[1]!.is_leaf).toBe(true);
    expect(result.treeToc.section_count).toBe(2);
  });

  it("preserves a 2-level heading hierarchy", () => {
    const fullText =
      "Chapter 1 Introduction. " +
      "Section 1.1 Background info. " +
      "Section 1.2 Motivation details. " +
      "Chapter 2 Conclusion.";

    const ch1Start = 0;
    const s11Start = 24;
    const s12Start = 53;
    const ch2Start = 85;

    const doc = makeDoc({
      fullText,
      nativeStructure: [
        {
          title: "Chapter 1",
          level: 1,
          startOffset: ch1Start,
          endOffset: ch2Start,
          children: [
            {
              title: "Section 1.1",
              level: 2,
              startOffset: s11Start,
              endOffset: s12Start,
              children: [],
            },
            {
              title: "Section 1.2",
              level: 2,
              startOffset: s12Start,
              endOffset: ch2Start,
              children: [],
            },
          ],
        },
        {
          title: "Chapter 2",
          level: 1,
          startOffset: ch2Start,
          endOffset: fullText.length,
          children: [],
        },
      ],
    });

    const result = extractToC(doc, "doc3");

    // Should have 4 sections: Ch1 (branch), S1.1 (leaf), S1.2 (leaf), Ch2 (leaf)
    expect(result.sections).toHaveLength(4);

    const ch1 = result.sections.find((s) => s.title === "Chapter 1")!;
    const s11 = result.sections.find((s) => s.title === "Section 1.1")!;
    const s12 = result.sections.find((s) => s.title === "Section 1.2")!;
    const ch2 = result.sections.find((s) => s.title === "Chapter 2")!;

    // Chapter 1 is a branch (has children)
    expect(ch1.isLeaf).toBe(false);
    expect(ch1.parentId).toBe(null);
    expect(ch1.childIds).toHaveLength(2);
    expect(ch1.childIds).toContain(s11.id);
    expect(ch1.childIds).toContain(s12.id);
    expect(ch1.level).toBe(1);

    // Branch content: text from ch1 start to first child start (intro only)
    expect(ch1.content).toBe(fullText.slice(ch1Start, s11Start));

    // Section 1.1 is a leaf under Chapter 1
    expect(s11.isLeaf).toBe(true);
    expect(s11.parentId).toBe(ch1.id);
    expect(s11.childIds).toEqual([]);
    expect(s11.level).toBe(2);
    expect(s11.content).toBe(fullText.slice(s11Start, s12Start));

    // Section 1.2 is a leaf under Chapter 1
    expect(s12.isLeaf).toBe(true);
    expect(s12.parentId).toBe(ch1.id);
    expect(s12.level).toBe(2);

    // Chapter 2 is a leaf at root
    expect(ch2.isLeaf).toBe(true);
    expect(ch2.parentId).toBe(null);
    expect(ch2.level).toBe(1);

    // Tree structure should reflect hierarchy
    expect(result.treeToc.tree).toHaveLength(2); // 2 root nodes
    expect(result.treeToc.tree[0]!.title).toBe("Chapter 1");
    expect(result.treeToc.tree[0]!.is_leaf).toBe(false);
    expect(result.treeToc.tree[0]!.children).toHaveLength(2);
    expect(result.treeToc.tree[0]!.children[0]!.title).toBe("Section 1.1");
    expect(result.treeToc.tree[0]!.children[0]!.is_leaf).toBe(true);
    expect(result.treeToc.tree[0]!.children[1]!.title).toBe("Section 1.2");
    expect(result.treeToc.tree[1]!.title).toBe("Chapter 2");
    expect(result.treeToc.tree[1]!.is_leaf).toBe(true);
    expect(result.treeToc.tree[1]!.children).toHaveLength(0);

    expect(result.treeToc.depth).toBe(2);
    expect(result.treeToc.section_count).toBe(4);

    // Flat ToC should still have all sections
    expect(result.toc.sections).toHaveLength(4);
    expect(result.toc.section_count).toBe(4);
  });

  it("preserves a 3-level deep hierarchy", () => {
    const fullText = "A B C D E";
    const doc = makeDoc({
      fullText,
      nativeStructure: [
        {
          title: "Level 1",
          level: 1,
          startOffset: 0,
          endOffset: fullText.length,
          children: [
            {
              title: "Level 2",
              level: 2,
              startOffset: 2,
              endOffset: fullText.length,
              children: [
                {
                  title: "Level 3",
                  level: 3,
                  startOffset: 4,
                  endOffset: fullText.length,
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = extractToC(doc, "doc4");

    expect(result.sections).toHaveLength(3);
    expect(result.treeToc.depth).toBe(3);

    const l1 = result.sections.find((s) => s.title === "Level 1")!;
    const l2 = result.sections.find((s) => s.title === "Level 2")!;
    const l3 = result.sections.find((s) => s.title === "Level 3")!;

    expect(l1.isLeaf).toBe(false);
    expect(l1.parentId).toBe(null);
    expect(l1.childIds).toContain(l2.id);

    expect(l2.isLeaf).toBe(false);
    expect(l2.parentId).toBe(l1.id);
    expect(l2.childIds).toContain(l3.id);

    expect(l3.isLeaf).toBe(true);
    expect(l3.parentId).toBe(l2.id);
    expect(l3.childIds).toEqual([]);

    // Tree should be nested 3 deep
    expect(result.treeToc.tree).toHaveLength(1);
    expect(result.treeToc.tree[0]!.children).toHaveLength(1);
    expect(result.treeToc.tree[0]!.children[0]!.children).toHaveLength(1);
    expect(
      result.treeToc.tree[0]!.children[0]!.children[0]!.is_leaf
    ).toBe(true);
  });

  it("assigns page ranges from heading metadata", () => {
    const fullText = "Page 1 content. Page 2 content.";
    const doc = makeDoc({
      fullText,
      nativeStructure: [
        {
          title: "Section A",
          level: 1,
          startOffset: 0,
          endOffset: 16,
          pageStart: 1,
          pageEnd: 1,
          children: [],
        },
        {
          title: "Section B",
          level: 1,
          startOffset: 16,
          endOffset: fullText.length,
          pageStart: 2,
          pageEnd: 3,
          children: [],
        },
      ],
    });

    const result = extractToC(doc, "doc5");

    expect(result.sections[0]!.pageRange).toEqual({ start: 1, end: 1 });
    expect(result.sections[1]!.pageRange).toEqual({ start: 2, end: 3 });
    expect(result.treeToc.tree[0]!.page_range).toEqual({ start: 1, end: 1 });
    expect(result.treeToc.tree[1]!.page_range).toEqual({ start: 2, end: 3 });
  });

  it("generates section IDs with consistent counter", () => {
    const fullText = "A B C";
    const doc = makeDoc({
      fullText,
      nativeStructure: [
        {
          title: "Root",
          level: 1,
          startOffset: 0,
          endOffset: fullText.length,
          children: [
            {
              title: "Child 1",
              level: 2,
              startOffset: 2,
              endOffset: 4,
              children: [],
            },
            {
              title: "Child 2",
              level: 2,
              startOffset: 4,
              endOffset: fullText.length,
              children: [],
            },
          ],
        },
      ],
    });

    const result = extractToC(doc, "test-doc");

    // IDs should be sequential
    expect(result.sections[0]!.id).toBe("test-doc-s0"); // Root
    expect(result.sections[1]!.id).toBe("test-doc-s1"); // Child 1
    expect(result.sections[2]!.id).toBe("test-doc-s2"); // Child 2
  });
});
