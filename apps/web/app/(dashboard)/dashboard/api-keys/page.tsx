"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Key, Plus, Copy, Ban, Check } from "lucide-react";

const mockApiKeys = [
  {
    id: "key_1",
    name: "Production",
    key: "vl_live_sk_1a2b3c4d5e6f7g8h",
    status: "active" as const,
    createdAt: "Mar 15, 2026",
    lastUsed: "2 minutes ago",
  },
  {
    id: "key_2",
    name: "Development",
    key: "vl_test_sk_9i0j1k2l3m4n5o6p",
    status: "active" as const,
    createdAt: "Feb 20, 2026",
    lastUsed: "1 hour ago",
  },
  {
    id: "key_3",
    name: "CI Pipeline",
    key: "vl_live_sk_7q8r9s0t1u2v3w4x",
    status: "revoked" as const,
    createdAt: "Jan 10, 2026",
    lastUsed: "Mar 1, 2026",
  },
];

function maskKey(key: string) {
  const prefix = key.slice(0, 12);
  return `${prefix}${"*".repeat(8)}`;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  revoked: "bg-red-100 text-red-700 border-red-200",
};

export default function ApiKeysPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
        <Button>
          <Plus className="h-4 w-4" />
          Generate New Key
        </Button>
      </div>

      {/* Keys table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your API Keys</CardTitle>
          <CardDescription>
            {mockApiKeys.length} key{mockApiKeys.length !== 1 ? "s" : ""}{" "}
            configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mockApiKeys.length === 0 ? (
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
              <Button className="mt-4">
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
                {mockApiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">
                      {apiKey.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                          {maskKey(apiKey.key)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleCopy(apiKey.key, apiKey.id)}
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
                        className={statusColors[apiKey.status]}
                      >
                        {apiKey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {apiKey.createdAt}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {apiKey.lastUsed}
                    </TableCell>
                    <TableCell className="text-right">
                      {apiKey.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Revoke
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
