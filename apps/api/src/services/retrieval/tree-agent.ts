import { generateText, tool } from "ai";
import { z } from "zod";
import type { TraversalStep, TreeQueryResult, Section } from "@vectorless/shared";
import { getAISDKModelForProject } from "./model-selector.js";
import {
  getRootSections,
  getChildSections,
  getSiblingSections,
  getSection,
  getAllSections,
} from "../section.service.js";
import { getDocument } from "../document.service.js";

export interface TreeAgentOptions {
  docId: string;
  projectId: string;
  query: string;
  maxSteps?: number;
  tokenBudget?: number;
}

/**
 * Agentic tree traversal engine.
 *
 * Uses the Vercel AI SDK's `generateText` with tools to navigate a document's
 * hierarchical section tree. The LLM agent calls tools iteratively:
 *
 *   getRoots → expandBranch → expandBranch → getContent → finish
 *
 * This is the PageIndex-style MCTS approach: the agent reasons about which
 * branches to explore based on summaries, drills down through levels, and
 * retrieves content from relevant leaf nodes.
 *
 * If the document has no tree structure (legacy flat documents), falls back
 * to single-shot flat selection.
 */
export async function runTreeAgent(
  options: TreeAgentOptions
): Promise<TreeQueryResult> {
  const {
    docId,
    projectId,
    query,
    maxSteps = 10,
    tokenBudget = 50000,
  } = options;

  // Check if document has tree structure
  const doc = await getDocument(docId, projectId);
  if (!doc) {
    throw new Error(`Document ${docId} not found`);
  }

  // If no tree ToC, fall back to flat selection
  if (!doc.treeToc) {
    return runFlatFallback(docId, projectId, query);
  }

  // Mutable state closed over by tools
  let tokensRetrieved = 0;
  const retrievedSections: Section[] = [];
  const traversalTrace: TraversalStep[] = [];
  let stepCounter = 0;

  const model = await getAISDKModelForProject(projectId);

  const systemPrompt = buildSystemPrompt(
    query,
    doc.title,
    tokenBudget
  );

  // Define the 6 tools for tree navigation
  const tools = {
    getRoots: tool({
      description:
        "Get the root-level sections of the document tree. Call this first to see the top-level structure. Returns section summaries (not content).",
      parameters: z.object({}),
      execute: async () => {
        const roots = await getRootSections(docId);
        const result = roots.map((s) => ({
          section_id: s.id,
          title: s.title,
          summary: s.summary ?? "",
          level: s.level,
          child_count: 0, // Will be computed below
          is_leaf: s.isLeaf === "true",
          token_count: s.tokenCount,
        }));

        // Compute child counts
        for (const r of result) {
          if (!r.is_leaf) {
            const children = await getChildSections(docId, r.section_id);
            r.child_count = children.length;
          }
        }

        return result;
      },
    }),

    expandBranch: tool({
      description:
        "Expand a branch node to see its children. Use this to drill deeper into a promising section. Only works on non-leaf sections (is_leaf=false).",
      parameters: z.object({
        section_id: z
          .string()
          .describe("The section ID of the branch to expand"),
      }),
      execute: async ({ section_id }) => {
        const children = await getChildSections(docId, section_id);

        const result = [];
        for (const c of children) {
          let childCount = 0;
          if (c.isLeaf !== "true") {
            const grandchildren = await getChildSections(docId, c.id);
            childCount = grandchildren.length;
          }
          result.push({
            section_id: c.id,
            title: c.title,
            summary: c.summary ?? "",
            level: c.level,
            child_count: childCount,
            is_leaf: c.isLeaf === "true",
            token_count: c.tokenCount,
          });
        }

        return { parent_id: section_id, children: result };
      },
    }),

    getContent: tool({
      description:
        "Retrieve the full content of a leaf section. Only call this on sections where is_leaf=true that you believe contain relevant content for the query. Each call uses tokens from your budget.",
      parameters: z.object({
        section_id: z
          .string()
          .describe("The leaf section ID to retrieve content for"),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe(
            "Your confidence (0-1) that this section answers the query"
          ),
      }),
      execute: async ({ section_id, confidence }) => {
        const section = await getSection(docId, section_id, projectId);
        if (!section) {
          return { error: `Section ${section_id} not found` };
        }

        // Check token budget
        if (tokensRetrieved + section.tokenCount > tokenBudget) {
          return {
            error:
              "Token budget would be exceeded. Call finish() to complete retrieval.",
            tokens_remaining: tokenBudget - tokensRetrieved,
          };
        }

        tokensRetrieved += section.tokenCount;
        retrievedSections.push({
          section_id: section.id,
          doc_id: section.docId,
          title: section.title,
          summary: section.summary,
          content: section.content,
          page_range: section.pageRange as { start: number; end: number } | null,
          order_index: section.orderIndex,
          token_count: section.tokenCount,
          level: section.level,
          parent_section_id: section.parentSectionId,
          child_section_ids: [],
          is_leaf: section.isLeaf === "true",
        });

        return {
          section_id: section.id,
          title: section.title,
          content: section.content,
          token_count: section.tokenCount,
          tokens_remaining: tokenBudget - tokensRetrieved,
        };
      },
    }),

    getSiblings: tool({
      description:
        "Get sibling sections (same parent) for context around a relevant section. Useful for understanding what's adjacent.",
      parameters: z.object({
        section_id: z
          .string()
          .describe("Get siblings of this section"),
      }),
      execute: async ({ section_id }) => {
        const siblings = await getSiblingSections(docId, section_id);
        return siblings.map((s) => ({
          section_id: s.id,
          title: s.title,
          summary: s.summary ?? "",
          is_leaf: s.isLeaf === "true",
          is_current: s.id === section_id,
        }));
      },
    }),

    searchTree: tool({
      description:
        "Search all section titles and summaries for a keyword or phrase. Use when you need to find a specific topic without traversing manually.",
      parameters: z.object({
        query: z.string().describe("Search keyword or phrase"),
      }),
      execute: async ({ query: searchQuery }) => {
        const all = await getAllSections(docId);
        const queryLower = searchQuery.toLowerCase();

        const matches = all.filter((s) => {
          const text = `${s.title} ${s.summary ?? ""}`.toLowerCase();
          return text.includes(queryLower);
        });

        return matches.slice(0, 10).map((s) => ({
          section_id: s.id,
          title: s.title,
          summary: s.summary ?? "",
          level: s.level,
          is_leaf: s.isLeaf === "true",
        }));
      },
    }),

    finish: tool({
      description:
        "Call this when you have found all relevant sections or exhausted your search. Provide a final reasoning summary of your navigation process.",
      parameters: z.object({
        reasoning_summary: z
          .string()
          .describe(
            "Summary of your search process — which branches you explored, which you skipped, and why"
          ),
        confidence: z
          .number()
          .min(0)
          .max(1)
          .describe(
            "Overall confidence (0-1) that you found all relevant content"
          ),
      }),
      execute: async ({ reasoning_summary, confidence }) => {
        return {
          done: true,
          sections_retrieved: retrievedSections.length,
          tokens_used: tokensRetrieved,
          reasoning_summary,
          confidence,
        };
      },
    }),
  };

  // Run the agent
  const result = await generateText({
    model,
    system: systemPrompt,
    prompt: `Find sections relevant to: "${query}"`,
    tools,
    maxSteps,
    onStepFinish: ({ toolCalls, toolResults }) => {
      if (toolCalls && toolCalls.length > 0) {
        for (let i = 0; i < toolCalls.length; i++) {
          const call = toolCalls[i]!;
          const toolResult = toolResults?.[i];
          stepCounter++;
          traversalTrace.push({
            step: stepCounter,
            tool_called: call.toolName,
            arguments: call.args as Record<string, unknown>,
            result_summary: summarizeToolResult(
              call.toolName,
              toolResult
            ),
            reasoning: "",
            tokens_used: tokensRetrieved,
          });
        }
      }
    },
  });

  // Extract reasoning from the final text if present
  const reasoningSummary =
    result.text ||
    traversalTrace
      .filter((t) => t.tool_called === "finish")
      .map((t) => t.result_summary)
      .join(" ") ||
    `Traversed ${stepCounter} steps, retrieved ${retrievedSections.length} sections.`;

  return {
    sections: retrievedSections,
    traversal_trace: traversalTrace,
    total_steps: stepCounter,
    tokens_retrieved: tokensRetrieved,
    reasoning_summary: reasoningSummary,
  };
}

