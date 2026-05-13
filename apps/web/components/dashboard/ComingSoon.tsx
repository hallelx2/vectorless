"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Bullet items shown as a teaser of what's coming */
  bullets?: string[];
  /** Primary CTA — usually "Notify me" or "Learn more" */
  primaryAction?: {
    label: string;
    href: string;
  };
  /** Secondary CTA */
  secondaryAction?: {
    label: string;
    href: string;
  };
}

export function ComingSoon({
  icon: Icon,
  title,
  description,
  bullets,
  primaryAction,
  secondaryAction,
}: ComingSoonProps) {
  return (
    <Card className="border-border/60 border-dashed bg-gradient-to-br from-transparent via-transparent to-brand-blue/[0.03] overflow-hidden">
      <CardContent className="px-8 py-16 md:py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-pink opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-pink" />
            </span>
            <span className="font-data text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Coming soon
            </span>
          </div>

          <div className="inline-flex size-12 items-center justify-center rounded-full bg-muted/70 border border-border mb-5">
            <Icon className="size-5 text-muted-foreground" />
          </div>

          <h2 className="font-display text-[24px] md:text-[28px] font-medium leading-tight tracking-[-0.02em] mb-3">
            {title}
          </h2>
          <p className="text-[14px] text-muted-foreground leading-[1.6] mb-8 max-w-[420px] mx-auto">
            {description}
          </p>

          {bullets && bullets.length > 0 && (
            <ul className="grid gap-1.5 text-left mb-8 max-w-[300px] mx-auto">
              {bullets.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-[13px] text-muted-foreground"
                >
                  <span className="font-data text-[10px] tracking-[0.1em] text-brand-blue uppercase pt-1">→</span>
                  {b}
                </li>
              ))}
            </ul>
          )}

          {(primaryAction || secondaryAction) && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
              {primaryAction && (
                <Button size="sm" className="h-9" asChild>
                  <Link href={primaryAction.href}>
                    {primaryAction.label}
                    <ArrowRight className="size-3" />
                  </Link>
                </Button>
              )}
              {secondaryAction && (
                <Button size="sm" variant="outline" className="h-9" asChild>
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
