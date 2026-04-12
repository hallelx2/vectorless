"use client";

import { useState, useEffect, useMemo, useCallback, use } from "react";
import Link from "next/link";
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
import {
  ArrowLeft,
  X,
  Layers,
  Hash,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { MarkdownSummary } from "@/components/ui/markdown";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TocSection {
  section_id: string;
  order: number;
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

/** Internal tree node used for layout computation. */
interface TreeNode {
  section: TocSection;
  level: number;
  children: TreeNode[];
}

/** Positioned node ready for SVG rendering. */
interface PositionedNode {
  id: string;
  section: TocSection;
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
  children: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NODE_WIDTH = 180;
const NODE_HEIGHT = 64;
const H_GAP = 32;
const V_GAP = 80;

const LEVEL_STYLES: Record<
  number,
  { bg: string; border: string; text: string; badge: string }
> = {
  1: {
    bg: "fill-primary/10",
    border: "stroke-primary",
    text: "fill-primary",
    badge: "H1",
  },
  2: {
    bg: "fill-blue-50",
    border: "stroke-blue-200",
    text: "fill-blue-700",
    badge: "H2",
  },
  3: {
    bg: "fill-slate-50",
    border: "stroke-slate-200",
    text: "fill-slate-600",
    badge: "H3",
  },
};

function getLevelStyle(level: number) {
  return LEVEL_STYLES[level] || LEVEL_STYLES[3];
}

// ---------------------------------------------------------------------------
// Tree building helpers
// ---------------------------------------------------------------------------

/**
 * Infer a heading level from a section title.
 * Looks for patterns like "1." (H1), "1.2" (H2), "1.2.3" (H3), etc.
 * Falls back to a simple order-based heuristic when no numbering is present.
 */
function inferLevel(section: TocSection, _index: number, total: number): number {
  const title = section.title.trim();

  // Numbered headings: "1.", "1.2", "1.2.3"
  const numberedMatch = title.match(/^(\d+(?:\.\d+)*)[.\s):\-]/);
  if (numberedMatch) {
    const depth = numberedMatch[1].split(".").length;
    return Math.min(depth, 3);
  }

  // Roman numeral top-level: "I.", "II.", "III."
  if (/^[IVXLC]+[.\s)]/i.test(title)) return 1;

  // Lettered sub-sections: "(a)", "a.", "A."
  if (/^[(\s]*[a-zA-Z][).\s]/.test(title) && total > 3) return 2;

  // Default: everything is level 1 (flat list rendered as top-level nodes)
  return 1;
}

/**
 * Build a tree from flat sections using inferred heading levels.
 * Uses a stack-based approach: each section is placed as a child of the most
 * recent ancestor with a lower level.
 */
function buildTree(sections: TocSection[]): TreeNode[] {
  const total = sections.length;
  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const level = inferLevel(section, i, total);
    const node: TreeNode = { section, level, children: [] };

    // Pop stack until we find a parent with a strictly lower level
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  }

  return roots;
}

// ---------------------------------------------------------------------------
// Layout engine
// ---------------------------------------------------------------------------

/**
 * Compute positions for every node in the tree. Uses a bottom-up approach:
 * 1. Measure subtree widths recursively.
 * 2. Position children centered under their parent.
 */
function layoutTree(roots: TreeNode[]): {
  nodes: PositionedNode[];
  width: number;
  height: number;
} {
  const positioned: PositionedNode[] = [];
  let maxDepth = 0;

  /** Returns the total width consumed by this subtree. */
  function measureWidth(node: TreeNode): number {
    if (node.children.length === 0) return NODE_WIDTH;
    const childrenWidth = node.children.reduce(
      (sum, child) => sum + measureWidth(child) + H_GAP,
      -H_GAP
    );
    return Math.max(NODE_WIDTH, childrenWidth);
  }

  /** Place a node and its descendants. */
  function place(node: TreeNode, x: number, y: number, availableWidth: number) {
    const depth = Math.floor(y / (NODE_HEIGHT + V_GAP)) + 1;
    if (depth > maxDepth) maxDepth = depth;

    const nodeX = x + availableWidth / 2 - NODE_WIDTH / 2;

    const posNode: PositionedNode = {
      id: node.section.section_id,
      section: node.section,
      level: node.level,
      x: nodeX,
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      children: node.children.map((c) => c.section.section_id),
    };
    positioned.push(posNode);

    if (node.children.length > 0) {
      const childrenTotalWidth = node.children.reduce(
        (sum, child) => sum + measureWidth(child) + H_GAP,
        -H_GAP
      );
      let cx = x + availableWidth / 2 - childrenTotalWidth / 2;
      const cy = y + NODE_HEIGHT + V_GAP;
      for (const child of node.children) {
        const cw = measureWidth(child);
        place(child, cx, cy, cw);
        cx += cw + H_GAP;
      }
    }
  }

  // Measure total width across all roots
  const totalRootsWidth = roots.reduce(
    (sum, root) => sum + measureWidth(root) + H_GAP,
    -H_GAP
  );

  // Place each root side by side
  let rx = 0;
  for (const root of roots) {
    const rw = measureWidth(root);
    place(root, rx, 0, rw);
    rx += rw + H_GAP;
  }

  return {
    nodes: positioned,
    width: Math.max(totalRootsWidth, NODE_WIDTH),
    height: maxDepth * (NODE_HEIGHT + V_GAP) - V_GAP + NODE_HEIGHT,
  };
}

