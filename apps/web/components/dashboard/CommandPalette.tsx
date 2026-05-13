"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  CreditCard,
  FileText,
  FlaskConical,
  Key,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  Sparkles,
  Unplug,
  Upload,
} from "lucide-react";

import { signOut } from "@/lib/auth-client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleSignOut = async () => {
    onOpenChange(false);
    await signOut();
    window.location.href = "/login";
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions, documents…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard /> Overview
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/playground")}>
            <FlaskConical /> Playground
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/documents")}>
            <FileText /> Documents
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/analytics")}>
            <BarChart3 /> Analytics
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/usage")}>
            <Activity /> Usage
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => go("/dashboard/documents/upload")}>
            <Upload /> Upload document
            <CommandShortcut>⌘U</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/api-keys")}>
            <Key /> Manage API keys
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/settings/llm-keys")}>
            <Bot /> Configure LLM keys
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/connected-apps")}>
            <Unplug /> Connected apps
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/billing")}>
            <Sparkles className="text-brand-blue" /> Upgrade plan
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={() => go("/dashboard/settings")}>
            <Settings /> Settings
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/billing")}>
            <CreditCard /> Billing
          </CommandItem>
          <CommandItem onSelect={() => window.open("mailto:support@vectorless.dev", "_blank")}>
            <LifeBuoy /> Contact support
          </CommandItem>
          <CommandItem
            onSelect={handleSignOut}
            className="text-destructive data-[selected=true]:text-destructive"
          >
            <LogOut /> Sign out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
