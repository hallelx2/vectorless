import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

export const metadata = {
  title: "Sign in · Vectorless",
};

export default function LoginPage() {
  return (
    <div className="space-y-7">
      <header className="space-y-2">
        <h1 className="font-display text-[28px] md:text-[32px] font-medium leading-tight tracking-[-0.02em]">
          Welcome back.
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Sign in to your Vectorless workspace.
        </p>
      </header>

      <SocialLoginButtons />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 font-data text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Or with email
          </span>
        </div>
      </div>

      <LoginForm />

      <p className="text-center text-[13px] text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Start free
        </Link>
      </p>
    </div>
  );
}