// ---------------------------------------------------------------------------
// SVG sub-components
// ---------------------------------------------------------------------------

function GraphNode({
  node,
  isSelected,
  onClick,
}: {
  node: PositionedNode;
  isSelected: boolean;
  onClick: () => void;
}) {
  const style = getLevelStyle(node.level);
  const title =
    node.section.title.length > 22
      ? node.section.title.slice(0, 20) + "..."
      : node.section.title;
  const tokens = node.section.token_count;

  return (
    <g
      className="cursor-pointer transition-opacity hover:opacity-90"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Section: ${node.section.title}`}
    >
      {/* Shadow */}
      <rect
        x={node.x + 2}
        y={node.y + 2}
        width={node.width}
        height={node.height}
        rx={10}
        className="fill-black/5"
      />
      {/* Node body */}
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx={10}
        className={`${style.bg} ${style.border}`}
        strokeWidth={isSelected ? 2.5 : 1.5}
      />
      {/* Level badge */}
      <rect
        x={node.x + 8}
        y={node.y + 8}
        width={26}
        height={16}
        rx={4}
        className={`${style.border}`}
        strokeWidth={1}
        fillOpacity={0.15}
      />
      <text
        x={node.x + 21}
        y={node.y + 19.5}
        textAnchor="middle"
        className={`${style.text} text-[9px] font-semibold`}
        style={{ fontFamily: "ui-monospace, monospace" }}
      >
        {style.badge}
      </text>
      {/* Title */}
      <text
        x={node.x + NODE_WIDTH / 2}
        y={node.y + 30}
        textAnchor="middle"
        className={`${style.text} text-[11px] font-medium`}
      >
        {title}
      </text>
      {/* Token count */}
      {tokens != null && (
        <text
          x={node.x + NODE_WIDTH / 2}
          y={node.y + 48}
          textAnchor="middle"
          className="fill-muted-foreground text-[9px]"
          style={{ fontFamily: "ui-monospace, monospace" }}
        >
          {tokens.toLocaleString()} tokens
        </text>
      )}
    </g>
  );
}

function GraphEdge({
  parent,
  child,
}: {
  parent: PositionedNode;
  child: PositionedNode;
}) {
  const x1 = parent.x + parent.width / 2;
  const y1 = parent.y + parent.height;
  const x2 = child.x + child.width / 2;
  const y2 = child.y;
  const midY = (y1 + y2) / 2;

  return (
    <path
      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
      className="stroke-border"
      strokeWidth={1.5}
      fill="none"
    />
  );
}

/** Dashed horizontal edge connecting sequential siblings. */
function SequentialEdge({
  left,
  right,
}: {
  left: PositionedNode;
  right: PositionedNode;
}) {
  const x1 = left.x + left.width;
  const y1 = left.y + left.height / 2;
  const x2 = right.x;
  const y2 = right.y + right.height / 2;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className="stroke-border"
      strokeWidth={1}
      strokeDasharray="4 3"
      opacity={0.5}
    />
  );
}

// ---------------------------------------------------------------------------
// Main page component
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
  const [zoom, setZoom] = useState(1);

  // Fetch ToC data
  useEffect(() => {
    async function fetchToc() {
      try {
        const res = await fetch(`/api/dashboard/documents/${docId}/toc`);
        if (!res.ok) {
          setError("Failed to load document structure");
          return;
        }
        const data = await res.json();
        setToc(data);
      } catch {
        setError("Failed to load document structure");
      } finally {
        setIsLoading(false);
      }
    }
    fetchToc();
  }, [docId]);

  // Build tree and layout
  const layout = useMemo(() => {
    if (!toc || toc.sections.length === 0) return null;
    const tree = buildTree(toc.sections);
    return layoutTree(tree);
  }, [toc]);

  const nodeMap = useMemo(() => {
    if (!layout) return new Map<string, PositionedNode>();
    const map = new Map<string, PositionedNode>();
    for (const node of layout.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [layout]);

  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.2, 0.4));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[150px]" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-5 w-[180px]" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/documents/${docId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Document
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <h2 className="text-lg font-medium text-foreground">{error}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The document structure could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const sections = toc?.sections || [];
  const docTitle = toc?.title || "Document";

  // --- Empty state ---
  if (!layout || sections.length === 0) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/documents/${docId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Document
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-20">
          <Layers className="h-10 w-10 text-muted-foreground" />
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

  // Build edges
  const parentChildEdges: { parent: PositionedNode; child: PositionedNode }[] =
    [];
  const sequentialEdges: { left: PositionedNode; right: PositionedNode }[] = [];

  for (const node of layout.nodes) {
    for (let i = 0; i < node.children.length; i++) {
      const childNode = nodeMap.get(node.children[i]);
      if (childNode) {
        parentChildEdges.push({ parent: node, child: childNode });
      }

      // Sequential edges between siblings
      if (i > 0) {
        const prevChild = nodeMap.get(node.children[i - 1]);
        if (prevChild && childNode) {
          sequentialEdges.push({ left: prevChild, right: childNode });
        }
      }
    }
  }

  // Also add sequential edges between root nodes
  const rootNodes = layout.nodes.filter(
    (n) => !layout.nodes.some((p) => p.children.includes(n.id))
  );
  for (let i = 1; i < rootNodes.length; i++) {
    sequentialEdges.push({ left: rootNodes[i - 1], right: rootNodes[i] });
  }

  const PADDING = 60;
  const svgWidth = layout.width + PADDING * 2;
  const svgHeight = layout.height + PADDING * 2;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/documents/${docId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to Document
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Document Structure
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual graph of {sections.length} sections in {docTitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            <Hash className="mr-1 h-3 w-3" />
            {docId.slice(0, 12)}...
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Layers className="mr-1 h-3 w-3" />
            {sections.length} sections
          </Badge>
        </div>
      </div>

      {/* Graph + detail panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* SVG Graph */}
        <Card className={selectedNode ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Section Graph</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
                aria-label="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-mono"
                onClick={handleZoomReset}
              >
                {Math.round(zoom * 100)}%
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
                aria-label="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomReset}
                aria-label="Fit to view"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[520px] w-full">
              <div
                className="min-w-full overflow-auto p-6"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  width: svgWidth * zoom > 0 ? svgWidth : "100%",
                }}
              >
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="mx-auto block"
                >
                  <g transform={`translate(${PADDING}, ${PADDING})`}>
                    {/* Sequential edges (dashed, behind everything) */}
                    {sequentialEdges.map((e, i) => (
                      <SequentialEdge key={`seq-${i}`} left={e.left} right={e.right} />
                    ))}

                    {/* Parent-child edges */}
                    {parentChildEdges.map((e, i) => (
                      <GraphEdge
                        key={`edge-${i}`}
                        parent={e.parent}
                        child={e.child}
                      />
                    ))}

                    {/* Nodes */}
                    {layout.nodes.map((node) => (
                      <GraphNode
                        key={node.id}
                        node={node}
                        isSelected={node.id === selectedId}
                        onClick={() =>
                          setSelectedId(node.id === selectedId ? null : node.id)
                        }
                      />
                    ))}
                  </g>
                </svg>
              </div>
            </ScrollArea>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 border-t px-6 py-3">
              <span className="text-xs font-medium text-muted-foreground">
                Legend:
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-3 w-3 rounded-sm border border-primary bg-primary/10" />
                Level 1 (H1)
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-3 w-3 rounded-sm border border-blue-200 bg-blue-50" />
                Level 2 (H2)
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-3 w-3 rounded-sm border border-slate-200 bg-slate-50" />
                Level 3 (H3)
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-6 w-px bg-border" />
                Parent-child
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block h-px w-6 border-t border-dashed border-border" />
                Sequential
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Detail side panel */}
        {selectedNode && (
          <Card className="h-fit lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <CardTitle className="text-base">Section Detail</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setSelectedId(null)}
                aria-label="Close detail panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Title
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {selectedNode.section.title}
                </p>
              </div>

              <Separator />

              {/* Metadata row */}
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {getLevelStyle(selectedNode.level).badge}
                </Badge>
                {selectedNode.section.page_range && (
                  <Badge variant="secondary" className="font-mono text-xs">
                    pp. {selectedNode.section.page_range}
                  </Badge>
                )}
                {selectedNode.section.token_count != null && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedNode.section.token_count.toLocaleString()} tokens
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-muted-foreground"
                >
                  #{selectedNode.section.order}
                </Badge>
              </div>

              <Separator />

              {/* Summary */}
              {selectedNode.section.summary ? (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    Summary
                  </p>
                  <ScrollArea className="max-h-[260px]">
                    <MarkdownSummary content={selectedNode.section.summary} />
                  </ScrollArea>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No summary available for this section.
                </p>
              )}

              <Separator />

              {/* Children count */}
              {selectedNode.children.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Sub-sections
                  </p>
                  <p className="mt-0.5 text-sm text-foreground">
                    {selectedNode.children.length} direct child
                    {selectedNode.children.length !== 1 ? "ren" : ""}
                  </p>
                </div>
              )}

              {/* Link to full section */}
              <Button size="sm" className="w-full" asChild>
                <Link
                  href={`/dashboard/documents/${docId}/sections/${selectedNode.id}`}
                >
                  <FileText className="h-3.5 w-3.5" />
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
