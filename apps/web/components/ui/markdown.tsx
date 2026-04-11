"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-display prose-headings:font-semibold prose-headings:text-foreground",
        "prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
        "prose-h1:mt-4 prose-h2:mt-3 prose-h3:mt-2",
        "prose-h1:mb-2 prose-h2:mb-2 prose-h3:mb-1",
        "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-2",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-ul:my-2 prose-ol:my-2",
        "prose-li:text-muted-foreground prose-li:my-0.5",
        "prose-code:text-xs prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground prose-code:font-mono",
        "prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-3",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-hr:border-border",
        "prose-table:text-sm",
        "prose-th:text-left prose-th:font-medium prose-th:text-foreground prose-th:border-b prose-th:border-border prose-th:pb-2",
        "prose-td:border-b prose-td:border-border prose-td:py-2 prose-td:text-muted-foreground",
        "prose-blockquote:border-l-2 prose-blockquote:border-primary/30 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground prose-blockquote:italic",
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

/**
 * Compact markdown preview — for summaries in lists/cards
 */
export function MarkdownSummary({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-xs max-w-none",
        "prose-headings:hidden",
        "prose-p:text-muted-foreground prose-p:text-sm prose-p:leading-relaxed prose-p:my-0",
        "prose-strong:text-foreground prose-strong:font-medium",
        "prose-ul:my-1 prose-ol:my-1 prose-li:text-sm prose-li:text-muted-foreground prose-li:my-0",
        "prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