/**
 * Fallback for legacy flat documents without tree structure.
 * Uses simple keyword matching to select sections.
 */
async function runFlatFallback(
  docId: string,
  projectId: string,
  query: string
): Promise<TreeQueryResult> {
  const allSections = await getAllSections(docId);
  const queryLower = query.toLowerCase();
  const queryWords = queryLower
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const matched = allSections.filter((s) => {
    const text = `${s.title} ${s.summary ?? ""}`.toLowerCase();
    return queryWords.some((word) => text.includes(word));
  });

  const selected =
    matched.length > 0 ? matched : allSections.slice(0, 3);

  return {
    sections: selected.map((s) => ({
      section_id: s.id,
      doc_id: s.docId,
      title: s.title,
      summary: s.summary,
      content: s.content,
      page_range: s.pageRange as { start: number; end: number } | null,
      order_index: s.orderIndex,
      token_count: s.tokenCount,
      level: s.level,
      parent_section_id: s.parentSectionId,
      child_section_ids: [],
      is_leaf: s.isLeaf === "true",
    })),
    traversal_trace: [
      {
        step: 1,
        tool_called: "flat_fallback",
        arguments: { query },
        result_summary: `Legacy flat document — keyword matched ${selected.length} sections`,
        reasoning: "Document has no tree structure; used flat keyword fallback",
        tokens_used: 0,
      },
    ],
    total_steps: 1,
    tokens_retrieved: selected.reduce((sum, s) => sum + s.tokenCount, 0),
    reasoning_summary: `Flat fallback: keyword matched ${selected.length} sections (document lacks tree structure).`,
  };
}

