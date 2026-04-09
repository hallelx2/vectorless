import * as cheerio from "cheerio";
import type { ParsedDocument, NativeHeading } from "./types.js";

export async function parseUrl(url: string): Promise<ParsedDocument> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, aside, .sidebar, .menu, .nav").remove();

  const title =
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "Untitled Page";

  // Extract body text
  const fullText = $("body").text().replace(/\s+/g, " ").trim();

  // Extract headings
  const headings: NativeHeading[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const $el = $(el);
    const level = parseInt(el.tagName.slice(1), 10);
    const headingTitle = $el.text().trim();
    const offset = fullText.indexOf(headingTitle);

    if (headingTitle.length > 0) {
      headings.push({
        title: headingTitle,
        level,
        startOffset: offset >= 0 ? offset : 0,
        endOffset: 0,
        children: [],
      });
    }
  });

  // Set endOffsets
  for (let i = 0; i < headings.length - 1; i++) {
    headings[i]!.endOffset = headings[i + 1]!.startOffset;
  }
  if (headings.length > 0) {
    headings[headings.length - 1]!.endOffset = fullText.length;
  }

  // Build tree
  const nativeStructure = buildTree(headings);

  return {
    title,
    sourceType: "url",
    fullText,
    nativeStructure: nativeStructure.length > 0 ? nativeStructure : null,
    metadata: { url, contentType: response.headers.get("content-type") },
  };
}

function buildTree(headings: NativeHeading[]): NativeHeading[] {
  const root: NativeHeading[] = [];
  const stack: NativeHeading[] = [];

  for (const heading of headings) {
    while (stack.length > 0 && stack[stack.length - 1]!.level >= heading.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(heading);
    } else {
      stack[stack.length - 1]!.children.push(heading);
    }
    stack.push(heading);
  }

  return root;
}
