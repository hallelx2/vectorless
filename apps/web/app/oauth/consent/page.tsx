"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  BookOpen,
  FileUp,
  Loader2,
  Search,
  Shield,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { validateOAuthRequest, submitOAuthConsent } from "./actions";

const SCOPE_DETAILS: Record<
  string,
  { label: string; description: string; icon: React.ReactNode }
> = {
  "documents:read": {
    label: "Read documents",
    description:
      "Read your documents, table-of-contents maps, and section content",
    icon: <BookOpen className="h-4 w-4 text-blue-500" />,
  },
  "documents:write": {
    label: "Write documents",
    description: "Upload new documents and delete existing documents",
    icon: <FileUp className="h-4 w-4 text-amber-500" />,
  },
  query: {
    label: "Query documents",
    description: "Ask natural-language questions against your documents",
    icon: <Search className="h-4 w-4 text-emerald-500" />,
  },
};

interface OAuthClient {
  id: string;
  name: string;
  logo_uri: string | null;
  policy_uri: string | null;
  tos_uri: string | null;
}

export default function OAuthConsentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [client, setClient] = useState<OAuthClient | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract query params
  const clientId = searchParams.get("client_id");
  const redirectUri = searchParams.get("redirect_uri");
  const scope = searchParams.get("scope");
  const state = searchParams.get("state");
  const codeChallenge = searchParams.get("code_challenge");
  const codeChallengeMethod = searchParams.get("code_challenge_method");
  const clientName = searchParams.get("client_name");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!sessionLoading && !session) {
      const returnTo = `/oauth/consent?${searchParams.toString()}`;
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
    }
  }, [session, sessionLoading, router, searchParams]);

  // Validate the OAuth request on mount (via server action)
  useEffect(() => {
    if (!clientId || !redirectUri || !scope || !codeChallenge) {
      setError("Invalid OAuth request — missing required parameters.");
      setIsLoading(false);
      return;
    }

    async function runValidation() {
      const result = await validateOAuthRequest({
        client_id: clientId!,
        redirect_uri: redirectUri!,
        scope: scope!,
        code_challenge: codeChallenge!,
        code_challenge_method: codeChallengeMethod ?? "S256",
      });

      if (!result.valid) {
        setError(result.error ?? "Failed to validate OAuth request.");
      } else {
        setClient(result.client!);
        setScopes(result.scopes!);
        setSelectedScopes(result.scopes!);
      }
      setIsLoading(false);
    }

    runValidation();
  }, [clientId, redirectUri, scope, codeChallenge, codeChallengeMethod]);

  async function handleApprove() {
    if (!session || !client) return;
    setIsSubmitting(true);

    try {
      // Use server action for secure cross-origin POST
      const result = await submitOAuthConsent({
        client_id: clientId!,
        redirect_uri: redirectUri!,
        scope: selectedScopes.join(" "),
        state: state ?? "",
        code_challenge: codeChallenge!,
        code_challenge_method: codeChallengeMethod ?? "S256",
        project_id: session.user.id, // Default project
        approved: true,
      });

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }

      setError(result.error ?? "Unexpected response from authorization server.");
    } catch {
      setError("Failed to authorize. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeny() {
    if (!redirectUri) return;
    setIsSubmitting(true);

    // Use server action for secure cross-origin POST
    const result = await submitOAuthConsent({
      client_id: clientId!,
      redirect_uri: redirectUri!,
      scope: selectedScopes.join(" "),
      state: state ?? "",
      code_challenge: codeChallenge!,
      code_challenge_method: codeChallengeMethod ?? "S256",
      project_id: session?.user.id ?? "",
      approved: false,
    });

    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }

    // Fallback: redirect client-side with error
    const url = new URL(redirectUri);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set("error_description", "User denied consent");
    if (state) url.searchParams.set("state", state);
    window.location.href = url.toString();
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  }

  // Loading state
  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--muted))] px-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Validating authorization request...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--muted))] px-4">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-semibold text-text-dark tracking-tight">
              vectorless
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
          </Link>
        </div>
        <Card className="w-full max-w-[480px]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="font-display text-xl">
              Authorization Error
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Consent screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--muted))] px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-semibold text-text-dark tracking-tight">
            vectorless
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
        </Link>
      </div>

      <Card className="w-full max-w-[480px]">
        <CardHeader className="text-center space-y-3">
          {/* Client icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            {client?.logo_uri ? (
              <img
                src={client.logo_uri}
                alt={client.name}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <Shield className="h-7 w-7 text-primary" />
            )}
          </div>

          <CardTitle className="font-display text-xl">
            {clientName ?? client?.name ?? "An application"}
          </CardTitle>
          <CardDescription className="text-base">
            wants to connect to your Vectorless account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Permissions */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              This will allow{" "}
              <span className="font-semibold">
                {clientName ?? client?.name}
              </span>{" "}
              to:
            </p>
          </div>

          <div className="space-y-3">
            {scopes.map((scope) => {
              const detail = SCOPE_DETAILS[scope];
              if (!detail) return null;
              return (
                <div
                  key={scope}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    id={`scope-${scope}`}
                    checked={selectedScopes.includes(scope)}
                    onCheckedChange={() => toggleScope(scope)}
                  />
                  <div className="flex items-start gap-2 flex-1">
                    <div className="mt-0.5">{detail.icon}</div>
                    <div>
                      <Label
                        htmlFor={`scope-${scope}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {detail.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {detail.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signed in as */}
          {session && (
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {session.user.email}
                </span>
              </p>
            </div>
          )}

          {/* Revocation notice */}
          <p className="text-xs text-muted-foreground text-center">
            You can revoke this access at any time in{" "}
            <Link
              href="/dashboard/connected-apps"
              className="text-primary underline underline-offset-2"
            >
              Settings &rarr; Connected Apps
            </Link>
            .
          </p>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDeny}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleApprove}
            disabled={isSubmitting || selectedScopes.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authorizing...
              </>
            ) : (
              "Allow access"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Policy links */}
      {(client?.policy_uri || client?.tos_uri) && (
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          {client.policy_uri && (
            <a
              href={client.policy_uri}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </a>
          )}
          {client.tos_uri && (
            <a
              href={client.tos_uri}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Terms of Service
            </a>
          )}
        </div>
      )}
    </div>
  );
}
