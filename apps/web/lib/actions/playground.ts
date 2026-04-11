"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { playgroundSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";

const VECTORLESS_API_URL =
  process.env.VECTORLESS_API_URL || "https://api.vectorless.store";
const VECTORLESS_API_KEY = process.env.VECTORLESS_INTERNAL_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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

    // ── Step 1: Get the ToC manifest ──
    const tocRes = await fetch(
      `${VECTORLESS_API_URL}/v1/documents/${docId}/toc`,
      { headers: apiHeaders }
    );

    if (!tocRes.ok) {
      return { error: `Failed to get ToC: ${tocRes.status}` };
    }

    const toc = await tocRes.json();
    const tocTime = Date.now() - startTime;

    // ── Step 2: LLM reasons over the ToC to select sections ──
    const selectStart = Date.now();
    let sectionIds: string[] = [];
    let reasoning = "";

    if (GEMINI_API_KEY) {
      // Real LLM reasoning — this is the core of Vectorless
      const gemini = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      const tocSummary = toc.sections
        .map(
          (s: any) =>
            `- section_id: "${s.section_id}"\n  title: "${s.title}"\n  summary: "${(s.summary || "").slice(0, 300)}"`
        )
        .join("\n\n");

      const prompt = `You are a document retrieval assistant. A user has a question and you have a document's table of contents with section summaries. Your job is to select which sections are most likely to contain the answer.

Document: "${toc.title}"

Table of Contents:
${tocSummary}

User's question: "${data.query}"

Instructions:
1. Read each section's title and summary carefully
2. Select the sections that are most relevant to answering the question
3. Explain your reasoning — why each selected section is relevant

Respond with valid JSON only:
{
  "selected_section_ids": ["section_id_1", "section_id_2"],
  "reasoning": "Your explanation of why these sections were selected and how they relate to the question"
}`;

      try {
        const res = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            maxOutputTokens: 1024,
            temperature: 0.2,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        const text = res.text ?? "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          sectionIds = parsed.selected_section_ids || [];
          reasoning = parsed.reasoning || "";
        }
      } catch (llmErr) {
        // LLM failed — fall back to keyword matching
        console.error("LLM reasoning failed:", llmErr);
      }
    }

    // Fallback: keyword matching if LLM didn't return results
    if (sectionIds.length === 0) {
      const queryLower = data.query.toLowerCase();
      const queryWords = queryLower
        .split(/\s+/)
        .filter((w: string) => w.length > 2);

      const matched = toc.sections.filter((s: any) => {
        const text = `${s.title} ${s.summary || ""}`.toLowerCase();
        return queryWords.some((word: string) => text.includes(word));
      });

      sectionIds =
        matched.length > 0
          ? matched.map((s: any) => s.section_id)
          : toc.sections.slice(0, 3).map((s: any) => s.section_id);

      reasoning = `Fallback: keyword matching selected ${sectionIds.length} sections. Configure a Gemini API key for LLM-powered reasoning.`;
    }

    const selectTime = Date.now() - selectStart;

    // ── Step 3: Fetch the selected sections ──
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

    // Map sections to the format the playground page expects
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
        timing: {
          toc_retrieval_ms: tocTime,
          section_selection_ms: selectTime,
          content_fetch_ms: fetchTime,
          total_ms: Date.now() - startTime,
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
