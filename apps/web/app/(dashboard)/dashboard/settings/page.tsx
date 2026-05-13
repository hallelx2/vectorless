"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, CreditCard, Loader2, Save, Unplug, User } from "lucide-react";

import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/PageHeader";

const SETTINGS_LINKS = [
  {
    label: "Account",
    description: "Email, security, sessions, deletion",
    icon: User,
    href: "/dashboard/settings/account",
  },
  {
    label: "LLM keys",
    description: "Bring your own OpenAI, Anthropic, Gemini",
    icon: Bot,
    href: "/dashboard/settings/llm-keys",
  },
  {
    label: "Connected apps",
    description: "OAuth clients with access to your workspace",
    icon: Unplug,
    href: "/dashboard/connected-apps",
  },
  {
    label: "Billing",
    description: "Plan, invoices, payment method",
    icon: CreditCard,
    href: "/dashboard/billing",
  },
] as const;

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || "");
  const [isSaving, setIsSaving] = useState(false);

  const initials = (name?.[0] ?? "V").toUpperCase();

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Your profile, your account, your access — everything that controls how you and your team show up inside Vectorless."
      />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-[15px]">Profile</CardTitle>
          <CardDescription className="text-[12.5px]">
            How you appear to teammates and in audit logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-5">
            <Avatar className="size-16 rounded-xl">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
              <AvatarFallback className="rounded-xl bg-gradient-to-br from-brand-blue to-brand-pink text-white text-[18px] font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium text-[14px]">{name || session?.user?.email}</p>
              <p className="font-data text-[11px] text-muted-foreground uppercase tracking-[0.14em]">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-[13px]">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[13px]">Email</Label>
              <Input id="email" value={session?.user?.email || ""} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="avatar" className="text-[13px]">Avatar URL</Label>
            <Input
              id="avatar"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-[12px] text-muted-foreground">
              Or leave blank — we&apos;ll use a brand gradient with your initials.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" className="h-9">Cancel</Button>
            <Button size="sm" className="h-9" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-data text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
          More settings
        </h2>
        <Card className="border-border/60">
          <CardContent className="p-2">
            <div className="divide-y divide-border/60">
              {SETTINGS_LINKS.map((s) => {
                const Icon = s.icon;
                return (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="group flex items-center gap-4 rounded-md px-3 py-3.5 hover:bg-accent transition-colors"
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-foreground">{s.label}</p>
                      <p className="text-[12.5px] text-muted-foreground">{s.description}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
