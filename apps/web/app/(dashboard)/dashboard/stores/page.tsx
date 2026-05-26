"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Boxes, Plus, Trash2, Loader2, AlertCircle, Lock } from "lucide-react";

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  profile: string;
  is_default: boolean;
  created_at: string;
}

const PROFILES = [
  { value: "generic", label: "Generic", hint: "Heading-based structure for any document" },
  { value: "research", label: "Research", hint: "Tuned for academic papers (claims, methods, results)" },
  { value: "medical", label: "Medical", hint: "Tuned for clinical docs (findings, guidelines, dosages)" },
];

const profileColors: Record<string, string> = {
  generic: "bg-slate-100 text-slate-700 border-slate-200",
  research: "bg-violet-100 text-violet-700 border-violet-200",
  medical: "bg-teal-100 text-teal-700 border-teal-200",
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [profile, setProfile] = useState("generic");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/stores", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load stores (${res.status})`);
      const data = (await res.json()) as Store[];
      setStores(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stores");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStores();
  }, [fetchStores]);

  async function handleCreate() {
    setIsCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/dashboard/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to create store");
      setCreateOpen(false);
      setName("");
      setSlug("");
      setSlugEdited(false);
      setDescription("");
      setProfile("generic");
      await fetchStores();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create store");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/stores/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Failed to delete (${res.status})`);
      }
      await fetchStores();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete store");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Stores"
        description="Named collections your documents live in. Each store has a profile that controls how the engine structures and summarizes its documents."
        actions={
          <Button size="sm" className="h-9" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            New store
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Boxes className="size-4 text-muted-foreground" />
            Your stores
          </CardTitle>
          <CardDescription>
            Bind an API key to a store, or pick a store in the header, to scope
            uploads and queries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : stores.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No stores yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {s.name}
                        {s.is_default && (
                          <Badge variant="outline" className="text-[10px]">
                            default
                          </Badge>
                        )}
                      </div>
                      {s.description && (
                        <div className="text-xs text-muted-foreground">
                          {s.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {s.slug}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={profileColors[s.profile] ?? ""}
                      >
                        {s.profile}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(s.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.is_default ? (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Lock className="size-3" /> protected
                        </span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={deletingId === s.id}
                          onClick={() => handleDelete(s.id)}
                        >
                          {deletingId === s.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New store</DialogTitle>
            <DialogDescription>
              A store groups documents and applies a structuring profile to them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="store-name">Name</Label>
              <Input
                id="store-name"
                value={name}
                placeholder="Research Papers"
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugEdited) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="store-slug">Slug</Label>
              <Input
                id="store-slug"
                value={slug}
                placeholder="research-papers"
                className="font-mono"
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="store-desc">Description (optional)</Label>
              <Input
                id="store-desc"
                value={description}
                placeholder="arXiv + internal papers"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Profile</Label>
              <Select value={profile} onValueChange={setProfile}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {PROFILES.find((p) => p.value === profile)?.hint}
              </p>
            </div>
            {createError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !name.trim() || slug.length < 3}
            >
              {isCreating && <Loader2 className="size-3.5 animate-spin" />}
              Create store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