function buildSystemPrompt(
  query: string,
  documentTitle: string,
  tokenBudget: number
): string {
  return `You are a document retrieval agent. Your task is to find the sections of a document that are most relevant to a user's query by navigating a hierarchical table of contents.

The document "${documentTitle}" is organized as a tree:
- ROOT level: High-level sections/chapters
- Each section may have children (sub-sections) with more specific content
- LEAF nodes (is_leaf=true) contain the actual document content
- BRANCH nodes (is_leaf=false) contain summaries of their children

Navigation strategy:
1. Start by calling getRoots() to see the top-level structure
2. Read each section's summary to decide which branches are promising
3. Call expandBranch() on promising sections to see their children
4. Continue drilling down until you reach leaf nodes
5. Call getContent() on relevant leaf nodes to retrieve their content
6. Use getSiblings() to see what's adjacent to a relevant section
7. Use searchTree() if you need to find something specific by keyword
8. Call finish() when done — you MUST call finish() to complete

Rules:
- Be SELECTIVE. Do not retrieve content that is unlikely to answer the query.
- You have a token budget of ${tokenBudget} tokens. Each getContent() call uses tokens. Check tokens_remaining in the response.
- Provide a confidence score (0-1) when retrieving content.
- If a branch summary clearly does not relate to the query, skip it entirely.
- You may explore multiple branches if the query touches multiple topics.
- You can call multiple tools in a single step to explore branches in parallel.
- Always call finish() with a reasoning summary of your navigation path.

User query: "${query}"`;
}

function summarizeToolResult(
  toolName: string,
  result: unknown
): string {
  if (!result) return "No result";

  try {
    if (toolName === "getRoots") {
      const arr = result as unknown[];
      return `Found ${arr.length} root sections`;
    }
    if (toolName === "expandBranch") {
      const r = result as { children: unknown[] };
      return `Expanded to ${r.children?.length ?? 0} children`;
    }
    if (toolName === "getContent") {
      const r = result as { title?: string; error?: string };
      return r.error ?? `Retrieved: "${r.title}"`;
    }
    if (toolName === "getSiblings") {
      const arr = result as unknown[];
      return `Found ${arr.length} siblings`;
    }
    if (toolName === "searchTree") {
      const arr = result as unknown[];
      return `Found ${arr.length} matches`;
    }
    if (toolName === "finish") {
      const r = result as { reasoning_summary?: string };
      return r.reasoning_summary ?? "Finished";
    }
  } catch {
    // Fall through
  }

  return "Completed";
}
