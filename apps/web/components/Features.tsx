'use client';

import SpotlightCard from './SpotlightCard';
import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const features = [
  {
    title: 'Structured ingest',
    desc:
      'PDFs, DOCX, TXT, URLs, raw text. We pull every section out as an addressable unit — automatically. No tuning, no overlap, no regret.',
    span: 'md:col-span-2',
    accent: 'from-brand-blue to-primary-500',
    badge: '→ doc',
    from: { x: -60, y: 20 },
  },
  {
    title: 'LLM-navigable maps',
    desc:
      'Every document becomes an llms.txt-style manifest — a map any model can read natively. Built so machines can think, not search.',
    span: 'md:col-span-1',
    accent: 'from-primary-500 to-brand-pink',
    badge: 'manifest',
    from: { x: 0, y: -60 },
  },
  {
    title: 'Parallel section fetching',
    desc: 'Fetch one section or twenty. Latency is the same. Fan-out retrieval without the fan-out tax.',
    span: 'md:col-span-1',
    accent: 'from-brand-pink to-brand-blue',
    badge: '|| fanout',
    from: { x: 60, y: 20 },
  },
  {
    title: 'Hybrid retrieval',
    desc:
      'Not every document is structured. Toggle embedding-based fallback alongside reasoning when you need it. We won\'t judge you for keeping a few vectors around.',
    span: 'md:col-span-1',
    accent: 'from-brand-blue to-brand-pink',
    badge: '⇄ hybrid',
    from: { x: -40, y: -20 },
  },
  {
    title: 'Deterministic links',
    desc: 'Every section gets a stable URL. Retrieval is auditable, reproducible, and grep-able. Citations come for free.',
    span: 'md:col-span-1',
    accent: 'from-primary-500 to-brand-blue',
    badge: '§ link',
    from: { x: 40, y: 20 },
  },
  {
    title: 'Any LLM, any framework',
    desc:
      'Vectorless is a primitive, not a platform lock-in. Drop it into LangGraph, CrewAI, LlamaIndex, an MCP server, or your own stack. We retrieve. You decide.',
    span: 'md:col-span-2',
    accent: 'from-brand-pink to-primary-500',
    badge: '⌘ open',
    from: { x: 60, y: -10 },
  },
  {
    title: 'Auto Table of Contents',
    desc:
      'No headings? We generate a semantic ToC with an LLM — structure from the unstructured. Even your messiest doc gets a spine.',
    span: 'md:col-span-1',
    accent: 'from-brand-blue to-primary-500',
    badge: '✎ toc',
    from: { x: -40, y: 40 },
  },
  {
    title: 'Postgres native',
    desc:
      'JSONB for maps, pgvector for fallback, full-text built in. One database. No vector infra to babysit, no separate cluster to forget about.',
    span: 'md:col-span-2',
    accent: 'from-primary-500 to-brand-pink',
    badge: '∎ pg',
    from: { x: 40, y: 30 },
  },
];

export default function Features() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, () => {
    gsap.utils.toArray<HTMLElement>('.bento-card').forEach((card) => {
      const from = JSON.parse(card.dataset.from || '{"x":0,"y":40}');
      gsap.from(card, {
        x: from.x,
        y: from.y,
        opacity: 0,
        rotate: from.x !== 0 ? (from.x > 0 ? 2 : -2) : 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
        },
      });
    });

    gsap.from('.bento-head > span', {
      yPercent: 110,
      duration: 1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.bento-head', start: 'top 85%' },
    });

  });

  return (
    <section
      ref={ref}
      className="relative py-32 md:py-44 px-6 md:px-12 max-w-[1240px] mx-auto border-t border-border-light"
    >
      <span className="font-mid text-[12px] uppercase tracking-[0.22em] text-text-muted mb-3 block">
        The toolkit
      </span>
      <h2 className="bento-head font-display text-[40px] md:text-[64px] font-medium leading-[1.04] tracking-[-0.02em] text-text-base mb-20 max-w-[900px]">
        <span className="split-line"><span>Everything retrieval</span></span>
        <span className="split-line"><span>should have been.</span></span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[minmax(220px,auto)]">
        {features.map((f, i) => (
          <div
            key={i}
            className={`bento-card ${f.span}`}
            data-from={JSON.stringify(f.from)}
          >
            <SpotlightCard className="h-full p-8 md:p-10 flex flex-col justify-between group relative overflow-hidden">
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${f.accent} opacity-90`} />

              <div className="flex items-center justify-between mb-5">
                <span className="text-[11px] font-data uppercase tracking-[0.18em] text-text-muted">
                  {f.badge}
                </span>
                <span className="text-[11px] font-data text-text-muted">0{i + 1}</span>
              </div>
              <div>
                <h3 className="font-display text-[24px] md:text-[28px] font-medium leading-[1.1] text-text-dark mb-3 group-hover:text-primary-600 transition-colors duration-300">
                  {f.title}
                </h3>
                <p className="text-[15px] leading-[1.55] text-text-secondary">{f.desc}</p>
              </div>
            </SpotlightCard>
          </div>
        ))}
      </div>
    </section>
  );
}
