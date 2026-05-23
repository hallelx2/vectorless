import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full lg:grid lg:grid-cols-2 bg-background">
      {/* LEFT — brand showcase (hidden on mobile) */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[#0a0a0a] text-white p-10">
        {/* Ambient drifting glows — calm, living background */}
        <div className="pointer-events-none absolute -top-40 -left-24 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(20,86,240,0.28)_0%,rgba(20,86,240,0.10)_38%,transparent_70%)] blur-[70px] auth-glow-a" />
        <div className="pointer-events-none absolute -bottom-48 -right-24 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(234,94,193,0.22)_0%,rgba(234,94,193,0.08)_40%,transparent_72%)] blur-[80px] auth-glow-b" />
        <div className="absolute inset-0 grid-paper-dark opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        {/* Hairline top sheen for a crafted edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <Link href="/" className="auth-rise relative z-10 inline-flex items-center gap-2 group">
          <span className="font-display text-[20px] font-medium tracking-tight">vectorless</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-pink transition-transform duration-300 group-hover:scale-150" />
        </Link>

        <div className="relative z-10 space-y-8">
          <p className="auth-rise auth-d1 font-data text-[10px] uppercase tracking-[0.28em] text-white/40">
            Retrieval, without the vectors
          </p>
          <h2 className="auth-rise auth-d2 font-display text-[44px] xl:text-[56px] font-medium leading-[1.04] tracking-[-0.025em] max-w-[460px]">
            Documents your{" "}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-pink">
              agent
            </span>{" "}
            can actually read.
          </h2>
          <p className="auth-rise auth-d3 text-[15px] text-white/60 leading-[1.6] max-w-[420px]">
            Skip the chunker. Skip the embedder. Skip the vector DB. Vectorless turns any document into a structured map any LLM can reason over.
          </p>
        </div>

        <div className="auth-rise auth-d4 relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="text-[14px] text-white/70 italic leading-relaxed max-w-[360px]">
              &ldquo;Reasoning over a table of contents is the obvious right answer in hindsight. I don&apos;t miss managing a vector DB.&rdquo;
            </p>
            <footer className="font-data text-[10px] uppercase tracking-[0.2em] text-white/40">
              Priya S. · AI Lead, Clinical Research
            </footer>
          </blockquote>

          {/* Trust row — quiet, premium reassurance */}
          <div className="flex items-center gap-2 pt-1">
            {["SOC 2-ready", "Self-hostable", "MIT core"].map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-data text-[10px] uppercase tracking-[0.16em] text-white/45"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT — form */}
      <section className="relative flex flex-col p-6 sm:p-10 lg:p-12">
        {/* Mobile-only brand row */}
        <div className="lg:hidden mb-8 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="font-display text-[18px] font-medium tracking-tight">vectorless</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
          </Link>
        </div>

        {/* Desktop back link */}
        <div className="hidden lg:flex">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>

        <p className="font-data text-[10px] uppercase tracking-[0.18em] text-muted-foreground text-center">
          © 2026 Vectorless &nbsp;·&nbsp;{" "}
          <Link href="/" className="hover:text-foreground transition-colors">terms</Link>
          {" "}&nbsp;·&nbsp;{" "}
          <Link href="/" className="hover:text-foreground transition-colors">privacy</Link>
        </p>
      </section>
    </div>
  );
}
