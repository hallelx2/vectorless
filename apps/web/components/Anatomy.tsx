'use client';

import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const SECTIONS = [
  { id: '01', label: 'Abstract', y: '12%' },
  { id: '02', label: 'Introduction', y: '24%' },
  { id: '03', label: 'Methods', y: '38%' },
  { id: '04', label: 'Results', y: '54%' },
  { id: '05', label: 'Discussion', y: '70%' },
  { id: '06', label: 'Conclusion', y: '84%' },
];

export default function Anatomy() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, (root) => {
    // Animate the connecting paths drawing in
    gsap.fromTo(
      '.anatomy-line',
      { strokeDashoffset: 600 },
      {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: 'expo.inOut',
        stagger: 0.12,
        scrollTrigger: {
          trigger: root,
          start: 'top 70%',
        },
      }
    );

    // Highlight each section on the PDF with a stagger
    gsap.from('.anatomy-highlight', {
      opacity: 0,
      x: -10,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.12,
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 70%',
      },
    });

    // Manifest entries pop in on the right
    gsap.from('.anatomy-entry', {
      opacity: 0,
      x: 14,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 70%',
      },
    });

    // Subtle scroll-driven rotation of the connecting fan
    gsap.to('.anatomy-fan', {
      rotate: 4,
      ease: 'none',
      scrollTrigger: {
        trigger: root,
        start: 'top center',
        end: 'bottom top',
        scrub: 0.8,
      },
    });

    // Headline reveal
    gsap.from('.anatomy-head > span', {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.anatomy-head', start: 'top 80%' },
    });

  });

  return (
    <section
      ref={ref}
      className="relative py-32 md:py-44 px-6 md:px-12 overflow-hidden border-t border-border-light bg-bg-base"
    >
      <div className="max-w-[1240px] mx-auto">
        <span className="font-mid text-[12px] uppercase tracking-[0.22em] text-text-muted mb-3 block">
          The anatomy
        </span>
        <h2 className="anatomy-head font-display text-[40px] md:text-[64px] font-medium leading-[1.05] tracking-[-0.02em] text-text-base max-w-[900px] mb-6">
          <span className="split-line"><span>What your document</span></span>
          <span className="split-line"><span>becomes inside Vectorless.</span></span>
        </h2>
        <p className="text-[17px] text-text-secondary max-w-[620px] mb-20">
          Not a wall of vectors. A navigable map. Every section gets a stable address, a title, a summary, and a deterministic link any LLM can call.
        </p>

        <div className="anatomy-fan grid grid-cols-12 gap-6 items-stretch relative">
          {/* LEFT — the original PDF, with highlighted sections */}
          <div className="col-span-12 md:col-span-5 relative">
            <div className="relative rounded-[24px] bg-white border border-border-light shadow-[0_25px_60px_-30px_rgba(20,86,240,0.18)] aspect-[3/4] overflow-hidden">
              <div className="px-6 pt-6 pb-3 border-b border-border-light">
                <p className="font-display text-[14px] font-medium text-text-dark">
                  research.pdf
                </p>
                <p className="text-[10px] text-text-muted font-data">
                  42 sections · 187 pages
                </p>
              </div>

              {/* Faux page content */}
              <div className="absolute inset-x-6 top-20 bottom-6 space-y-2">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[6px] rounded-full bg-border-gray/80"
                    style={{ width: `${30 + ((i * 31) % 65)}%` }}
                  />
                ))}
              </div>

              {/* Highlight overlays for each section */}
              {SECTIONS.map((s) => (
                <div
                  key={s.id}
                  className="anatomy-highlight absolute left-3 right-3 h-7 rounded-md border border-primary-500/40 bg-primary-500/10 flex items-center px-3"
                  style={{ top: s.y }}
                >
                  <span className="font-data text-[10px] text-primary-600 font-medium">
                    §{s.id} · {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute -top-3 -left-3 rotate-[-5deg] bg-bg-dark text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-lg">
              the source
            </div>
          </div>

          {/* MIDDLE — connecting fan (svg) */}
          <div className="col-span-12 md:col-span-2 relative hidden md:flex items-stretch">
            <svg
              viewBox="0 0 120 480"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
              fill="none"
            >
              {SECTIONS.map((_, i) => {
                const fromY = 60 + i * 65;
                const toY = 40 + i * 65;
                return (
                  <path
                    key={i}
                    d={`M0 ${fromY} C 60 ${fromY}, 60 ${toY}, 120 ${toY}`}
                    stroke={i % 2 === 0 ? '#1456f0' : '#ea5ec1'}
                    strokeWidth={1.4}
                    strokeLinecap="round"
                    strokeDasharray="600"
                    className="anatomy-line"
                  />
                );
              })}
            </svg>
          </div>

          {/* RIGHT — the ToC manifest */}
          <div className="col-span-12 md:col-span-5">
            <div className="relative rounded-[24px] bg-bg-dark text-white border border-bg-dark p-6 md:p-8 aspect-[3/4] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-brand-pink" />
                  <span className="text-[11px] font-data tracking-[0.18em] uppercase text-white/50">
                    toc.manifest
                  </span>
                </div>
                <span className="text-[11px] font-data text-white/40">json</span>
              </div>

              <ul className="space-y-3 font-data text-[13px]">
                {SECTIONS.map((s, i) => (
                  <li
                    key={s.id}
                    className="anatomy-entry rounded-md bg-white/[0.04] hover:bg-white/[0.08] transition-colors px-3 py-2.5 border border-white/[0.06]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">section</span>
                      <span className="text-brand-pink">{s.id}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white/40">title</span>
                      <span className="text-white">{s.label}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white/40">link</span>
                      <span className="text-primary-400 truncate ml-2">
                        /doc/0x7f/§{s.id}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-data text-white/40">
                <span>fetch in parallel</span>
                <span>~40ms · any LLM</span>
              </div>
            </div>

            <div className="absolute -top-3 right-2 rotate-[5deg] bg-brand-pink text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-lg">
              the interface
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
