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
        <div className="absolute inset-0 grid-paper-dark opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute -top-32 -left-20 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(20,86,240,0.20)_0%,rgba(234,94,193,0.10)_40%,transparent_70%)] blur-[60px]" />

        <Link href="/" className="relative z-10 inline-flex items-center gap-2 group">
          <span className="font-display text-[20px] font-medium tracking-tight">vectorless</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-pink transition-transform group-hover:scale-150" />
        </Link>

        <div className="relative z-10 space-y-8">
          <p className="font-data text-[10px] uppercase tracking-[0.28em] text-white/40">
            Retrieval, without the vectors
          </p>
          <h2 className="font-display text-[44px] xl:text-[56px] font-medium leading-[1.04] tracking-[-0.025em] max-w-[460px]">
            Documents your{" "}
            <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-pink">
              agent
            </span>{" "}
            can actually read.
          </h2>
          <p className="text-[15px] text-white/60 leading-[1.6] max-w-[420px]">
            Skip the chunker. Skip the embedder. Skip the vector DB. Vectorless turns any document into a structured map any LLM can reason over.
          </p>
        </div>

        <footer className="relative z-10 flex items-end justify-between">
          <div className="space-y-3">
            <blockquote className="text-[14px] text-white/70 italic leading-relaxed max-w-[360px]">
              &ldquo;Reasoning over a table of contents is the obvious right answer in hindsight. I don&apos;t miss managing a vector DB.&rdquo;
            </blockquote>
            <p className="font-data text-[10px] uppercase tracking-[0.2em] text-white/40">
              Priya S. · AI Lead, Clinical Research
            </p>
          </div>
        </footer>
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
