"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import UserMenu from "./UserMenu";

interface DashboardHeaderProps {
  onMobileMenuToggle?: () => void;
}

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

export default function DashboardHeader({
  onMobileMenuToggle,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-light bg-white px-4 md:px-6">
      {/* Left side: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="md:hidden text-text-secondary"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center">
          <ol className="flex items-center gap-1">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li key={crumb.href} className="flex items-center gap-1">
                  {index > 0 && (
                    <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
                  )}
                  {isLast ? (
                    <span className="text-sm font-medium text-text-dark">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className={cn(
                        "text-sm text-text-muted transition-colors hover:text-text-dark"
                      )}
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Right side: user menu */}
      <div className="flex items-center gap-3">
        <UserMenu />
      </div>
    </header>
  );
}
