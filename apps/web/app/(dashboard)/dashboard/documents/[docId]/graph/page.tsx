"use client";

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  Hash,
  Layers,
  Loader2,
  X,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MarkdownSummary } from "@/components/ui/markdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TocSection {
  section_id: string;
  order: number;
  depth?: number;
  parent_id?: string;
  title: string;
  summary: string;
  page_range: string;
  token_count?: number;
}

interface TocData {
  doc_id: string;
  title: string;
  toc_strategy: string;
  section_count: number;
  sections: TocSection[];
}

interface DocNodeData extends Record<string, unknown> {
  section: TocSection;
  level: 1 | 2 | 3;
  hasChildren: boolean;
  isCollapsed: boolean;
  hiddenCount: number;
  onToggle: (id: string) => void;
}

type DocNode = Node<DocNodeData, "doc">;

// ---------------------------------------------------------------------------
// Custom node — a compact card with an H-level badge + collapse chevron.
// ---------------------------------------------------------------------------

const LEVEL_STYLES: Record<
  number,
  { card: string; badge: string; ring: string }
> = {
  1: {
    card: "border-primary/40 bg-primary/[0.04]",
    badge: "bg-primary/10 text-primary border-primary/30",
    ring: "ring-primary",
  },
  2: {
    card: "border-blue-300/60 bg-blue-50/60 dark:bg-blue-950/30",
    badge: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
    ring: "ring-blue-400",
  },
  3: {
    card: "border-slate-300/60 bg-slate-50 dark:bg-slate-900/40",
    badge: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300",
    ring: "ring-slate-400",
  },
};

function DocNodeView({ data, selected }: NodeProps<DocNode>) {
  const style = LEVEL_STYLES[data.level] ?? LEVEL_STYLES[3];
  return (
    <div
      className={[
        "group rounded-xl border bg-background shadow-sm transition-shadow",
        "min-w-[220px] max-w-[260px] px-3 py-2.5",
        style.card,
        selected ? `ring-2 ring-offset-2 ${style.ring}` : "hover:shadow-md",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1.5 !w-1.5 !min-h-0 !min-w-0 !border-0 !bg-muted-foreground/50"
      />

      <div className="flex items-start gap-2">
        <span
          className={[
            "font-data inline-flex shrink-0 items-center rounded border px-1.5 py-0.5",
            "text-[10px] font-semibold tracking-wide uppercase",
            style.badge,
          ].join(" ")}
        >
          H{data.level}
        </span>
        <p className="text-[12.5px] leading-snug font-medium text-foreground line-clamp-2">
          {data.section.title || "Untitled section"}
        </p>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
          {data.section.token_count
            ? `${data.section.token_count.toLocaleString()} tok`
            : "—"}
        </span>
        {data.hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onToggle(data.section.section_id);
            }}
            className={[
              "font-data inline-flex items-center gap-1 rounded border px-1.5 py-0.5",
              "text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            ].join(" ")}
            aria-label={data.isCollapsed ? "Expand children" : "Collapse children"}
          >
            {data.isCollapsed ? (
              <>
                <ChevronRight className="size-3" />
                {data.hiddenCount}
              </>
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1.5 !w-1.5 !min-h-0 !min-w-0 !border-0 !bg-muted-foreground/50"
      />
    </div>
  );
}

const nodeTypes = { doc: DocNodeView };

// ---------------------------------------------------------------------------
// Layout via dagre. Fixed node dimensions matching DocNodeView's box.
// ---------------------------------------------------------------------------

const NODE_W = 240;
const NODE_H = 84;

function layoutWithDagre(nodes: DocNode[], edges: Edge[]): DocNode[] {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 28, ranksep: 64 });

  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of edges) g.setEdge(e.source, e.target);

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      // dagre returns the node center; React Flow positions by top-left.
      position: { x: pos.x - NODE_W / 2, y: pos.y - NODE_H / 2 },
    };
  });
}

// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when at least one section reports a real depth or
 * parent_id — i.e. the backend gave us a structural tree to honor.
 */
function hasBackendHierarchy(sections: TocSection[]): boolean {
  return sections.some(
    (s) => (s.depth ?? 0) > 0 || (s.parent_id ?? "") !== "",
  );
}

/**
 * Map each section_id to its direct children ids. Empty parent_id
 * (which the backend uses for top-level sections) is the synthetic
 * "root" key.
 */
function indexChildren(sections: TocSection[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const s of sections) {
    const parent = s.parent_id ?? "";
    if (!out.has(parent)) out.set(parent, []);
    out.get(parent)!.push(s.section_id);
  }
  return out;
}

/**
 * Order id → depth for every section. Falls back to depth=1 when the
 * backend didn't supply it.
 */
function indexDepths(sections: TocSection[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of sections) {
    out.set(s.section_id, Math.max(1, s.depth ?? 1));
  }
  return out;
}

/**
 * Returns the set of section IDs that are descendants of a collapsed
 * ancestor — those should be hidden from the rendered graph.
 *
 * Walks from collapsed nodes outward via the children index, so it's
 * O(visible nodes) instead of O(N²).
 */
