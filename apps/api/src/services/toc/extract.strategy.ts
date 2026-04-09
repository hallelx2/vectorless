import type { NativeHeading, ParsedDocument } from "../parser/types.js";
import type { ToCEntry, ToCManifest } from "@vectorless/shared";
import { nanoid } from "nanoid";

interface GeneratedSection {
  id: string;
  title: string;
  summary: string;
  content: string;
  level: number;
  orderIndex: number;
  pageRange: { start: number; end: number } | null;
}

export function extractToC(
  doc: ParsedDocument,
  docId: string
): { toc: ToCManifest; sections: GeneratedSection[] } {
  const headings = doc.nativeStructure;

  if (!headings || headings.length === 0) {
    // No structure found — treat entire document as one section
    const sectionId = `${docId}-s0`;
    const summary = generateExcerptSummary(doc.fullText);

    return {
      toc: {
        doc_id: docId,
        title: doc.title,
        source_type: doc.sourceType,
        section_count: 1,
        created_at: new Date().toISOString(),
        sections: [
          {
            section_id: sectionId,
            title: doc.title,
            summary,
            page_range: null,
            link: `/v1/documents/${docId}/sections/${sectionId}`,
          },
        ],
      },
      sections: [
        {
          id: sectionId,
          title: doc.title,
          summary,
          content: doc.fullText,
          level: 1,
          orderIndex: 0,
          pageRange: null,
        },
      ],
    };
  }

  const flatHeadings = flattenHeadings(headings);
  const sections: GeneratedSection[] = [];
  const tocEntries: ToCEntry[] = [];

  flatHeadings.forEach((heading, index) => {
    const sectionId = `${docId}-s${index}`;
    const content = doc.fullText.slice(heading.startOffset, heading.endOffset);
    const summary = generateExcerptSummary(content);

    sections.push({
      id: sectionId,
      title: heading.title,
      summary,
      content,
      level: heading.level,
      orderIndex: index,
      pageRange: heading.pageStart != null
        ? { start: heading.pageStart, end: heading.pageEnd ?? heading.pageStart }
        : null,
    });

    tocEntries.push({
      section_id: sectionId,
      title: heading.title,
      summary,
      page_range: heading.pageStart != null
        ? { start: heading.pageStart, end: heading.pageEnd ?? heading.pageStart }
        : null,
      link: `/v1/documents/${docId}/sections/${sectionId}`,
    });
  });

  return {
    toc: {
      doc_id: docId,
      title: doc.title,
      source_type: doc.sourceType,
      section_count: sections.length,
      created_at: new Date().toISOString(),
      sections: tocEntries,
    },
    sections,
  };
}

function flattenHeadings(headings: NativeHeading[]): NativeHeading[] {
  const flat: NativeHeading[] = [];
  function walk(nodes: NativeHeading[]) {
    for (const node of nodes) {
      flat.push(node);
      if (node.children.length > 0) {
        walk(node.children);
      }
    }
  }
  walk(headings);
  return flat;
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
