"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandPalette } from "./CommandPalette";

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    crumbs.push({ label, href: currentPath });
  }
  return crumbs;
}

export function TopBar() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <Breadcrumb>
          <BreadcrumbList className="text-[13px]">
            {breadcrumbs.map((crumb, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.href}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="font-medium">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right cluster */}
      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPaletteOpen(true)}
          className="h-8 gap-2 pl-2.5 pr-1.5 text-[12.5px] text-muted-foreground font-normal hover:text-foreground"
        >
          <Search className="size-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-data text-[10px] font-medium opacity-100 sm:inline-flex">
            <span className="text-[11px]">⌘</span>K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" className="size-8" aria-label="Notifications">
          <Bell className="size-4 text-muted-foreground" />
        </Button>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
