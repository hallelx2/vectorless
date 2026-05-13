'use client';

import Link from 'next/link';
import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

export default function Hero() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, (root) => {
    // Reveal the eyebrow chip, then the lines one-by-one
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.from('.hero-chip', { y: 14, opacity: 0, duration: 0.8 })
      .from(
        '.hero-line > span',
        { yPercent: 110, duration: 1.2, stagger: 0.08 },
        '-=0.4'
      )
      .from('.hero-sub', { y: 20, opacity: 0, duration: 0.9 }, '-=0.6')
      .from('.hero-cta > *', { y: 12, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.5')
      .from('.hero-canvas', { opacity: 0, duration: 1.2 }, '-=1.0');

    gsap.fromTo(
      '.hero-stroke',
      { strokeDashoffset: 240 },
      {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: 'expo.out',
        delay: 1.2,
        stagger: 0.12,
      }
    );

    gsap.to('.hero-doc', {
      y: -10,
      duration: 4,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });

    gsap.to('.hero-canvas', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });
  });

  return (
    <section
      ref={ref}
      className="relative min-h-[100vh] pt-32 pb-24 px-6 md:px-12 overflow-hidden flex items-center"
    >
      {/* Paper grid + soft radial */}
      <div className="absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(20,86,240,0.10)_0%,rgba(234,94,193,0.05)_40%,transparent_70%)] blur-[40px] pointer-events-none" />

      <div className="hero-canvas relative w-full max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Copy */}
        <div className="lg:col-span-7 text-left">
          <div className="hero-chip inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light bg-white/70 backdrop-blur-sm mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span className="text-[12px] font-medium text-text-muted tracking-[0.14em] uppercase">
              Vectorless · the retrieval primitive for reasoning
            </span>
          </div>

          <h1 className="font-display text-[44px] sm:text-6xl md:text-[88px] font-medium leading-[0.98] tracking-[-0.02em] text-text-base mb-7">
            <span className="split-line hero-line">
              <span>Turn anything</span>
            </span>
            <span className="split-line hero-line">
              <span>into something</span>
            </span>
            <span className="split-line hero-line relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-primary-500 to-brand-pink">
                queryable.
              </span>
            </span>

            {/* Hand-drawn structural strokes under "queryable." */}
            <svg
              aria-hidden
              viewBox="0 0 520 36"
              className="absolute left-0 -bottom-2 w-[80%] max-w-[460px] h-[28px]"
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
              <path
                d="M16 30 C 140 18, 280 18, 502 28"
                fill="none"
                stroke="#ea5ec1"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="240"
                className="hero-stroke"
              />
            </svg>
          </h1>

          <p className="hero-sub text-[18px] md:text-[20px] font-medium text-text-secondary leading-[1.55] max-w-[560px] mb-10">
            We don&apos;t chunk your documents.{' '}
            <span className="text-text-dark">We read them.</span>{' '}
            We don&apos;t embed your meaning.{' '}
            <span className="text-text-dark">We map it.</span>{' '}
            Then any LLM reasons its way to the answer — no vectors needed.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 bg-bg-dark text-white px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-black transition-colors"
            >
              Get early access
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-text-dark px-5 py-3 rounded-full hover:bg-black/5 transition-colors"
            >
              See how it works
            </Link>
            <span className="text-[12px] text-text-muted ml-1 hidden md:inline">
              no credit card · no embeddings
            </span>
          </div>
        </div>

        {/* Right: a "document" that hints at structure-preserving retrieval */}
        <div className="lg:col-span-5 relative hidden lg:block">
          <HeroDocument />
        </div>
      </div>

      {/* Soft scroll cue */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-medium uppercase tracking-[0.25em] text-text-muted flex flex-col items-center gap-2">
        <span>Scroll the story</span>
        <span className="h-8 w-[1px] bg-gradient-to-b from-text-muted to-transparent" />
      </div>
    </section>
  );
}

function HeroDocument() {
  return (
    <div className="hero-doc relative aspect-[3/4] w-full max-w-[420px] ml-auto">
      <div className="absolute inset-0 rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(20,86,240,0.20)] border border-border-light overflow-hidden">
        {/* "Document" header */}
        <div className="px-7 pt-7 pb-4 flex items-center justify-between border-b border-border-light/80">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-pink" />
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
              doc · 0x7f
            </span>
          </div>
          <span className="text-[11px] text-text-muted font-data">42 sections</span>
        </div>

        {/* Section listing — each "section" has a stable ID, like the ToC manifest */}
        <ul className="px-7 py-6 space-y-3.5">
          {[
            { id: '01', label: 'Abstract', cls: 'w-[55%]' },
            { id: '02', label: 'Introduction', cls: 'w-[68%]' },
            { id: '03', label: 'Methods', cls: 'w-[40%]' },
            { id: '04', label: 'Results', cls: 'w-[72%]' },
            { id: '05', label: 'Discussion', cls: 'w-[58%]' },
            { id: '06', label: 'Conclusion', cls: 'w-[45%]' },
          ].map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <span className="text-[10px] font-data text-text-muted w-5">{s.id}</span>
              <span className="text-[13px] font-medium text-text-dark min-w-[110px]">
                {s.label}
              </span>
              <span className={`h-[6px] rounded-full bg-border-gray ${s.cls}`} />
            </li>
          ))}
        </ul>

        {/* Footer: section being "fetched" */}
        <div className="absolute bottom-0 inset-x-0 px-7 py-4 border-t border-border-light/80 bg-white/90 backdrop-blur flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="text-[12px] font-data text-text-secondary truncate">
            GET /doc/0x7f/section/04 → Results
          </span>
        </div>
      </div>

      {/* Floating tag */}
      <div className="absolute -right-3 top-10 rotate-[6deg] bg-bg-dark text-white px-3 py-1.5 rounded-full text-[11px] font-medium shadow-lg">
        no chunking · no embeddings
      </div>
    </div>
  );
}
