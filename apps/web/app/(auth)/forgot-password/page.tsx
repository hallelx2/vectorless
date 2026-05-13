"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordValues) {
    try {
      await fetch("/api/auth/forget-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, redirectTo: "/reset-password" }),
      });
    } catch {
      // intentionally ignore — never confirm whether the address is on file
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-7">
        <div className="space-y-4">
          <div className="inline-flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="size-4" />
          </div>
          <header className="space-y-2">
            <h1 className="font-display text-[28px] md:text-[32px] font-medium leading-tight tracking-[-0.02em]">
              Check your inbox.
            </h1>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              If an account exists for that email, we&apos;ve sent a reset link.
              It expires in 1 hour.
            </p>
          </header>
        </div>

        <Button variant="outline" className="w-full h-10" asChild>
          <Link href="/login">
            <ArrowLeft className="size-3.5" />
            Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <h1 className="font-display text-[28px] md:text-[32px] font-medium leading-tight tracking-[-0.02em]">
          Reset your password.
        </h1>
        <p className="text-[14px] text-muted-foreground">
          We&apos;ll email you a link that lasts an hour.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px]">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@vectorless.dev"
            autoComplete="email"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-[12px] text-destructive">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      <p className="text-center text-[13px] text-muted-foreground">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
