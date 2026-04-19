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
  Unplug,
  Shield,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import {
  listConnectedApps,
  revokeConnectedApp,
  type ConnectedApp,
} from "@/lib/actions/connected-apps";

const SCOPE_LABELS: Record<string, string> = {
  "documents:read": "Read",
  "documents:write": "Write",
  query: "Query",
};

const SCOPE_COLORS: Record<string, string> = {
  "documents:read":
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  "documents:write":
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  query:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
};

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ConnectedAppsPage() {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Revoke dialog state
  const [revokeTarget, setRevokeTarget] = useState<ConnectedApp | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const loadApps = useCallback(async () => {
    try {
      const result = await listConnectedApps();
      if (result.error) {
        setError(result.error);
      } else {
        setApps(result.apps);
      }
    } catch {
      setError("Failed to load connected apps.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  async function handleRevoke() {
    if (!revokeTarget) return;
    setIsRevoking(true);

    try {
      const result = await revokeConnectedApp(revokeTarget.id);
      if (result.success) {
        setApps((prev) => prev.filter((a) => a.id !== revokeTarget.id));
        setRevokeTarget(null);
      } else {
        setError(result.error ?? "Failed to revoke access.");
      }
    } catch {
      setError("Failed to revoke access.");
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Connected Apps
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage third-party applications that have access to your Vectorless
          account via OAuth.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Authorized Applications
          </CardTitle>
          <CardDescription>
            These applications can access your documents and queries on your
            behalf. You can revoke access at any time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-12">
              <Unplug className="h-10 w-10 mx-auto text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No connected apps yet.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                When you authorize an application like Claude Desktop to access
                your Vectorless account, it will appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Connected</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          {app.logoUri ? (
                            <img
                              src={app.logoUri}
                              alt={app.clientName}
                              className="h-6 w-6 rounded-full"
                            />
                          ) : (
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {app.clientName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app.source === "first_party"
                              ? "First-party"
                              : "Third-party"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {app.scopes.map((scope) => (
                          <Badge
                            key={scope}
                            variant="outline"
                            className={`text-xs ${SCOPE_COLORS[scope] ?? ""}`}
                          >
                            {SCOPE_LABELS[scope] ?? scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(app.grantedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => setRevokeTarget(app)}
                      >
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

      {/* Info card */}
      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 pt-6">
          <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              Connect via MCP
            </p>
            <p className="text-muted-foreground mt-1">
              Use the Vectorless MCP server to connect Claude Desktop, Cursor,
              or Windsurf to your documents. Run{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                npx vectorless-mcp
              </code>{" "}
              to get started, or configure a remote connection at{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                api.vectorless.store/mcp
              </code>
              .
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Revoke confirmation dialog */}
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke access</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke access for{" "}
              <span className="font-semibold text-foreground">
                {revokeTarget?.clientName}
              </span>
              ? This will immediately invalidate all tokens and the application
              will no longer be able to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              disabled={isRevoking}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isRevoking}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke access"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
