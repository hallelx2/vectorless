"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const AUTH_INPUT =
  "h-11 rounded-lg border-transparent bg-secondary/40 shadow-none transition-all duration-200 placeholder:text-muted-foreground/70 focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/10";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordValues) {
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }
    setError(null);
    try {
      await authClient.resetPassword({ newPassword: data.password, token });
      setSuccess(true);
    } catch {
      setError("Failed to reset password. The link may have expired.");
    }
  }

  if (!token) {
    return (
      <div className="space-y-7">
        <header className="space-y-2">
          <h1 className="font-display text-[28px] md:text-[32px] font-medium leading-tight tracking-[-0.02em]">
            Invalid link.
          </h1>
          <p className="text-[14px] text-muted-foreground">
            This reset link is missing a token or has already been used.
          </p>
        </header>
        <Button variant="outline" className="w-full h-11 rounded-lg" asChild>
          <Link href="/forgot-password">
            <ArrowLeft className="size-3.5" />
            Request a new link
          </Link>
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-7">
        <div className="space-y-4">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle className="size-4" />
          </div>
          <header className="space-y-2">
            <h1 className="font-display text-[28px] md:text-[32px] font-medium leading-tight tracking-[-0.02em]">
              Password updated.
            </h1>
            <p className="text-[14px] text-muted-foreground">
              Sign in with your new password to continue.
            </p>
          </header>
        </div>
        <Button
          className="group w-full h-11 rounded-lg shadow-sm transition-all hover:shadow-md"
          onClick={() => router.push("/login")}
        >
          Sign in
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header className="auth-rise space-y-2">
        <h1 className="font-display text-[28px] md:text-[32px] font-medium leading-tight tracking-[-0.02em]">
          Set a new password.
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Make it 8+ characters with at least one uppercase letter and one number.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-rise auth-d1 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px]">New password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 characters"
              autoComplete="new-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              className={`${AUTH_INPUT} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[12px] text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-[13px]">Confirm new password</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className={AUTH_INPUT}
            {...register("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p className="text-[12px] text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-11 rounded-lg shadow-sm transition-all hover:shadow-md" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Resetting…
            </>
          ) : (
            "Reset password"
          )}
        </Button>

        <Button variant="ghost" className="w-full h-11 rounded-lg" asChild>
          <Link href="/login">
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </Button>
      </form>
    </div>
  );
}

function ResetPasswordSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
