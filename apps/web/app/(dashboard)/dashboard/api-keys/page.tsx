"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Key, Plus, Copy, Ban, Check, Loader2, AlertTriangle } from "lucide-react";
import {
  createApiKey,
  revokeApiKey,
  listApiKeys,
} from "@/lib/actions/api-keys";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string | null;
  rateLimit: number | null;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

function maskPrefix(prefix: string) {
  return `${prefix}${"*".repeat(8)}`;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "Never";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  revoked: "bg-red-100 text-red-700 border-red-200",
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Generate dialog state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Key reveal dialog state (shown after creation)
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealedKeyName, setRevealedKeyName] = useState<string>("");
  const [keyCopied, setKeyCopied] = useState(false);

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    const result = await listApiKeys();
    if (result.error) {
      setError(result.error);
    } else {
      setKeys(result.keys);
      setError(null);
    }
    setIsLoading(false);
  }, []);

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchKeys();
    }
  }, [fetchKeys]);

  const handleGenerate = async () => {
    if (!keyName.trim()) return;
    setIsGenerating(true);
    setError(null);
    const result = await createApiKey({ name: keyName.trim() });
    setIsGenerating(false);

    if (result.error) {
      setError(result.error);
    } else if (result.key) {
      // Show the full key in the reveal dialog
      setRevealedKey(result.key);
      setRevealedKeyName(result.name ?? keyName.trim());
      setKeyCopied(false);
      setGenerateOpen(false);
      setKeyName("");
      setRevealOpen(true);
      // Refresh the list
      fetchKeys();
    }
  };

  const handleRevoke = async (keyId: string) => {
    setRevokingId(keyId);
    setError(null);
    const result = await revokeApiKey(keyId);
    setRevokingId(null);

    if (result.error) {
      setError(result.error);
    } else {
      // Remove revoked key from the list (listApiKeys filters out revoked keys)
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    }
  };

  const handleCopyPrefix = async (prefix: string, id: string) => {
    await navigator.clipboard.writeText(prefix);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyRevealedKey = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            API Keys
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your API keys for accessing the Vectorless API.
          </p>
        </div>
        <Button onClick={() => setGenerateOpen(true)}>
          <Plus className="h-4 w-4" />
          Generate New Key
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Generate Key Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Give your API key a descriptive name so you can identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Production, Development, CI Pipeline"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && keyName.trim()) {
                    handleGenerate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateOpen(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !keyName.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Generate Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal Key Dialog (shown once after creation) */}
      <Dialog
        open={revealOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRevealOpen(false);
            setRevealedKey(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Your new API key &quot;{revealedKeyName}&quot; has been created
              successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all text-sm font-mono">
                  {revealedKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={handleCopyRevealedKey}
                >
                  {keyCopied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                Make sure to copy your API key now. You won&apos;t be able to
                see it again.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setRevealOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keys table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your API Keys</CardTitle>
          <CardDescription>
            {keys.length} key{keys.length !== 1 ? "s" : ""} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Key className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-medium text-foreground">
                No API keys yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate your first API key to start using the Vectorless API.
              </p>
              <Button className="mt-4" onClick={() => setGenerateOpen(true)}>
                <Plus className="h-4 w-4" />
                Generate New Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">
                      {apiKey.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                          {maskPrefix(apiKey.keyPrefix)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            handleCopyPrefix(apiKey.keyPrefix, apiKey.id)
                          }
                        >
                          {copiedId === apiKey.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors["active"]}
                      >
                        active
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(apiKey.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(apiKey.lastUsedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={revokingId === apiKey.id}
                        onClick={() => handleRevoke(apiKey.id)}
                      >
                        {revokingId === apiKey.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage notice */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Key className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Keep your API keys secure
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Do not share your API keys in publicly accessible areas such as
                GitHub, client-side code, or public repositories. If you believe
                a key has been compromised, revoke it immediately and generate a
                new one.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
