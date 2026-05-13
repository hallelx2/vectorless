"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FlaskConical,
  BarChart3,
  Key,
  Settings,
  Bot,
  Unplug,
  Activity,
  CreditCard,
  Sparkles,
  LifeBuoy,
  BookOpen,
  ChevronUp,
  LogOut,
  User,
} from "lucide-react";

import { signOut, useSession } from "@/lib/auth-client";
import { VectorlessDot } from "@/components/VectorlessIcon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
      { title: "Playground", url: "/dashboard/playground", icon: FlaskConical, badge: "Live" },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "Documents",
        url: "/dashboard/documents",
        icon: FileText,
        children: [
          { title: "All documents", url: "/dashboard/documents" },
          { title: "Upload new", url: "/dashboard/documents/upload" },
        ],
      },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
      { title: "Usage", url: "/dashboard/usage", icon: Activity },
    ],
  },
  {
    label: "Developer",
    items: [
      { title: "API keys", url: "/dashboard/api-keys", icon: Key },
      { title: "LLM keys", url: "/dashboard/settings/llm-keys", icon: Bot },
      { title: "Connected apps", url: "/dashboard/connected-apps", icon: Unplug },
    ],
  },
] as const;

const FOOTER_NAV = [
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
  { title: "Docs", url: "/dashboard", icon: BookOpen, external: true },
  { title: "Support", url: "mailto:support@vectorless.dev", icon: LifeBuoy, external: true },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = React.useCallback(
    (url: string, exact?: boolean) => {
      if (exact || url === "/dashboard") return pathname === url;
      // /dashboard/settings should not match /dashboard/settings/llm-keys
      if (url === "/dashboard/settings") return pathname === url;
      return pathname === url || pathname.startsWith(url + "/");
    },
    [pathname]
  );

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/dashboard">
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-blue to-brand-pink text-white shadow-sm">
                  <VectorlessDot size={16} className="[&_circle]:fill-white [&_path]:stroke-brand-pink" />
                </span>
                <span className="flex flex-col gap-0.5 leading-none">
                  <span className="font-display font-medium text-[15px] tracking-tight">vectorless</span>
                  <span className="font-data text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    workspace
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="font-data uppercase tracking-[0.16em] text-[10px]">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.url);
                  const hasChildren = "children" in item && item.children;

                  if (hasChildren) {
                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                          <Link href={item.url}>
                            <Icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuSub>
                          {item.children!.map((child) => (
                            <SidebarMenuSubItem key={child.url}>
                              <SidebarMenuSubButton asChild isActive={isActive(child.url, true)}>
                                <Link href={child.url}>{child.title}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link href={item.url}>
                          <Icon />
                          <span>{item.title}</span>
                          {"badge" in item && item.badge && (
                            <Badge
                              variant="secondary"
                              className="ml-auto h-4 px-1.5 text-[9px] font-data uppercase tracking-[0.14em] bg-brand-pink/15 text-brand-pink border-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Upgrade plan">
              <Link
                href="/dashboard/billing"
                className="bg-gradient-to-br from-brand-blue/8 via-transparent to-brand-pink/8 border border-dashed border-brand-blue/20"
              >
                <Sparkles className="text-brand-blue" />
                <span className="font-medium">Upgrade plan</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {FOOTER_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                  <Link href={item.url}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          <SidebarSeparator />
          <UserCard />
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function UserCard() {
  const { data: session } = useSession();
  const user = session?.user;
  const name = user?.name ?? user?.email?.split("@")[0] ?? "Account";
  const initials = (name?.[0] ?? "V").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[slot=sidebar-menu-button]:!p-1.5 data-[state=open]:bg-sidebar-accent"
          >
            <Avatar className="h-7 w-7 rounded-lg">
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-brand-blue to-brand-pink text-white text-[11px] font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-[11px] text-muted-foreground">
                {user?.email ?? "vectorless workspace"}
              </span>
            </div>
            <ChevronUp className="ml-auto size-4 text-muted-foreground" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-gradient-to-br from-brand-blue to-brand-pink text-white text-[12px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-[11px] text-muted-foreground">{user?.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/account">
              <User className="size-4" />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/billing">
              <CreditCard className="size-4" />
              Billing
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}

function SidebarSeparator() {
  return <div className="mx-2 my-1 h-px bg-sidebar-border" />;
}
