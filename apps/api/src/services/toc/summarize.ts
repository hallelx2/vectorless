import type { LLMProvider } from "../llm/types.js";
import type { ToCResultSection } from "./index.js";

const CONCURRENCY = 5;

/**
 * Recursive multi-level summarization.
 *
 * Walks the section tree bottom-up:
 * - Leaf nodes get precision summaries (names entities, concepts, scope)
 * - Branch nodes get scope summaries synthesized from their children's summaries
 *
 * This creates the "multi-resolution map" that enables effective tree traversal:
 * the LLM agent can grasp high-level themes at branch level without loading raw text.
 */
export async function recursiveSummarize(
  sections: ToCResultSection[],
  llm: LLMProvider
): Promise<void> {
  // Build lookup maps
  const sectionMap = new Map<string, ToCResultSection>();
  for (const s of sections) {
    sectionMap.set(s.id, s);
  }

  // Group sections by level (deepest first for bottom-up processing)
  const byLevel = new Map<number, ToCResultSection[]>();
  for (const s of sections) {
    const group = byLevel.get(s.level) ?? [];
    group.push(s);
    byLevel.set(s.level, group);
  }

  const levels = [...byLevel.keys()].sort((a, b) => b - a); // Deepest first

  for (const level of levels) {
    const sectionsAtLevel = byLevel.get(level) ?? [];

    // Process in batches for concurrency control
    for (let i = 0; i < sectionsAtLevel.length; i += CONCURRENCY) {
      const batch = sectionsAtLevel.slice(i, i + CONCURRENCY);

      const promises = batch.map(async (section) => {
        try {
          if (section.isLeaf) {
            section.summary = await generateLeafSummary(
              llm,
              section.title,
              section.content
            );
          } else {
            // Gather children's summaries (already computed since we go bottom-up)
            const childSummaries = section.childIds
              .map((id) => {
                const child = sectionMap.get(id);
                return child
                  ? `- "${child.title}": ${child.summary}`
                  : null;
              })
              .filter((s): s is string => s !== null);

            section.summary = await generateBranchSummary(
              llm,
              section.title,
              section.content,
              childSummaries
            );
          }
        } catch {
          // Keep existing excerpt summary on LLM failure
        }
      });

      await Promise.allSettled(promises);
    }
  }
}

/**
 * Generate a precision retrieval summary for a leaf section.
 * Names every specific entity, concept, method, finding, or claim.
 */
async function generateLeafSummary(
  llm: LLMProvider,
  title: string,
  content: string
): Promise<string> {
  const truncatedContent =
    content.length > 8000 ? content.slice(0, 8000) + "..." : content;

  const prompt = `You are generating a retrieval summary for a section of a document. This summary will be read by another LLM at query time to decide whether this section is relevant to a user's question.

Write a summary that:
- Names every specific entity, concept, method, finding, or claim in the section
- Uses precise terminology, not vague descriptions
- Mentions the scope boundaries (what this section covers AND what it does not)
- Is 1-3 sentences long
- Anticipates the types of questions this section would answer

Do NOT use phrases like "this section discusses" or "various aspects of". Be specific.

Section title: ${title}
Section content:
${truncatedContent}

Write the retrieval summary (1-3 sentences, no prefix):`;

  const summary = await llm.generateText(prompt, {
    maxTokens: 300,
    temperature: 0.2,
  });

  return summary.trim();
}

/**
 * Generate a scope summary for a branch section.
 * Synthesizes children's summaries to describe what the branch covers
 * at a high level, helping the agent decide whether to expand or skip.
 */
async function generateBranchSummary(
  llm: LLMProvider,
  title: string,
  introContent: string,
  childSummaries: string[]
): Promise<string> {
  const truncatedIntro =
    introContent.length > 4000
      ? introContent.slice(0, 4000) + "..."
      : introContent;

  const prompt = `You are generating a navigational summary for a branch section of a document tree. This summary will be read by an LLM agent that is traversing a hierarchical document structure to find relevant content for a user's query. The agent needs to decide whether to EXPAND this branch (drill into its sub-sections) or SKIP it.

Write a summary that:
- Describes the SCOPE of what this branch covers (topics, not details)
- Names the key entities, concepts, and themes across all sub-sections
- Helps an agent quickly decide whether to expand or skip this branch
- Is 2-4 sentences long

Do NOT describe individual sub-sections. Synthesize them into an overall scope statement.

Branch title: ${title}
Branch intro text: ${truncatedIntro}

Sub-section summaries:
${childSummaries.join("\n")}

Write the branch scope summary (2-4 sentences, no prefix):`;

  const summary = await llm.generateText(prompt, {
    maxTokens: 400,
    temperature: 0.2,
  });

  return summary.trim();
}
