'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const TIERS = [
  {
    name: 'Hobby',
    tag: 'Free, forever',
    price: '$0',
    cadence: 'free up to 100 docs',
    desc: 'Everything you need to ship a real agent.',
    cta: 'Start free',
    href: '/register',
    highlight: false,
    features: [
      '100 documents',
      'Unlimited section fetches',
      'TypeScript + Python SDK',
      'Hybrid retrieval (BYO embeddings)',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    tag: 'For shipping teams',
    price: '$29',
    cadence: 'per seat / month',
    desc: 'Scale past prototype without paging an SRE.',
    cta: 'Start 14-day trial',
    href: '/register?plan=pro',
    highlight: true,
    features: [
      '10,000 documents',
      'Priority parallel fetch',
      'MCP server integration',
      'Document analytics + audit log',
      'Email support · 24h SLA',
    ],
  },
  {
    name: 'Enterprise',
    tag: 'For regulated work',
    price: 'Custom',
    cadence: 'talk to us',
    desc: 'SSO, on-prem, contracts, and people who pick up the phone.',
    cta: 'Contact sales',
    href: 'mailto:sales@vectorless.dev',
    highlight: false,
    features: [
      'Unlimited documents',
      'SSO + SCIM',
      'Self-hosted / VPC',
      'SOC 2 + DPA',
      'Dedicated Slack channel',
    ],
  },
];

