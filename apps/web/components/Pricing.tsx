'use client';

import Link from 'next/link';
import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

export default function Pricing() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, (root) => {
    // Big parting line: each word rises behind a mask
    gsap.from('.cta-line > span', {
      yPercent: 110,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '.cta-line', start: 'top 80%' },
    });

    gsap.from('.cta-sub', {
      opacity: 0,
      y: 20,
      duration: 0.9,
      ease: 'expo.out',
      delay: 0.2,
      scrollTrigger: { trigger: '.cta-sub', start: 'top 80%' },
    });

    gsap.from('.cta-button', {
      opacity: 0,
      y: 16,
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '.cta-buttons', start: 'top 85%' },
    });

    gsap.from('.cta-strip-word', {
      yPercent: 110,
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.04,
      scrollTrigger: { trigger: '.cta-strip', start: 'top 85%' },
    });

    // Parallax the watermark
    gsap.to('.cta-watermark', {
      yPercent: -30,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });

  });

  return (
    <section
      id="pricing"
      ref={ref}
      className="relative py-32 md:py-44 px-6 md:px-12 border-t border-border-light overflow-hidden bg-bg-base"
    >
      {/* Faint background "vectorless." watermark */}
      <div
        aria-hidden
        className="cta-watermark absolute bottom-[-60px] left-1/2 -translate-x-1/2 font-display text-[180px] md:text-[320px] leading-none font-medium text-black/[0.03] select-none whitespace-nowrap pointer-events-none"
      >
        vectorless.
      </div>

      <div className="relative max-w-[1100px] mx-auto text-center">
        <span className="font-mid text-[12px] uppercase tracking-[0.22em] text-text-muted mb-6 block">
          The parting line
        </span>

        <h2 className="cta-line font-display text-[44px] md:text-[88px] font-medium leading-[1.02] tracking-[-0.025em] text-text-base mb-8 flex flex-wrap justify-center gap-x-3">
          {['Stop', 'searching.'].map((w) => (
            <span key={w} className="split-line inline-block overflow-hidden">
              <span className="inline-block">{w}</span>
            </span>
          ))}
        </h2>

        <h2 className="cta-line font-display text-[44px] md:text-[88px] font-medium leading-[1.02] tracking-[-0.025em] text-text-base mb-12 flex flex-wrap justify-center gap-x-3">
          {['Start', 'reasoning.'].map((w) => (
            <span key={w} className="split-line inline-block overflow-hidden">
              <span
                className={
                  w === 'reasoning.'
                    ? 'inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-primary-500 to-brand-pink'
                    : 'inline-block'
                }
              >
                {w}
              </span>
            </span>
          ))}
        </h2>

        <p className="cta-sub text-[17px] md:text-[19px] font-medium leading-[1.6] text-text-secondary max-w-[640px] mx-auto mb-12">
          Vectorless is in early access. If you&apos;re building anything serious with documents, RAG, or LLM retrieval — we want to meet you.
        </p>

        <div className="cta-buttons flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="cta-button group inline-flex items-center gap-2 bg-bg-dark text-white px-7 py-4 rounded-full text-[16px] font-medium hover:bg-black transition-colors shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)]"
          >
            Join early access
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="#how"
            className="cta-button inline-flex items-center gap-2 text-[16px] font-medium text-text-dark px-6 py-3.5 rounded-full hover:bg-black/5 transition-colors"
          >
            Read the docs
          </Link>
        </div>

        {/* Strip of repeating brand puns */}
        <div className="cta-strip marquee-mask mt-24 overflow-hidden">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[12px] uppercase tracking-[0.28em] text-text-muted font-data">
            {[
              'no chunks',
              '·',
              'no embeddings',
              '·',
              'no regrets',
              '·',
              'structure first',
              '·',
              'reasoning second',
              '·',
              'retrieval, solved',
            ].map((w, i) => (
              <span key={i} className="cta-strip-word inline-block">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
