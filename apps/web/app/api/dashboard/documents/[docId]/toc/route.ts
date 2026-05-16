import { NextRequest, NextResponse } from "next/server";
import { forwardToCP } from "@/lib/cp-proxy";

// The engine exposes the structural view at /v1/documents/{id}/tree
// (built for LLM reasoning). The dashboard wants the user-friendly
// "Table of Contents" shape, so we fetch /tree and reshape.
//
// When buildTree wraps multiple top-level sections in a synthetic
// root we want to hide that root from the UI — it has id="" and a
// repeated title, and showing it confuses users into thinking there's
// an extra section at the top.
interface EngineSectionView {
  id?: string;
  parent_id?: string;
  depth?: number;
  title?: string;
  summary?: string;
  children?: string[];
  tokens?: number;
}

interface EngineTreeView {
  document_id?: string;
  title?: string;
  sections?: EngineSectionView[];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const { ok, status, data } = await forwardToCP(
    `/v1/documents/${docId}/tree`,
  );
  if (!ok) {
    return NextResponse.json(data ?? { error: "Upstream error" }, { status });
  }

  const tree = (data ?? {}) as EngineTreeView;
  const engineSections = tree.sections ?? [];

  const sections = engineSections
    .filter((s) => s.id && s.id !== "")
    .map((s, i) => ({
      section_id: s.id ?? "",
      order: i,
      depth: s.depth ?? 0,
      title: s.title ?? "",
      summary: s.summary ?? "",
      page_range: "",
      token_count: s.tokens ?? 0,
    }));

  return NextResponse.json({
    doc_id: tree.document_id ?? docId,
    title: tree.title ?? "",
    toc_strategy: "",
    section_count: sections.length,
    sections,
  });
}
