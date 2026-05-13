"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_client: "The application that sent you here is not recognized.",
  invalid_request: "The authorization request was malformed or incomplete.",
  access_denied: "You denied the authorization request.",
  expired_code: "The authorization code has expired. Please try again.",
  server_error: "Something went wrong on our end. Please try again later.",
};

function OAuthErrorInner() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") ?? "server_error";
  const errorDescription =
    searchParams.get("error_description") ??
    ERROR_MESSAGES[errorCode] ??
    "An unknown error occurred during authorization.";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-6">
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 group"
      >
        <span className="font-display text-[18px] font-medium tracking-tight">vectorless</span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand-pink transition-transform group-hover:scale-150" />
      </Link>

      <div className="w-full max-w-[440px] space-y-7 text-center">
        <div className="space-y-5">
          <div className="inline-flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <header className="space-y-2">
            <h1 className="font-display text-[32px] font-medium leading-tight tracking-[-0.02em]">
              Authorization failed.
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              {errorDescription}
            </p>
          </header>
          <p className="font-data text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Error code · <span className="text-foreground">{errorCode}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button variant="outline" className="h-10 w-full sm:w-auto" asChild>
            <Link href="/">Return home</Link>
          </Button>
          <Button className="h-10 w-full sm:w-auto" asChild>
            <Link href="/dashboard">
              Go to dashboard
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OAuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OAuthErrorInner />
    </Suspense>
  );
}
