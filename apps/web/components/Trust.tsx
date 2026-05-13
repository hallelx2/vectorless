'use client';

import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const STACKS = [
  { name: 'OpenAI', glyph: '◎' },
  { name: 'Anthropic', glyph: '✦' },
  { name: 'Gemini', glyph: '◇' },
  { name: 'LangGraph', glyph: '⌖' },
  { name: 'LlamaIndex', glyph: '🦙' },
  { name: 'CrewAI', glyph: '◈' },
  { name: 'MCP', glyph: '↯' },
  { name: 'Cursor', glyph: '⌘' },
  { name: 'Vercel', glyph: '▲' },
];

const METRICS = [
  { label: 'avg retrieval', value: '~40ms', sub: 'parallel section fetch' },
  { label: 'embedding cost', value: '$0', sub: 'we never compute one' },
  { label: 'chunks tuned', value: '0', sub: 'no overlap, no regret' },
  { label: 'works with', value: 'any LLM', sub: 'OpenAI, Anthropic, Gemini, local' },
];

export default function Trust() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, () => {
    gsap.from('.trust-metric', {
      opacity: 0,
      y: 20,
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '.trust-metrics', start: 'top 85%' },
    });

    gsap.from('.trust-chip', {
      opacity: 0,
      y: 10,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.03,
      scrollTrigger: { trigger: '.trust-belt', start: 'top 85%' },
    });
  });

  return (
    <section
      ref={ref}
      className="relative border-y border-border-light bg-bg-base/40 backdrop-blur-sm"
    >
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 py-10 md:py-14">
        {/* Metrics — the credibility strip */}
        <div className="trust-metrics grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 border-b border-border-light pb-10 mb-10">
          {METRICS.map((m) => (
            <div key={m.label} className="trust-metric">
              <p className="font-data text-[10px] uppercase tracking-[0.22em] text-text-muted mb-2">
                {m.label}
              </p>
              <p className="font-display text-[28px] md:text-[36px] leading-none font-medium text-text-dark mb-2 tracking-[-0.02em]">
                {m.value}
              </p>
              <p className="text-[12px] text-text-secondary">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Integrations belt */}
        <div className="trust-belt flex flex-col md:flex-row md:items-center md:gap-10 gap-6">
          <p className="font-data text-[10px] uppercase tracking-[0.24em] text-text-muted whitespace-nowrap">
            Fits in your stack
          </p>
          <div className="flex flex-wrap items-center gap-2.5 md:gap-3">
            {STACKS.map((s) => (
              <span
                key={s.name}
                className="trust-chip inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-border-light bg-white text-text-secondary hover:text-text-dark hover:border-border-gray transition-colors"
              >
                <span className="text-[14px] leading-none">{s.glyph}</span>
                <span className="text-[13px] font-medium">{s.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
