'use client';

import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const QUOTES = [
  {
    quote:
      'I spent six months tuning a chunker so the retrieval would stop bisecting our clauses. Vectorless made that whole problem disappear in an afternoon.',
    name: 'Eze Onyekpere',
    role: 'Staff Engineer, Legal AI',
    initials: 'EO',
    tint: 'from-brand-blue to-primary-500',
  },
  {
    quote:
      'Reasoning over a table of contents is the obvious right answer in hindsight. I don\'t miss managing a vector DB.',
    name: 'Priya Sundaram',
    role: 'AI Lead, Clinical Research',
    initials: 'PS',
    tint: 'from-primary-500 to-brand-pink',
  },
  {
    quote:
      'Our agent\'s answers got noticeably better the day we swapped in Vectorless. Same prompts, same model, structured retrieval.',
    name: 'Marcus Le',
    role: 'Founder, dev-tools startup',
    initials: 'ML',
    tint: 'from-brand-pink to-brand-blue',
  },
];

export default function Testimonials() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, () => {
    gsap.from('.t-head > span', {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.t-head', start: 'top 85%' },
    });

    gsap.from('.t-card', {
      opacity: 0,
      y: 28,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '.t-grid', start: 'top 80%' },
    });
  });

  return (
    <section
      ref={ref}
      className="relative py-32 md:py-44 px-6 md:px-12 max-w-[1240px] mx-auto border-t border-border-light"
    >
      <span className="font-data text-[11px] uppercase tracking-[0.22em] text-text-muted mb-3 block">
        The early signal
      </span>
      <h2 className="t-head font-display text-[40px] md:text-[64px] font-medium leading-[1.04] tracking-[-0.025em] text-text-base mb-16 max-w-[900px]">
        <span className="split-line"><span>Built by people who got tired</span></span>
        <span className="split-line"><span>of tuning <span className="font-serif italic font-normal">chunkers.</span></span></span>
      </h2>

      <div className="t-grid grid grid-cols-1 md:grid-cols-3 gap-5">
        {QUOTES.map((q, i) => (
          <figure
            key={i}
            className="t-card group relative rounded-[20px] border border-border-light bg-white p-8 md:p-10 flex flex-col justify-between shadow-[0_15px_40px_-30px_rgba(20,86,240,0.20)] hover:shadow-[0_25px_60px_-25px_rgba(20,86,240,0.28)] transition-shadow"
          >
            <span aria-hidden className="absolute -top-3 left-7 font-serif text-[64px] leading-none text-brand-blue/20 select-none">&ldquo;</span>
            <blockquote className="text-[16px] md:text-[17px] leading-[1.55] text-text-secondary relative">
              {q.quote}
            </blockquote>
            <figcaption className="flex items-center gap-3 mt-8 pt-6 border-t border-border-light">
              <span
                className={`h-10 w-10 rounded-full bg-gradient-to-br ${q.tint} text-white font-data text-[11px] font-medium flex items-center justify-center`}
                aria-hidden
              >
                {q.initials}
              </span>
              <div>
                <p className="text-[14px] font-medium text-text-dark">{q.name}</p>
                <p className="font-data text-[11px] text-text-muted uppercase tracking-[0.12em]">
                  {q.role}
                </p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
