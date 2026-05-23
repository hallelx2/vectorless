"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";

import { signUp } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Premium filled-to-outline input treatment (matches LoginForm). */
const AUTH_INPUT =
  "h-11 rounded-lg border-transparent bg-secondary/40 shadow-none transition-all duration-200 placeholder:text-muted-foreground/70 focus-visible:bg-background focus-visible:border-primary/40 focus-visible:ring-4 focus-visible:ring-primary/10";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
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

type RegisterFormValues = z.infer<typeof registerSchema>;

const STRENGTH_CHECKS = [
  { label: "8+ characters", test: (s: string) => s.length >= 8 },
  { label: "An uppercase letter", test: (s: string) => /[A-Z]/.test(s) },
  { label: "A number", test: (s: string) => /[0-9]/.test(s) },
];

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password") ?? "";

  async function onSubmit(data: RegisterFormValues) {
    setError(null);
    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-[13px]">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your full name"
          autoComplete="name"
          className={AUTH_INPUT}
          {...register("name")}
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-[12px] text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-[13px]">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@vectorless.dev"
          autoComplete="email"
          className={AUTH_INPUT}
          {...register("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-[12px] text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-[13px]">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Pick something strong"
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
        {password.length > 0 && (
          <ul className="grid grid-cols-3 gap-1.5 pt-1">
            {STRENGTH_CHECKS.map((c) => {
              const ok = c.test(password);
              return (
                <li
                  key={c.label}
                  className={`flex items-center gap-1 font-data text-[10px] uppercase tracking-[0.08em] ${
                    ok ? "text-emerald-600" : "text-muted-foreground"
                  }`}
                >
                  <Check className={`size-3 ${ok ? "opacity-100" : "opacity-30"}`} />
                  {c.label}
                </li>
              );
            })}
          </ul>
        )}
        {errors.password && <p className="text-[12px] text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-[13px]">Confirm password</Label>
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

      <Button
        type="submit"
        className="group w-full h-11 rounded-lg shadow-sm transition-all hover:shadow-md"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating workspace…
          </>
        ) : (
          <>
            Create workspace
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </>
        )}
      </Button>

      <p className="text-center font-data text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-1">
        By signing up you accept our terms &amp; privacy policy
      </p>
    </form>
  );
}
