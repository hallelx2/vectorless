"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_client: "The application that sent you here is not recognized.",
  invalid_request: "The authorization request was malformed or incomplete.",
  access_denied: "You denied the authorization request.",
  expired_code: "The authorization code has expired. Please try again.",
  server_error: "Something went wrong on our end. Please try again later.",
};

export default function OAuthErrorPage() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "server_error";
  const errorDescription =
    searchParams.get("error_description") ??
    ERROR_MESSAGES[errorCode] ??
    "An unknown error occurred during authorization.";

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
            Authorization Failed
          </CardTitle>
          <CardDescription className="text-sm">
            {errorDescription}
          </CardDescription>
          <p className="text-xs text-muted-foreground mt-2">
            Error code: <code className="font-mono">{errorCode}</code>
          </p>
        </CardHeader>
        <CardFooter className="justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Return Home</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
