"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { playgroundSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const VECTORLESS_API_URL =
  process.env.VECTORLESS_API_URL || "https://api.vectorless.store";
const VECTORLESS_API_KEY = process.env.VECTORLESS_INTERNAL_API_KEY || "";

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  for (const byte of array) {
    result += chars[byte % chars.length];
  }
  return result;
}

export async function runPlaygroundQuery(data: {
  query: string;
  docIds: string[];
  strategy: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  if (!data.query?.trim() || data.docIds.length === 0) {
    return { error: "Query and document are required" };
  }

  const docId = data.docIds[0]!;
  const apiHeaders = {
    Authorization: `Bearer ${VECTORLESS_API_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    const startTime = Date.now();

    // ── Step 1: Use the agentic query endpoint ──
    // This delegates to the tree-agent which navigates the document's
    // hierarchical section tree using Vercel AI SDK tools.
    const queryRes = await fetch(
      `${VECTORLESS_API_URL}/v1/documents/${docId}/query`,
      {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          query: data.query,
          max_steps: 10,
          token_budget: 50000,
        }),
      }
    );

    if (!queryRes.ok) {
      // Fall back to legacy ToC-based retrieval if query endpoint isn't available
      return runLegacyQuery(data, docId, apiHeaders, startTime);
    }

    const result = await queryRes.json();
    const totalTime = Date.now() - startTime;

    // Map to playground format
    const selectedSections = (result.sections || []).map((s: any) => ({
      section_id: s.section_id || s.id,
      title: s.title,
      relevance_score: 1.0,
      page_range: s.page_range
        ? `${s.page_range.start}-${s.page_range.end}`
        : "",
      summary: s.summary || "",
      content_preview: (s.content || "").slice(0, 300),
    }));

    // Also fetch the ToC for display
    const tocRes = await fetch(
      `${VECTORLESS_API_URL}/v1/documents/${docId}/toc`,
      { headers: apiHeaders }
    );
    const toc = tocRes.ok ? await tocRes.json() : null;

    return {
      success: true,
      data: {
        toc,
        selected_section_ids: (result.sections || []).map(
          (s: any) => s.section_id
        ),
        selected_sections: selectedSections,
        reasoning: result.reasoning_summary || "",
        traversal_trace: result.traversal_trace || [],
        timing: {
          total_ms: totalTime,
          total_steps: result.total_steps || 0,
          tokens_retrieved: result.tokens_retrieved || 0,
        },
      },
    };
  } catch (err) {
    return {
      error:
        err instanceof Error ? err.message : "Failed to run playground query",
    };
  }
}

/**
 * Legacy fallback: fetch flat ToC and do keyword-based section selection.
 * Used when the agentic query endpoint is not available.
 */
async function runLegacyQuery(
  data: { query: string; docIds: string[]; strategy: string },
  docId: string,
  apiHeaders: Record<string, string>,
  startTime: number
) {
  // Fetch flat ToC
  const tocRes = await fetch(
    `${VECTORLESS_API_URL}/v1/documents/${docId}/toc`,
    { headers: apiHeaders }
  );

  if (!tocRes.ok) {
    return { error: `Failed to get ToC: ${tocRes.status}` };
  }

  const toc = await tocRes.json();
  const tocTime = Date.now() - startTime;

  // Keyword matching fallback
  const queryLower = data.query.toLowerCase();
  const queryWords = queryLower
    .split(/\s+/)
    .filter((w: string) => w.length > 2);

  const matched = toc.sections.filter((s: any) => {
    const text = `${s.title} ${s.summary || ""}`.toLowerCase();
    return queryWords.some((word: string) => text.includes(word));
  });

  const sectionIds =
    matched.length > 0
      ? matched.map((s: any) => s.section_id)
      : toc.sections.slice(0, 3).map((s: any) => s.section_id);

  const reasoning = `Legacy fallback: keyword matching selected ${sectionIds.length} sections.`;

  // Fetch selected sections
  const fetchStart = Date.now();
  const sectionsRes = await fetch(
    `${VECTORLESS_API_URL}/v1/documents/${docId}/sections/batch`,
    {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ section_ids: sectionIds }),
    }
  );

  const sectionsData = sectionsRes.ok
    ? await sectionsRes.json()
    : { sections: [] };
  const fetchTime = Date.now() - fetchStart;

  const fetchedSections = sectionsData.sections || [];
  const selectedSections = fetchedSections.map((s: any) => ({
    section_id: s.section_id || s.id,
    title: s.title,
    relevance_score: 1.0,
    page_range: s.page_range
      ? `${s.page_range.start}-${s.page_range.end}`
      : "",
    summary: s.summary || "",
    content_preview: (s.content || "").slice(0, 300),
  }));

  return {
    success: true,
    data: {
      toc,
      selected_section_ids: sectionIds,
      selected_sections: selectedSections,
      reasoning,
      traversal_trace: [],
      timing: {
        toc_retrieval_ms: tocTime,
        content_fetch_ms: fetchTime,
        total_ms: Date.now() - startTime,
      },
    },
  };
}

export async function savePlaygroundSession(data: {
  name?: string;
  query: string;
  docIds: string[];
  tocStrategy: string;
  selectedSections?: unknown;
  reasoning?: string;
  timing?: unknown;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const id = generateId();

    await db.insert(playgroundSessions).values({
      id,
      userId: session.user.id,
      name: data.name || `Query: ${data.query.slice(0, 50)}`,
      query: data.query,
      docIds: data.docIds,
      tocStrategy: data.tocStrategy,
      selectedSections: data.selectedSections ?? null,
      reasoning: data.reasoning ?? null,
      timing: data.timing ?? null,
    });

    return { success: true, sessionId: id };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to save playground session",
    };
  }
}

export async function listPlaygroundSessions() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized", sessions: [] };
  }

  try {
    const sessions = await db
      .select({
        id: playgroundSessions.id,
        name: playgroundSessions.name,
        query: playgroundSessions.query,
        docIds: playgroundSessions.docIds,
        tocStrategy: playgroundSessions.tocStrategy,
        selectedSections: playgroundSessions.selectedSections,
        reasoning: playgroundSessions.reasoning,
        timing: playgroundSessions.timing,
        createdAt: playgroundSessions.createdAt,
      })
      .from(playgroundSessions)
      .where(eq(playgroundSessions.userId, session.user.id))
      .orderBy(desc(playgroundSessions.createdAt))
      .limit(50);

    return { success: true, sessions };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Failed to list playground sessions",
      sessions: [],
    };
  }
}
