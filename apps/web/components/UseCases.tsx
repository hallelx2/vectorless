'use client';

import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const CASES = [
  {
    tag: 'Research',
    title: 'Papers that answer back.',
    desc: 'Query across literature libraries, systematic reviews, and supplementary appendices with precision that "nearest neighbour" can\'t even imagine.',
    sections: ['Abstract', 'Methods', 'Results', 'Discussion', 'References'],
    doc: 'preprint.pdf',
    badge: '§ 187 pp',
    color: 'from-brand-blue to-primary-500',
  },
  {
    tag: 'Legal',
    title: 'Contracts that hold their shape.',
    desc: 'Clauses are units. Sub-clauses are units. Vectorless retrieves whole, intact context — no clause torn in half by an arbitrary chunk size.',
    sections: ['Definitions', 'Term', 'Indemnity', 'Termination', 'Governing Law'],
    doc: 'MSA-v3.docx',
    badge: '§ clauses',
    color: 'from-primary-500 to-brand-pink',
  },
  {
    tag: 'Clinical',
    title: 'Guidelines without guesswork.',
    desc: 'Dosing tables, contraindications, decision trees — retrieved as complete sections, not bisected fragments. Patient safety, not similarity scores.',
    sections: ['Indications', 'Dosing', 'Contraindications', 'Warnings', 'Adverse Effects'],
    doc: 'protocol-2026.pdf',
    badge: 'rx',
    color: 'from-brand-pink to-brand-blue',
  },
  {
    tag: 'Technical docs',
    title: 'APIs your agent can actually read.',
    desc: 'Endpoints, parameters, error codes — structured the way developers already think, addressable the way LLMs already navigate.',
    sections: ['Auth', 'Endpoints', 'Parameters', 'Errors', 'Webhooks'],
    doc: 'reference.md',
    badge: 'api',
    color: 'from-brand-blue to-brand-pink',
  },
  {
    tag: 'Enterprise',
    title: 'Wikis with working memory.',
    desc: 'Internal SOPs, onboarding handbooks, runbooks — every section addressable, every retrieval auditable, every answer traceable.',
    sections: ['Onboarding', 'Security', 'Engineering', 'HR', 'Finance'],
    doc: 'handbook.notion',
    badge: 'kb',
    color: 'from-primary-500 to-brand-blue',
  },
];

export default function UseCases() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, () => {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      const panels = gsap.utils.toArray<HTMLElement>('.uc-panel');
      const docs = gsap.utils.toArray<HTMLElement>('.uc-doc');
      const total = panels.length;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.uc-stage',
          start: 'top top',
          end: `+=${total * 600}`,
          scrub: 0.6,
          pin: true,
        },
      });

      panels.forEach((panel, i) => {
        if (i === 0) return;
        const prev = panels[i - 1];
        const prevDoc = docs[i - 1];
        const nextDoc = docs[i];

        tl.to(prev, { opacity: 0, y: -40, duration: 1 }, `+=0.4`)
          .to(prevDoc, { opacity: 0, scale: 0.94, duration: 1 }, '<')
          .to(panel, { opacity: 1, y: 0, duration: 1 }, '<')
          .to(nextDoc, { opacity: 1, scale: 1, duration: 1 }, '<');
      });

      // Progress indicator
      gsap.to('.uc-progress-fill', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.uc-stage',
          start: 'top top',
          end: `+=${total * 600}`,
          scrub: 0.4,
        },
      });
    });

  });

  return (
    <section
      ref={ref}
      className="relative bg-bg-base border-t border-border-light"
    >
      {/* Header */}
      <div className="max-w-[1240px] mx-auto px-6 md:px-12 pt-32 md:pt-44">
        <span className="font-mid text-[12px] uppercase tracking-[0.22em] text-text-muted mb-3 block">
          The audiences
        </span>
        <h2 className="font-display text-[40px] md:text-[64px] font-medium leading-[1.04] tracking-[-0.02em] text-text-base max-w-[900px]">
          Built for documents{' '}
          <span className="text-text-muted">that actually matter.</span>
        </h2>
      </div>

      <div className="uc-stage relative min-h-[100vh] flex items-center pt-12 pb-24">
        <div className="w-full max-w-[1240px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left — stacked panels */}
          <div className="lg:col-span-6 relative min-h-[460px]">
            {CASES.map((c, i) => (
              <article
                key={c.tag}
                className={`uc-panel absolute inset-0 ${i === 0 ? '' : 'opacity-0 translate-y-10'}`}
              >
                <div className="font-data text-[11px] uppercase tracking-[0.22em] text-text-muted mb-3">
                  {String(i + 1).padStart(2, '0')} / {String(CASES.length).padStart(2, '0')} · {c.tag}
                </div>
                <h3 className="font-display text-[36px] md:text-[54px] font-medium leading-[1.04] tracking-[-0.02em] text-text-base mb-6">
                  {c.title}
                </h3>
                <p className="text-[17px] leading-[1.6] text-text-secondary max-w-[520px] mb-7">
                  {c.desc}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {c.sections.map((s) => (
                    <li
                      key={s}
                      className="font-data text-[12px] px-3 py-1.5 rounded-full bg-white border border-border-light text-text-secondary"
                    >
                      § {s}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {/* Right — stacked document mocks */}
          <div className="lg:col-span-6 relative aspect-[4/5] max-w-[480px] ml-auto w-full">
            {CASES.map((c, i) => (
              <div
                key={c.tag}
                className={`uc-doc absolute inset-0 ${i === 0 ? '' : 'opacity-0 scale-95'}`}
              >
                <div className="relative h-full rounded-[28px] bg-white border border-border-light shadow-[0_30px_80px_-30px_rgba(20,86,240,0.20)] overflow-hidden p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full bg-gradient-to-r ${c.color}`} />
                      <span className="font-data text-[11px] uppercase tracking-[0.18em] text-text-muted">
                        {c.doc}
                      </span>
                    </div>
                    <span className="font-data text-[11px] text-text-muted">{c.badge}</span>
                  </div>

                  <div className={`h-1 w-full bg-gradient-to-r ${c.color} rounded-full mb-6 opacity-80`} />

                  <ul className="space-y-3.5">
                    {c.sections.map((s, idx) => (
                      <li key={s} className="flex items-center gap-3">
                        <span className="font-data text-[10px] text-text-muted w-5">
                          0{idx + 1}
                        </span>
                        <span className="font-mid text-[13px] font-medium text-text-dark min-w-[110px]">
                          {s}
                        </span>
                        <span
                          className="flex-1 h-[6px] rounded-full bg-border-gray/80"
                          style={{ maxWidth: `${50 + ((idx * 17) % 40)}%` }}
                        />
                      </li>
                    ))}
                  </ul>

                  <div className="absolute bottom-0 inset-x-0 px-6 py-3.5 border-t border-border-light/70 bg-white/95 backdrop-blur flex items-center justify-between">
                    <span className="font-data text-[11px] text-text-secondary truncate">
                      GET /doc/{c.tag.toLowerCase()}/§04
                    </span>
                    <span className="font-data text-[11px] text-primary-500">200 OK</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[260px] h-[3px] bg-border-light rounded-full overflow-hidden">
          <div className="uc-progress-fill h-full w-full bg-gradient-to-r from-brand-blue to-brand-pink origin-left scale-x-0" />
        </div>
      </div>
    </section>
  );
}