function computeHidden(
  collapsed: Set<string>,
  childrenOf: Map<string, string[]>,
): Set<string> {
  const hidden = new Set<string>();
  const stack: string[] = [];
  for (const id of collapsed) {
    for (const c of childrenOf.get(id) ?? []) stack.push(c);
  }
  while (stack.length) {
    const id = stack.pop()!;
    if (hidden.has(id)) continue;
    hidden.add(id);
    for (const c of childrenOf.get(id) ?? []) stack.push(c);
  }
  return hidden;
}

/**
 * Counts every descendant of `id` (transitively). Used to show
 * "+N" on the collapse chevron so users know the size of the
 * hidden subtree before they expand it.
 */
function countDescendants(
  id: string,
  childrenOf: Map<string, string[]>,
): number {
  let total = 0;
  const stack: string[] = [...(childrenOf.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    total++;
    for (const c of childrenOf.get(cur) ?? []) stack.push(c);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocumentGraphPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);

  const [toc, setToc] = useState<TocData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Fetch ToC.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/dashboard/documents/${docId}/toc`);
        if (!res.ok) {
          if (alive) setError("Failed to load document structure");
          return;
        }
        const data = (await res.json()) as TocData;
        if (alive) setToc(data);
      } catch {
        if (alive) setError("Failed to load document structure");
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [docId]);

  const sections = toc?.sections ?? [];
  const usesBackendHierarchy = useMemo(
    () => hasBackendHierarchy(sections),
    [sections],
  );
  const childrenOf = useMemo(() => indexChildren(sections), [sections]);
  const depthOf = useMemo(() => indexDepths(sections), [sections]);

  // Auto-collapse depth ≥ 3 the first time data arrives so the initial
  // view isn't overwhelming. Users can expand from there.
  const [didAutoCollapse, setDidAutoCollapse] = useState(false);
  useEffect(() => {
    if (didAutoCollapse || sections.length === 0) return;
    const initial = new Set<string>();
    for (const s of sections) {
      const d = depthOf.get(s.section_id) ?? 1;
      const hasKids = (childrenOf.get(s.section_id) ?? []).length > 0;
      if (hasKids && d >= 2) initial.add(s.section_id);
    }
    setCollapsed(initial);
    setDidAutoCollapse(true);
  }, [sections, depthOf, childrenOf, didAutoCollapse]);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Build React Flow nodes + edges, filtered by collapse state, then
  // run dagre to position them.
  const { rfNodes, rfEdges } = useMemo(() => {
    if (sections.length === 0) {
      return { rfNodes: [] as DocNode[], rfEdges: [] as Edge[] };
    }

    const hidden = computeHidden(collapsed, childrenOf);

    const nodes: DocNode[] = [];
    for (const s of sections) {
      if (hidden.has(s.section_id)) continue;
      const kids = childrenOf.get(s.section_id) ?? [];
      const hasChildren = kids.length > 0;
      const isCollapsed = collapsed.has(s.section_id);
      const level = Math.min(
        3,
        Math.max(1, depthOf.get(s.section_id) ?? 1),
      ) as 1 | 2 | 3;
      nodes.push({
        id: s.section_id,
        type: "doc",
        position: { x: 0, y: 0 }, // dagre will overwrite
        data: {
          section: s,
          level,
          hasChildren,
          isCollapsed,
          hiddenCount: isCollapsed
            ? countDescendants(s.section_id, childrenOf)
            : 0,
          onToggle: toggleCollapsed,
        },
      });
    }

    const visibleIds = new Set(nodes.map((n) => n.id));
    const edges: Edge[] = [];
    for (const s of sections) {
      const parent = s.parent_id ?? "";
      if (!parent) continue;
      if (!visibleIds.has(parent) || !visibleIds.has(s.section_id)) continue;
      edges.push({
        id: `${parent}->${s.section_id}`,
        source: parent,
        target: s.section_id,
        type: "smoothstep",
        animated: false,
        style: { stroke: "rgb(148 163 184 / 0.6)", strokeWidth: 1.5 },
      });
    }

    const laidOut = layoutWithDagre(nodes, edges);
    return { rfNodes: laidOut, rfEdges: edges };
  }, [sections, collapsed, childrenOf, depthOf, toggleCollapsed]);

  const selectedSection = useMemo(() => {
    if (!selectedId) return null;
    return sections.find((s) => s.section_id === selectedId) ?? null;
  }, [selectedId, sections]);

  // Counts for the header pills.
  const visibleCount = rfNodes.length;
  const totalCount = sections.length;

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[150px]" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[280px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-[560px] w-full rounded-xl" />
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/documents/${docId}`}>
            <ArrowLeft className="size-4" />
            Back to Document
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-lg font-medium text-foreground">{error}</h2>
        </div>
      </div>
    );
  }

  // --- Empty state ---
  if (sections.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/documents/${docId}`}>
            <ArrowLeft className="size-4" />
            Back to Document
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <Layers className="size-10 text-muted-foreground" />
          <h3 className="mt-4 text-sm font-medium text-foreground">
            No sections to visualize
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            This document has no sections yet. It may still be processing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/documents/${docId}`}>
          <ArrowLeft className="size-4" />
          Back to Document
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Document Structure
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "section" : "sections"} in{" "}
            <span className="font-medium text-foreground">
              {toc?.title || "this document"}
            </span>
            {visibleCount !== totalCount && (
              <>
                {" "}
                · showing{" "}
                <span className="font-medium text-foreground">
                  {visibleCount}
                </span>
              </>
            )}
            {!usesBackendHierarchy && (
              <>
                {" "}
                ·{" "}
                <span className="italic text-amber-700 dark:text-amber-400">
                  legacy doc — hierarchy inferred from titles
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            <Hash className="mr-1 size-3" />
            {docId.slice(0, 12)}…
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Layers className="mr-1 size-3" />
            {totalCount} sections
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          className={selectedSection ? "lg:col-span-2" : "lg:col-span-3"}
        >
          <CardHeader className="flex-row items-center justify-between py-3">
            <CardTitle className="text-base">Section Graph</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setCollapsed(new Set())}
              >
                Expand all
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  // Collapse every node with children.
                  const next = new Set<string>();
                  for (const s of sections) {
                    if ((childrenOf.get(s.section_id) ?? []).length > 0) {
                      next.add(s.section_id);
                    }
                  }
                  setCollapsed(next);
                }}
              >
                Collapse all
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[640px] w-full overflow-hidden rounded-b-xl border-t bg-[hsl(var(--muted))]/40">
              <ReactFlowProvider>
                <ReactFlow
                  nodes={rfNodes}
                  edges={rfEdges}
                  nodeTypes={nodeTypes}
                  onNodeClick={(_, node) =>
                    setSelectedId(node.id === selectedId ? null : node.id)
                  }
                  fitView
                  fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
                  minZoom={0.15}
                  maxZoom={1.5}
                  proOptions={{ hideAttribution: true }}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  edgesFocusable={false}
                  panOnDrag
                  panOnScroll
                  zoomOnScroll
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={20}
                    size={1}
                    className="!bg-transparent"
                  />
                  <Controls
                    showInteractive={false}
                    className="!border !border-border !shadow-sm [&>button]:!bg-background [&>button]:!border-border [&>button:hover]:!bg-accent"
                  />
                  <MiniMap
                    pannable
                    zoomable
                    nodeStrokeWidth={2}
                    nodeColor={(n) => {
                      const data = (n as DocNode).data;
                      if (!data) return "#cbd5e1";
                      return data.level === 1
                        ? "hsl(var(--primary))"
                        : data.level === 2
                          ? "#93c5fd"
                          : "#cbd5e1";
                    }}
                    className="!border !border-border !bg-background"
                  />
                </ReactFlow>
              </ReactFlowProvider>
              {rfNodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Laying out tree…
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t px-6 py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Legend:
              </span>
              <Legend swatch="border-primary/40 bg-primary/[0.04]" label="H1 (top-level)" />
              <Legend
                swatch="border-blue-300/60 bg-blue-50/60"
                label="H2"
              />
              <Legend
                swatch="border-slate-300/60 bg-slate-50"
                label="H3+"
              />
              <span className="text-xs text-muted-foreground">
                Click a node to inspect · scroll to zoom · drag to pan ·
                chevron to collapse
              </span>
            </div>
          </CardContent>
        </Card>

        {selectedSection && (
          <Card className="h-fit lg:col-span-1">
            <CardHeader className="flex-row items-start justify-between pb-3">
              <CardTitle className="text-base">Section Detail</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setSelectedId(null)}
                aria-label="Close detail panel"
              >
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Title
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground break-words">
                  {selectedSection.title || "Untitled section"}
                </p>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  H{Math.min(3, Math.max(1, selectedSection.depth ?? 1))}
                </Badge>
                {selectedSection.page_range && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    pp. {selectedSection.page_range}
                  </Badge>
                )}
                {selectedSection.token_count != null && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedSection.token_count.toLocaleString()} tokens
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-muted-foreground"
                >
                  #{selectedSection.order}
                </Badge>
              </div>

              <Separator />

              {selectedSection.summary ? (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Summary
                  </p>
                  <ScrollArea className="max-h-[260px]">
                    <MarkdownSummary content={selectedSection.summary} />
                  </ScrollArea>
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No summary available for this section.
                </p>
              )}

              {(childrenOf.get(selectedSection.section_id)?.length ?? 0) >
                0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Sub-sections
                    </p>
                    <p className="mt-0.5 text-sm text-foreground">
                      {childrenOf.get(selectedSection.section_id)?.length}{" "}
                      direct ·{" "}
                      {countDescendants(selectedSection.section_id, childrenOf)}{" "}
                      total
                    </p>
                  </div>
                </>
              )}

              <Button size="sm" className="w-full" asChild>
                <Link
                  href={`/dashboard/documents/${docId}/sections/${selectedSection.section_id}`}
                >
                  <FileText className="size-3.5" />
                  View Full Section
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`inline-block size-3 rounded-sm border ${swatch}`} />
      {label}
    </span>
  );
}