export default function Pricing() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, (root) => {
    gsap.from('.price-head > span', {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.price-head', start: 'top 85%' },
    });

    gsap.fromTo(
      '.price-card',
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: '.price-grid',
          start: 'top bottom-=80',
          toggleActions: 'play none none none',
          once: true,
        },
      }
    );

    gsap.from('.cta-line > span', {
      yPercent: 110,
      duration: 1.2,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '.cta-line', start: 'top 85%' },
    });

    gsap.from('.cta-sub', {
      opacity: 0,
      y: 20,
      duration: 0.9,
      ease: 'expo.out',
      delay: 0.2,
      scrollTrigger: { trigger: '.cta-sub', start: 'top 85%' },
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
      {/* Pricing tiers */}
      <div className="relative max-w-[1240px] mx-auto mb-32 md:mb-44">
        <div className="text-center mb-16">
          <span className="font-data text-[11px] uppercase tracking-[0.22em] text-text-muted mb-3 block">
            Pricing
          </span>
          <h2 className="price-head font-display text-[40px] md:text-[64px] font-medium leading-[1.04] tracking-[-0.025em] text-text-base">
            <span className="split-line"><span>Free to start.</span></span>
            <span className="split-line"><span><span className="font-serif italic font-normal">Honest</span> as you scale.</span></span>
          </h2>
        </div>

        <div className="price-grid grid grid-cols-1 md:grid-cols-3 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`price-card relative rounded-[24px] p-8 md:p-10 flex flex-col transition-all ${
                tier.highlight
                  ? 'bg-bg-dark text-white border border-bg-dark shadow-[0_30px_80px_-20px_rgba(20,86,240,0.40)]'
                  : 'bg-white border border-border-light shadow-[0_15px_40px_-30px_rgba(20,86,240,0.15)]'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-blue to-brand-pink text-white px-3 py-1 rounded-full font-data text-[10px] uppercase tracking-[0.18em] font-medium">
                  Most popular
                </div>
              )}
              <div className="mb-7">
                <p className={`font-display text-[20px] font-medium tracking-[-0.01em] mb-1.5 ${tier.highlight ? 'text-white' : 'text-text-dark'}`}>
                  {tier.name}
                </p>
                <p className={`font-data text-[11px] uppercase tracking-[0.18em] ${tier.highlight ? 'text-white/50' : 'text-text-muted'}`}>
                  {tier.tag}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className={`font-display text-[44px] md:text-[52px] leading-none font-medium tracking-[-0.025em] ${tier.highlight ? 'text-white' : 'text-text-dark'}`}>
                    {tier.price}
                  </span>
                </div>
                <p className={`mt-2 text-[12px] ${tier.highlight ? 'text-white/60' : 'text-text-muted'}`}>
                  {tier.cadence}
                </p>
              </div>

              <p className={`text-[14px] leading-[1.55] mb-8 ${tier.highlight ? 'text-white/70' : 'text-text-secondary'}`}>
                {tier.desc}
              </p>

              <ul className="space-y-3 mb-10 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px]">
                    <Check
                      className={`w-4 h-4 mt-0.5 shrink-0 ${tier.highlight ? 'text-brand-pink' : 'text-primary-500'}`}
                    />
                    <span className={tier.highlight ? 'text-white/85' : 'text-text-secondary'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`inline-flex items-center justify-center gap-2 w-full py-3 rounded-full text-[14px] font-medium transition-colors ${
                  tier.highlight
                    ? 'bg-white text-bg-dark hover:bg-white/90'
                    : 'bg-bg-dark text-white hover:bg-black'
                }`}
              >
                {tier.cta}
                <span className="inline-block">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* The parting line — closing CTA */}
      <div
        aria-hidden
        className="cta-watermark absolute bottom-[-60px] left-1/2 -translate-x-1/2 font-display text-[180px] md:text-[320px] leading-none font-medium text-black/[0.03] select-none whitespace-nowrap pointer-events-none tracking-[-0.03em]"
      >
        vectorless.
      </div>

      <div className="relative max-w-[1100px] mx-auto text-center">
        <span className="font-data text-[11px] uppercase tracking-[0.22em] text-text-muted mb-6 block">
          The parting line
        </span>

        <h2 className="cta-line font-display text-[44px] md:text-[88px] font-medium leading-[1.02] tracking-[-0.03em] text-text-base mb-8 flex flex-wrap justify-center gap-x-3">
          {['Stop', 'searching.'].map((w) => (
            <span key={w} className="split-line inline-block overflow-hidden">
              <span className="inline-block">{w}</span>
            </span>
          ))}
        </h2>

        <h2 className="cta-line font-display text-[44px] md:text-[88px] font-medium leading-[1.02] tracking-[-0.03em] text-text-base mb-12 flex flex-wrap justify-center gap-x-3">
          {['Start', 'reasoning.'].map((w) => (
            <span key={w} className="split-line inline-block overflow-hidden">
              <span
                className={
                  w === 'reasoning.'
                    ? 'inline-block font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-primary-500 to-brand-pink'
                    : 'inline-block'
                }
              >
                {w}
              </span>
            </span>
          ))}
        </h2>

        <p className="cta-sub text-[17px] md:text-[19px] leading-[1.6] text-text-secondary max-w-[640px] mx-auto mb-12">
          Free for 100 documents. No credit card. Five lines of code from install to your first answer.
        </p>

        <div className="cta-buttons flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register"
            className="cta-button group inline-flex items-center gap-2 bg-bg-dark text-white px-7 py-4 rounded-full text-[16px] font-medium hover:bg-black transition-colors shadow-[0_20px_40px_-15px_rgba(0,0,0,0.25)]"
          >
            Start building free
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="https://github.com/hallelx2/vectorless"
            className="cta-button inline-flex items-center gap-2 text-[16px] font-medium text-text-dark px-6 py-3.5 rounded-full border border-border-gray hover:bg-black/[0.03] transition-colors"
          >
            <GithubIcon /> Star on GitHub
          </Link>
        </div>

        <div className="cta-strip marquee-mask mt-24 overflow-hidden">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 font-data text-[11px] uppercase tracking-[0.28em] text-text-muted">
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

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.9.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.45.11-3.02 0 0 .96-.3 3.15 1.18a10.96 10.96 0 0 1 5.74 0c2.19-1.48 3.14-1.18 3.14-1.18.63 1.57.24 2.73.12 3.02.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.68.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56 4.56-1.52 7.85-5.83 7.85-10.9C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
