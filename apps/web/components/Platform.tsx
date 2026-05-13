'use client';

import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

export default function Platform() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, () => {
    const mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', () => {
      // Headline + eyebrow appear immediately as the section enters (separate, non-scrubbed)
      gsap.from(['.vs-eyebrow', '.vs-headline'], {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: '.vs-stage',
          start: 'top 80%',
        },
      });

      // Master pinned timeline: scrub through the divergence
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '.vs-stage',
          start: 'top top',
          end: '+=2200',
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Beat 1 — the divergence: chunks scatter, vectors fly, ToC bars fill in
      tl.to('.vf-chunk', {
        xPercent: (i) => (i % 2 === 0 ? -30 : 30) + ((i % 3) - 1) * 12,
        yPercent: (i) => ((i % 4) - 2) * 16,
        rotate: (i) => ((i % 5) - 2) * 8,
        opacity: 0.7,
        duration: 1.2,
        stagger: 0.04,
      })
        .to('.vf-vector', { opacity: 1, scale: 1, duration: 0.8, stagger: 0.02 }, '<+0.2')
        .to('.vl-toc-line', { width: '100%', duration: 1, stagger: 0.06 }, '<')

        // Beat 2 — the verdict labels swap in
        .to('.vf-verdict', { opacity: 1, y: 0, duration: 0.4 }, '+=0.2')
        .to('.vl-verdict', { opacity: 1, y: 0, duration: 0.4 }, '<')

        // Beat 3 — the final tagline rises into view
        .to('.vs-tagline > span', {
          yPercent: 0,
          duration: 0.6,
          stagger: 0.08,
        }, '+=0.4');
    });

  });

  return (
    <section ref={ref} className="relative bg-bg-base">
      <div className="vs-stage relative h-screen overflow-hidden">
        {/* Top eyebrow + headline */}
        <div className="absolute top-0 inset-x-0 z-30 pt-20 px-6 md:px-12 text-center">
          <span className="vs-eyebrow font-mid text-[12px] uppercase tracking-[0.22em] text-text-muted block mb-3">
            The crossroads
          </span>
          <h2 className="vs-headline font-display text-[34px] md:text-[56px] font-medium leading-[1.04] tracking-[-0.02em] text-text-base">
            One starts with vectors. The other starts with{' '}
            <span className="text-brand-blue">sense.</span>
          </h2>
        </div>

        {/* Center divider */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-border-light z-20 hidden lg:block" />

        {/* Two columns */}
        <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2 z-10">
          {/* LEFT — Vectorful */}
          <div className="relative h-full overflow-hidden bg-[#fafafa] pt-44 px-8 md:px-16 flex flex-col">
            <header className="mb-6">
              <span className="font-data text-[11px] uppercase tracking-[0.2em] text-text-muted">
                Approach A
              </span>
              <h3 className="font-display text-[32px] md:text-[44px] font-medium text-text-dark leading-[1] mt-1">
                <span className="line-through decoration-brand-pink decoration-[3px]">
                  Vectorful.
                </span>
              </h3>
              <p className="mt-3 text-[14px] text-text-secondary max-w-[300px]">
                Slice the document. Embed every fragment. Hope the math finds meaning.
              </p>
            </header>

            <div className="relative flex-1">
              {/* "Document" turned into chunks */}
              <div className="absolute top-0 left-0 right-0 grid grid-cols-3 gap-2">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className="vf-chunk h-14 rounded-md bg-white border border-border-light shadow-sm overflow-hidden p-2"
                  >
                    <div className="h-1.5 w-3/4 bg-border-gray rounded-full mb-1.5" />
                    <div className="h-1.5 w-1/2 bg-border-gray rounded-full" />
                  </div>
                ))}
              </div>

              {/* Vector cloud appears as chunks scatter */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 32 }).map((_, i) => (
                  <span
                    key={i}
                    className="vf-vector absolute h-1.5 w-1.5 rounded-full bg-brand-pink/70 opacity-0 scale-0"
                    style={{
                      left: `${(i * 37) % 95}%`,
                      top: `${(i * 53) % 95}%`,
                    }}
                  />
                ))}
              </div>

              <div className="vf-verdict absolute bottom-6 left-0 opacity-0 translate-y-2">
                <p className="font-data text-[12px] text-text-muted mb-1">verdict</p>
                <p className="font-display text-[20px] md:text-[24px] text-text-dark leading-tight">
                  Fragments fly. Context dies.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — Vectorless */}
          <div className="relative h-full overflow-hidden bg-white pt-44 px-8 md:px-16 flex flex-col">
            <header className="mb-6">
              <span className="font-data text-[11px] uppercase tracking-[0.2em] text-primary-500">
                Approach B
              </span>
              <h3 className="font-display text-[32px] md:text-[44px] font-medium leading-[1] mt-1">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-pink">
                  Vectorless.
                </span>
              </h3>
              <p className="mt-3 text-[14px] text-text-secondary max-w-[300px]">
                Keep the document whole. Map its structure. Let reasoning navigate.
              </p>
            </header>

            <div className="relative flex-1">
              {/* The intact document with structured sections */}
              <div className="absolute inset-x-0 top-0 rounded-2xl border border-border-light bg-white shadow-[0_20px_50px_-20px_rgba(20,86,240,0.18)] p-5 space-y-3">
                {[
                  { id: '01', label: 'Abstract', w: '60%' },
                  { id: '02', label: 'Introduction', w: '72%' },
                  { id: '03', label: 'Methods', w: '52%' },
                  { id: '04', label: 'Results', w: '78%' },
                  { id: '05', label: 'Discussion', w: '64%' },
                  { id: '06', label: 'Conclusion', w: '46%' },
                ].map((s, i) => (
                  <div
                    key={s.id}
                    className="vl-section flex items-center gap-3"
                  >
                    <span className="font-data text-[10px] text-text-muted w-5">
                      {s.id}
                    </span>
                    <span className="font-mid text-[13px] font-medium text-text-dark min-w-[110px]">
                      {s.label}
                    </span>
                    <div className="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden relative">
                      <span
                        className="vl-toc-line absolute left-0 top-0 h-full bg-gradient-to-r from-brand-blue to-brand-pink rounded-full"
                        style={{ width: '0%', maxWidth: s.w }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="vl-verdict absolute bottom-6 left-0 opacity-0 translate-y-2">
                <p className="font-data text-[12px] text-primary-500 mb-1">verdict</p>
                <p className="font-display text-[20px] md:text-[24px] text-text-dark leading-tight">
                  Structure stays. Meaning lands.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="absolute bottom-10 inset-x-0 z-30 text-center px-6">
          <p className="vs-tagline font-display text-[22px] md:text-[32px] font-medium text-text-dark inline-flex flex-wrap justify-center gap-x-2 overflow-hidden">
            {['Less', 'math.', 'More', 'meaning.'].map((w, i) => (
              <span
                key={i}
                className="inline-block translate-y-full"
                style={{ transform: 'translateY(100%)' }}
              >
                {w === 'meaning.' ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-pink">
                    {w}
                  </span>
                ) : (
                  w
                )}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
