"use client";

import * as React from "react";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6 ${className ?? ""}`}>
      <div className="min-w-0 space-y-1.5">
        {eyebrow && (
          <p className="font-data text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[28px] md:text-[32px] font-medium leading-tight tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-[14px] text-muted-foreground leading-[1.55] max-w-[640px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
