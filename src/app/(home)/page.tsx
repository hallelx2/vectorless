import Link from 'next/link';
import { ArrowRight, GitBranch, Route, ShieldCheck, Workflow } from 'lucide-react';
import { TreewalkMotif } from './treewalk-motif';

export const metadata = {
  title: 'Vectorless — Document retrieval for the reasoning era',
};

/** The real Vectorless mark — blue tile, white V stroke, pink focal dot.
 *  Matches src/lib/layout.shared.tsx & app/icon.tsx. Never a new mark. */
function VectorlessMark({ size = 56 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <rect width="24" height="24" rx="6" fill="#1456F0" />
      <path
        d="M6 6 L12 18 L18 6"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="18" r="1.8" fill="#EA5EC1" />
    </svg>
  );
}

const features = [
  {
    icon: GitBranch,
    title: 'Tree, not chunks',
    body: 'Vectorless parses a document into a hierarchical tree that preserves its real structure — sections, sub-sections, tables. No fixed-size chunking, no lost context.',
  },
  {
    icon: Route,
    title: 'treewalk navigation',
    body: 'An LLM agent walks the tree node by node, reasoning about where the answer lives. Retrieval becomes a navigation problem, not a nearest-neighbor lottery.',
  },
  {
    icon: ShieldCheck,
    title: 'Citations by construction',
    body: 'Every answer traces back to the exact nodes it came from. Path-correct citations are a property of the engine, not a bolt-on afterthought.',
  },
  {
    icon: Workflow,
    title: 'No vector DB to run',
    body: 'No embeddings to compute, no index to maintain, no similarity threshold to tune. Point Vectorless at a document and ask.',
  },
];

const steps = [
  {
    k: '01',
    title: 'Parse',
    body: 'The document is read into a hierarchical tree — its real headings, sections, and tables, preserved exactly.',
  },
  {
    k: '02',
    title: 'Walk',
    body: 'An agent reasons down the tree, opening only the branches that could hold the answer. No similarity guessing.',
  },
  {
    k: '03',
    title: 'Cite',
    body: 'The answer comes back bound to the exact nodes it was drawn from — a path you can verify, not a vibe.',
  },
];

export default function HomePage() {
  return (
    <main className="relative flex-1">
      {/* ============ Hero ============ */}
      <section className="relative mx-auto w-full max-w-5xl px-6 pb-12 pt-20 text-center sm:pt-28">
        {/* Very faint brand grid — hero only, fades to clean canvas. */}
        <div className="vl-hero-grid" aria-hidden />

        <div className="vl-reveal flex justify-center" style={{ ['--vl-delay' as string]: '0s' }}>
          <VectorlessMark />
        </div>

        <span
          className="vl-mono-eyebrow vl-reveal mt-7 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-4 py-1.5"
          style={{ ['--vl-delay' as string]: '0.08s' }}
        >
          <span className="size-1.5 rounded-full bg-[var(--vl-blue)]" />
          Reasoning-based retrieval
        </span>

        <h1
          className="vl-reveal mt-7 text-balance text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl"
          style={{ ['--vl-delay' as string]: '0.16s' }}
        >
          Document retrieval for the{' '}
          <span className="vl-serif vl-grad-text font-normal">reasoning era</span>
        </h1>

        <p
          className="vl-reveal mx-auto mt-6 max-w-2xl text-pretty text-base font-light leading-relaxed text-fd-muted-foreground sm:text-lg"
          style={{ ['--vl-delay' as string]: '0.24s' }}
        >
          No chunking. No embeddings. No vector DB. Vectorless parses a document
          into a tree, an LLM agent navigates it, and returns answers with
          citations you can trust.
        </p>

        <div
          className="vl-reveal mt-9 flex flex-wrap items-center justify-center gap-3"
          style={{ ['--vl-delay' as string]: '0.32s' }}
        >
          <Link
            href="/docs"
            className="group inline-flex items-center gap-2 rounded-full bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
          >
            Get started
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/docs/concepts/treewalk"
            className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium transition hover:bg-fd-accent"
          >
            How treewalk works
          </Link>
        </div>

        {/* quickstart — dark inset terminal (the one sanctioned dark surface) */}
        <div
          className="vl-reveal mx-auto mt-12 max-w-xl overflow-hidden rounded-xl border border-black/10 bg-[var(--vl-ink)] text-left shadow-2xl shadow-black/15"
          style={{ ['--vl-delay' as string]: '0.42s' }}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-[var(--vl-pink)]/80" />
            <span className="size-2.5 rounded-full bg-[var(--vl-blue-2)]/80" />
            <span className="size-2.5 rounded-full bg-white/30" />
            <span className="ml-2 font-mono text-xs uppercase tracking-[0.16em] text-white/40">
              quickstart
            </span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed text-white/90">
            <code>
              <span className="text-white/40"># install the SDK</span>
              {'\n'}npm i @vectorless/sdk{'\n\n'}
              <span className="text-white/40"># ask a document a question</span>
              {'\n'}vl.<span className="text-[var(--vl-blue-2)]">ask</span>(doc,{' '}
              <span className="text-[var(--vl-pink)]">&quot;what changed in Q3?&quot;</span>)
            </code>
          </pre>
        </div>
      </section>

      {/* ============ Motif: document → tree → cited answer ============ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-4 pt-8">
        <div className="rounded-2xl border border-fd-border bg-fd-card px-4 py-8 sm:px-10 sm:py-10">
          <div className="vl-mono-eyebrow mb-2 text-center">The shape of an answer</div>
          <p className="mx-auto mb-6 max-w-md text-center text-sm font-light text-fd-muted-foreground">
            One document, parsed into structure, walked to the exact node — and
            handed back as a citation.
          </p>
          <div className="mx-auto max-w-3xl">
            <TreewalkMotif />
          </div>
        </div>
      </section>

      {/* ============ Features ============ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-4 pt-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="vl-mono-eyebrow">Why it works</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Retrieval, rebuilt around reasoning
            </h2>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-fd-border bg-fd-border sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="group relative bg-fd-background p-7 transition-colors hover:bg-fd-muted"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-11 items-center justify-center rounded-xl border border-fd-border bg-fd-card transition-colors group-hover:border-[var(--vl-blue)]/30">
                  <Icon className="size-5 text-[var(--vl-blue)]" />
                </span>
                <span className="vl-index">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-fd-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ How it works — three steps ============ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-4 pt-16">
        <div className="vl-mono-eyebrow mb-8 text-center">Parse · Walk · Cite</div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-fd-border bg-fd-border sm:grid-cols-3">
          {steps.map(({ k, title, body }) => (
            <div key={k} className="bg-fd-background p-7">
              <div className="vl-index">{k}</div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-fd-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Thesis closer ============ */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-24 pt-20">
        <div className="vl-rule mx-auto max-w-2xl" />
        <figure className="mx-auto mt-12 max-w-2xl text-center">
          <blockquote className="text-2xl font-light leading-snug tracking-tight text-fd-foreground sm:text-[2rem] sm:leading-[1.2]">
            Retrieval stopped being a search problem. It became a{' '}
            <span className="vl-serif font-normal text-fd-foreground">reasoning problem.</span>
          </blockquote>
          <figcaption className="vl-mono-eyebrow mt-6">The Vectorless thesis</figcaption>
        </figure>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs"
            className="group inline-flex items-center gap-2 rounded-full bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition hover:opacity-90"
          >
            Read the docs
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="https://github.com/hallelx2/vectorless-docs"
            className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-medium transition hover:bg-fd-accent"
          >
            View on GitHub
          </Link>
        </div>
      </section>
    </main>
  );
}
