'use client';

import Link from 'next/link';
import { ArrowRight, GitBranch, Route, ShieldCheck, Workflow } from 'lucide-react';

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .96-.3 3.15 1.18a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.14-1.18 3.14-1.18.63 1.57.24 2.73.12 3.02.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56 4.56-1.52 7.85-5.83 7.85-10.9C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
import { TreewalkMotif } from './treewalk-motif';
import HeroShader from '@/components/HeroShader';
import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

/** The real Vectorless mark — blue tile, white V stroke, pink focal dot. */
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
  const ref = useScopedRef<HTMLElement>();

  useGsapEffect(ref, (root) => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.from('.hero-mark', { y: 20, opacity: 0, duration: 0.8 })
      .from('.hero-chip', { y: 14, opacity: 0, duration: 0.8 }, '-=0.4')
      .from('.hero-line > span', { yPercent: 110, duration: 1.2, stagger: 0.1 }, '-=0.6')
      .from('.hero-sub', { y: 20, opacity: 0, duration: 0.9 }, '-=0.8')
      .from('.hero-cta > *', { y: 12, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.6')
      .from('.hero-terminal', { y: 20, opacity: 0, duration: 1.2 }, '-=0.4');

    gsap.fromTo(
      '.hero-stroke',
      { strokeDashoffset: 240 },
      { strokeDashoffset: 0, duration: 1.6, ease: 'expo.out', delay: 1.0, stagger: 0.15 }
    );
  });

  return (
    <main ref={ref} className="relative flex-1 overflow-hidden">
      {/* ============ Hero ============ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <HeroShader />
        <div className="absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />

        <div className="hero-mark relative z-10">
          <VectorlessMark size={64} />
        </div>

        <div className="hero-chip relative z-10 mt-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-vl-hairline bg-white/70 backdrop-blur-sm shadow-sm">
          <span className="size-1.5 rounded-full bg-vl-blue animate-pulse" />
          <span className="vl-mono-eyebrow !text-[10px] !text-vl-ink">Reasoning-based retrieval</span>
        </div>

        <h1 className="hero-title relative z-10 mt-8 font-display text-4xl sm:text-6xl md:text-[80px] font-semibold leading-[1.02] tracking-[-0.03em] text-vl-ink max-w-5xl">
          <span className="split-line hero-line">
            <span>Document retrieval for</span>
          </span>
          <span className="split-line hero-line">
            <span>the <span className="vl-serif font-normal vl-grad-text">reasoning era.</span></span>
          </span>

          <svg
            aria-hidden
            viewBox="0 0 520 36"
            className="absolute left-1/2 -bottom-4 -translate-x-1/2 w-[60%] max-w-[400px] h-[24px] pointer-events-none"
          >
            <path
              d="M4 22 C 120 6, 260 6, 514 18"
              fill="none"
              stroke="#1456f0"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="240"
              className="hero-stroke"
            />
          </svg>
        </h1>

        <p className="hero-sub relative z-10 mt-10 max-w-2xl text-[17px] md:text-[19px] font-light leading-relaxed text-vl-secondary">
          No chunking. No embeddings. No vector DB. Vectorless parses documents into structured maps any LLM can navigate — <span className="text-vl-ink font-medium">precision retrieval with citations you can trust.</span>
        </p>

        <div className="hero-cta relative z-10 mt-12 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/docs"
            className="group relative inline-flex items-center gap-3 bg-vl-ink text-white pl-7 pr-3 py-3 rounded-full text-[15px] font-medium transition hover:bg-black"
          >
            <span className="text-roll">
              <span className="text-roll-inner">
                <span>Start building</span>
                <span>Start building</span>
              </span>
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <ArrowRight className="h-4 w-4 text-vl-ink transition-transform group-hover:-rotate-45" />
            </span>
          </Link>
          <Link
            href="https://github.com/hallelx2/vectorless"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-vl-ink px-6 py-3.5 rounded-full border border-vl-hairline bg-white/50 backdrop-blur-sm hover:bg-white transition-colors"
          >
            <GithubIcon /> View on GitHub
          </Link>
        </div>

        {/* quickstart — dark inset terminal */}
        <div className="hero-terminal relative z-10 mx-auto mt-20 w-full max-w-xl overflow-hidden rounded-2xl border border-black/10 bg-vl-ink text-left shadow-2xl shadow-black/20">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
            <div className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-vl-pink/80" />
              <span className="size-2.5 rounded-full bg-primary-500/80" />
              <span className="size-2.5 rounded-full bg-white/20" />
            </div>
            <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
              quickstart · sdk
            </span>
          </div>
          <pre className="overflow-x-auto p-6 font-mono text-[13px] leading-relaxed text-white/90">
            <code>
              <span className="text-white/40">// 1. Install</span>{'\n'}
              <span className="text-primary-500">npm</span> i @vectorless/sdk{'\n\n'}
              <span className="text-white/40">// 2. Ask with citations</span>{'\n'}
              <span className="text-vl-pink">const</span> {'{'} answer, citations {'}'} = <span className="text-primary-500">await</span> vl.<span className="text-primary-500">ask</span>(doc, <span className="text-vl-pink">&quot;what changed?&quot;</span>)
            </code>
          </pre>
        </div>
      </section>

      {/* ============ Motif ============ */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
        <div className="rounded-[32px] border border-vl-hairline bg-white/40 backdrop-blur-sm p-8 sm:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="vl-mono-eyebrow mb-6">The shape of an answer</div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
                One document, parsed into structure, walked to the node.
              </h2>
              <p className="mt-6 text-lg font-light text-vl-secondary leading-relaxed">
                We don&apos;t guess similarity. We reason through your document&apos;s actual hierarchy to find the exact branch where the truth lives.
              </p>
              <div className="mt-10 flex gap-10">
                <div>
                  <div className="text-3xl font-semibold text-vl-ink">100%</div>
                  <div className="vl-mono-eyebrow mt-1 text-[10px]">Citation accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-vl-ink">~40ms</div>
                  <div className="vl-mono-eyebrow mt-1 text-[10px]">Retrieval speed</div>
                </div>
              </div>
            </div>
            <div className="relative aspect-square lg:aspect-auto lg:h-[400px]">
              <TreewalkMotif />
            </div>
          </div>
        </div>
      </section>

      {/* ============ Features ============ */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <div className="vl-mono-eyebrow">The Primitive</div>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Retrieval, rebuilt around reasoning
            </h2>
          </div>
          <Link href="/docs" className="text-sm font-medium text-vl-blue hover:underline flex items-center gap-2">
            Explore the core concepts <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="group relative bg-white border border-vl-hairline p-10 rounded-[24px] transition-all hover:shadow-[0_20px_40px_-15px_rgba(20,86,240,0.1)] hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-vl-canvas border border-vl-hairline transition-colors group-hover:border-vl-blue/30 group-hover:bg-white">
                  <Icon className="size-6 text-vl-blue" />
                </span>
                <span className="font-mono text-[11px] text-vl-muted opacity-50 tracking-widest">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-8 text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-4 text-[15px] font-light leading-relaxed text-vl-secondary">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ Thesis Closer ============ */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 py-32 text-center">
        <div className="h-px w-24 bg-vl-hairline mx-auto mb-16" />
        <figure className="max-w-3xl mx-auto">
          <blockquote className="text-3xl font-light leading-tight tracking-tight text-vl-ink sm:text-[3.5rem]">
            Retrieval stopped being a search problem. It became a{' '}
            <span className="vl-serif font-normal text-vl-ink italic">reasoning problem.</span>
          </blockquote>
          <figcaption className="vl-mono-eyebrow mt-12">The Vectorless thesis</figcaption>
        </figure>

        <div className="mt-20 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/docs"
            className="group relative inline-flex items-center gap-3 bg-vl-ink text-white px-8 py-4 rounded-full text-[16px] font-medium transition hover:bg-black"
          >
            Get started with Vectorless
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-vl-hairline py-12 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <VectorlessMark size={32} />
            <span className="font-semibold tracking-tight">Vectorless</span>
          </div>
          <div className="flex gap-8">
            <Link href="/docs" className="text-sm text-vl-muted hover:text-vl-ink">Documentation</Link>
            <Link href="https://github.com/hallelx2/vectorless" className="text-sm text-vl-muted hover:text-vl-ink">GitHub</Link>
            <Link href="#" className="text-sm text-vl-muted hover:text-vl-ink">Status</Link>
          </div>
          <div className="text-[11px] font-mono text-vl-muted uppercase tracking-widest">
            © 2026 Vectorless Systems
          </div>
        </div>
      </footer>
    </main>
  );
}
