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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key,
  Plus,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Shield,
  Bot,
  Loader2,
} from "lucide-react";
import {
  createLLMKey,
  listLLMKeys,
  updateLLMKey,
  deleteLLMKey,
  type LLMProvider,
  type LLMKeyPublic,
} from "@/lib/actions/llm-keys";

const providerConfig: Record<
  LLMProvider,
  { label: string; color: string }
> = {
  gemini: {
    label: "Gemini",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  anthropic: {
    label: "Anthropic",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  openai: {
    label: "OpenAI",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LLMKeysPage() {
  const [keys, setKeys] = useState<LLMKeyPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addProvider, setAddProvider] = useState<LLMProvider>("gemini");
  const [addLabel, setAddLabel] = useState("");
  const [addApiKey, setAddApiKey] = useState("");
  const [showAddKey, setShowAddKey] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editKey, setEditKey] = useState<LLMKeyPublic | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [showEditKey, setShowEditKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LLMKeyPublic | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    const result = await listLLMKeys();
    if (result.error) {
      setError(result.error);
    } else {
      setKeys(result.keys);
      setError(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleAdd = async () => {
    if (!addLabel.trim() || !addApiKey.trim()) return;
    setIsAdding(true);
    const result = await createLLMKey({
      provider: addProvider,
      label: addLabel.trim(),
      apiKey: addApiKey.trim(),
    });
    setIsAdding(false);
    if (result.error) {
      setError(result.error);
    } else if (result.key) {
      setKeys((prev) => [...prev, result.key!]);
      setAddOpen(false);
      setAddProvider("gemini");
      setAddLabel("");
      setAddApiKey("");
      setShowAddKey(false);
    }
  };

  const handleEdit = async () => {
    if (!editKey || !editLabel.trim()) return;
    setIsEditing(true);
    const updates: { label?: string; apiKey?: string } = {
      label: editLabel.trim(),
    };
    if (editApiKey.trim()) {
      updates.apiKey = editApiKey.trim();
    }
    const result = await updateLLMKey(editKey.id, updates);
    setIsEditing(false);
    if (result.error) {
      setError(result.error);
    } else if (result.key) {
      setKeys((prev) =>
        prev.map((k) => (k.id === result.key!.id ? result.key! : k))
      );
      setEditOpen(false);
      setEditKey(null);
      setEditLabel("");
      setEditApiKey("");
      setShowEditKey(false);
    }
  };

  const handleToggleActive = async (key: LLMKeyPublic) => {
    const result = await updateLLMKey(key.id, { isActive: !key.isActive });
    if (result.error) {
      setError(result.error);
    } else if (result.key) {
      setKeys((prev) =>
        prev.map((k) => (k.id === result.key!.id ? result.key! : k))
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteLLMKey(deleteTarget.id);
    setIsDeleting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const openEditDialog = (key: LLMKeyPublic) => {
    setEditKey(key);
    setEditLabel(key.label);
    setEditApiKey("");
    setShowEditKey(false);
    setEditOpen(true);
  };

  const openDeleteDialog = (key: LLMKeyPublic) => {
    setDeleteTarget(key);
    setDeleteOpen(true);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            LLM API Keys
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your own LLM API keys for document processing. Keys are
            encrypted at rest.
          </p>
        </div>

        {/* Add Key Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Add Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add LLM API Key</DialogTitle>
              <DialogDescription>
                Add your own API key for a supported LLM provider. The key will
                be encrypted before storage.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-provider">Provider</Label>
                <Select
                  value={addProvider}
                  onValueChange={(v) => setAddProvider(v as LLMProvider)}
                >
                  <SelectTrigger id="add-provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-label">Label</Label>
                <Input
                  id="add-label"
                  value={addLabel}
                  onChange={(e) => setAddLabel(e.target.value)}
                  placeholder="e.g. Production Key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-apikey">API Key</Label>
                <div className="relative">
                  <Input
                    id="add-apikey"
                    type={showAddKey ? "text" : "password"}
                    value={addApiKey}
                    onChange={(e) => setAddApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowAddKey(!showAddKey)}
                  >
                    {showAddKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isAdding || !addLabel.trim() || !addApiKey.trim()}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Key"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your LLM Keys</CardTitle>
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
                No LLM keys yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first LLM API key to use your own models for document
                processing.
              </p>
              <Button className="mt-4" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => {
                  const config = providerConfig[key.provider];
                  return (
                    <TableRow key={key.id}>
                      <TableCell>
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {key.label}
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                          {key.keyMask}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={key.isActive}
                            onCheckedChange={() => handleToggleActive(key)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {key.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {key.lastUsedAt
                          ? formatDate(key.lastUsedAt)
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(key)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => openDeleteDialog(key)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit LLM Key</DialogTitle>
            <DialogDescription>
              Update the label or replace the API key. Leave the API key field
              empty to keep the existing key.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-provider">Provider</Label>
              <Input
                id="edit-provider"
                value={
                  editKey
                    ? providerConfig[editKey.provider].label
                    : ""
                }
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="e.g. Production Key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-apikey">
                New API Key{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <div className="relative">
                <Input
                  id="edit-apikey"
                  type={showEditKey ? "text" : "password"}
                  value={editApiKey}
                  onChange={(e) => setEditApiKey(e.target.value)}
                  placeholder="Leave empty to keep current key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowEditKey(!showEditKey)}
                >
                  {showEditKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isEditing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isEditing || !editLabel.trim()}
            >
              {isEditing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete LLM Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the key &quot;{deleteTarget?.label}
              &quot;? This action cannot be undone. Any document processing using
              this key will fall back to the platform default.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Key
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Security &amp; Usage
                </p>
                <Separator className="my-2" />
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0" />
                  Your keys are encrypted with AES-256-GCM before storage
                </li>
                <li className="flex items-start gap-2">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0" />
                  Keys are used during document ingestion for ToC generation
                  (hybrid and generate strategies)
                </li>
                <li className="flex items-start gap-2">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0" />
                  If no key is configured, the platform&apos;s default LLM will
                  be used
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
