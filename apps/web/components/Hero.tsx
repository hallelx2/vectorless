'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const INSTALL = 'npm i @vectorless/sdk';

export default function Hero() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, (root) => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    tl.from('.hero-chip', { y: 14, opacity: 0, duration: 0.8 })
      .from('.hero-line > span', { yPercent: 110, duration: 1.2, stagger: 0.08 }, '-=0.4')
      .from('.hero-sub', { y: 20, opacity: 0, duration: 0.9 }, '-=0.6')
      .from('.hero-cta > *', { y: 12, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.5')
      .from('.hero-install', { y: 12, opacity: 0, duration: 0.7 }, '-=0.4')
      .from('.hero-canvas', { opacity: 0, duration: 1.2 }, '-=1.0');

    gsap.fromTo(
      '.hero-stroke',
      { strokeDashoffset: 240 },
      { strokeDashoffset: 0, duration: 1.6, ease: 'expo.out', delay: 1.0, stagger: 0.12 }
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
      <div className="absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(20,86,240,0.10)_0%,rgba(234,94,193,0.05)_40%,transparent_70%)] blur-[40px] pointer-events-none" />

      <div className="hero-canvas relative w-full max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 text-left">
          <div className="hero-chip inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light bg-white/70 backdrop-blur-sm mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
            </span>
            <span className="font-data text-[11px] font-medium text-text-muted tracking-[0.16em] uppercase">
              Vectorless SDK · v1.0 · early access
            </span>
          </div>

          <h1 className="font-display text-[44px] sm:text-6xl md:text-[80px] font-medium leading-[0.98] tracking-[-0.03em] text-text-base mb-6">
            <span className="split-line hero-line">
              <span>Retrieval, without</span>
            </span>
            <span className="split-line hero-line">
              <span>the&nbsp;
                <span className="font-serif italic font-normal">vectors.</span>
              </span>
            </span>
            <span className="split-line hero-line relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-primary-500 to-brand-pink">
                For agents that read.
              </span>
            </span>

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

          <p className="hero-sub text-[17px] md:text-[19px] text-text-secondary leading-[1.55] max-w-[560px] mb-8">
            Vectorless is the retrieval primitive for AI agents. We turn your PDFs, docs, and knowledge bases into structured maps any LLM can navigate &mdash; <span className="text-text-base font-medium">no chunking, no embeddings, no vector DB to operate.</span>
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 bg-bg-dark text-white px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-black transition-colors"
            >
              Start building
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="https://github.com/hallelx2/vectorless"
              className="inline-flex items-center gap-2 text-[15px] font-medium text-text-dark px-5 py-3 rounded-full border border-border-gray hover:bg-black/[0.03] transition-colors"
            >
              <GithubIcon /> View on GitHub
            </Link>
          </div>

          <div className="hero-install">
            <InstallSnippet />
          </div>
        </div>

        <div className="lg:col-span-5 relative hidden lg:block">
          <HeroDocument />
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-data text-[10px] font-medium uppercase tracking-[0.28em] text-text-muted flex flex-col items-center gap-2">
        <span>Scroll the story</span>
        <span className="h-8 w-[1px] bg-gradient-to-b from-text-muted to-transparent" />
      </div>
    </section>
  );
}

function InstallSnippet() {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(INSTALL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      onClick={handleCopy}
      className="group inline-flex items-center gap-3 rounded-xl border border-border-gray bg-bg-dark text-white px-4 py-3 font-data text-[13px] hover:border-text-muted transition-colors"
    >
      <span className="text-text-muted select-none">$</span>
      <span className="text-white">{INSTALL}</span>
      <span className="ml-2 text-text-muted group-hover:text-white transition-colors">
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </span>
    </button>
  );
}

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .96-.3 3.15 1.18a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.14-1.18 3.14-1.18.63 1.57.24 2.73.12 3.02.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56 4.56-1.52 7.85-5.83 7.85-10.9C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function HeroDocument() {
  return (
    <div className="hero-doc relative aspect-[3/4] w-full max-w-[420px] ml-auto">
      <div className="absolute inset-0 rounded-[28px] bg-white shadow-[0_30px_80px_-20px_rgba(20,86,240,0.20)] border border-border-light overflow-hidden">
        <div className="px-7 pt-7 pb-4 flex items-center justify-between border-b border-border-light/80">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-pink" />
            <span className="font-data text-[10px] uppercase tracking-[0.18em] text-text-muted">
              doc · 0x7f
            </span>
          </div>
          <span className="font-data text-[11px] text-text-muted">42 sections</span>
        </div>

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
              <span className="font-data text-[10px] text-text-muted w-5">{s.id}</span>
              <span className="text-[13px] font-medium text-text-dark min-w-[110px]">
                {s.label}
              </span>
              <span className={`h-[6px] rounded-full bg-border-gray ${s.cls}`} />
            </li>
          ))}
        </ul>

        <div className="absolute bottom-0 inset-x-0 px-7 py-4 border-t border-border-light/80 bg-white/90 backdrop-blur flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
          <span className="font-data text-[12px] text-text-secondary truncate">
            GET /doc/0x7f/section/04 → 200 OK · 41ms
          </span>
        </div>
      </div>

      <div className="absolute -right-3 top-10 rotate-[6deg] bg-bg-dark text-white px-3 py-1.5 rounded-full font-data text-[11px] font-medium shadow-lg">
        ~40ms · any LLM
      </div>
    </div>
  );
}
