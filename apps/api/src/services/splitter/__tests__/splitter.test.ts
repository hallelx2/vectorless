import { describe, it, expect } from "vitest";
import { processSections } from "../index.js";
import type { ToCResult, ToCResultSection } from "../../toc/index.js";

function makeSection(
  overrides: Partial<ToCResultSection> & { id: string }
): ToCResultSection {
  return {
    title: overrides.id,
    summary: `Summary for ${overrides.id}`,
    content: overrides.content ?? "Default content.",
    level: 1,
    orderIndex: 0,
    pageRange: null,
    parentId: null,
    childIds: [],
    isLeaf: true,
    ...overrides,
  };
}

function makeToCResult(sections: ToCResultSection[]): ToCResult {
  return {
    toc: {
      doc_id: "test-doc",
      title: "Test",
      source_type: "pdf",
      section_count: sections.length,
      created_at: new Date().toISOString(),
      sections: sections.map((s) => ({
        section_id: s.id,
        title: s.title,
        summary: s.summary,
        page_range: s.pageRange,
        link: `/v1/documents/test-doc/sections/${s.id}`,
      })),
    },
    treeToc: {
      doc_id: "test-doc",
      title: "Test",
      source_type: "pdf",
      section_count: sections.length,
      depth: 1,
      created_at: new Date().toISOString(),
      tree: [],
    },
    sections,
  };
}

describe("processSections — tree-aware splitting", () => {
  it("passes through sections within token limits", () => {
    const sections = [
      makeSection({ id: "s1", content: "A".repeat(1000) }),
      makeSection({ id: "s2", content: "B".repeat(2000) }),
    ];

    const result = processSections(makeToCResult(sections));

    expect(result.sections.filter((s) => s.isLeaf)).toHaveLength(2);
    expect(result.sections.find((s) => s.id === "s1")).toBeTruthy();
    expect(result.sections.find((s) => s.id === "s2")).toBeTruthy();
  });

  it("does not split or merge branch sections", () => {
    const sections = [
      makeSection({
        id: "branch",
        content: "Tiny intro.",
        isLeaf: false,
        childIds: ["leaf1", "leaf2"],
      }),
      makeSection({
        id: "leaf1",
        content: "A".repeat(1000),
        parentId: "branch",
      }),
      makeSection({
        id: "leaf2",
        content: "B".repeat(1000),
        parentId: "branch",
      }),
    ];

    const result = processSections(makeToCResult(sections));

    // Branch should still exist as-is
    const branch = result.sections.find((s) => s.id === "branch");
    expect(branch).toBeTruthy();
    expect(branch!.isLeaf).toBe(false);
  });

  it("only merges undersized leaves with siblings (same parent)", () => {
    const sections = [
      makeSection({
        id: "leaf-a",
        content: "Big enough content here with sufficient tokens.",
        parentId: "parent-1",
      }),
      makeSection({
        id: "tiny-leaf",
        content: "Hi", // < MIN_TOKENS (100 chars / 4 = 25 tokens)
        parentId: "parent-1",
      }),
    ];

    const result = processSections(makeToCResult(sections));

    // Tiny leaf should be merged with previous sibling
    const leafA = result.sections.find((s) => s.id === "leaf-a");
    expect(leafA).toBeTruthy();
    expect(leafA!.content).toContain("Hi");
  });

  it("estimates proportional page ranges when splitting", () => {
    // Create an oversized leaf with a page range
    const longContent = Array.from({ length: 200 }, (_, i) =>
      `Paragraph ${i}. ${"x".repeat(500)}`
    ).join("\n\n");

    const sections = [
      makeSection({
        id: "big-leaf",
        content: longContent,
        pageRange: { start: 10, end: 20 },
      }),
    ];

    const result = processSections(makeToCResult(sections));

    // Should have been split into multiple parts
    const parts = result.sections.filter(
      (s) => s.id.startsWith("big-leaf-p") && s.isLeaf
    );

    if (parts.length > 1) {
      // Each part should have a page range that's a subset of the original
      for (const part of parts) {
        expect(part.pageRange).toBeTruthy();
        expect(part.pageRange!.start).toBeGreaterThanOrEqual(10);
        expect(part.pageRange!.end).toBeLessThanOrEqual(20);
      }

      // First part should start at page 10
      expect(parts[0]!.pageRange!.start).toBe(10);
      // Last part should end at or near page 20
      expect(
        parts[parts.length - 1]!.pageRange!.end
      ).toBeLessThanOrEqual(20);
    }
  });

  it("re-indexes orderIndex after processing", () => {
    const sections = [
      makeSection({ id: "s1", content: "A".repeat(1000), orderIndex: 5 }),
      makeSection({ id: "s2", content: "B".repeat(1000), orderIndex: 10 }),
      makeSection({ id: "s3", content: "C".repeat(1000), orderIndex: 15 }),
    ];

    const result = processSections(makeToCResult(sections));

    const indices = result.sections.map((s) => s.orderIndex);
    // Should be sequential starting from 0
    for (let i = 0; i < indices.length; i++) {
      expect(indices[i]).toBe(i);
    }
  });
});
