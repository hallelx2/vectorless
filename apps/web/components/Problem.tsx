'use client';

import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const SENTENCE = [
  'Most',
  'retrieval',
  'starts',
  'by',
  'destroying',
  'your',
  'document.',
];

export default function Problem() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, () => {
    // Word-by-word reveal as the user scrolls into the section
    gsap.from('.indict-word', {
      opacity: 0,
      y: 24,
      duration: 0.6,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: {
        trigger: '.indict-line',
        start: 'top 75%',
        end: 'bottom 60%',
      },
    });

    // The "destroying" word gets a strikethrough effect
    gsap.fromTo(
      '.indict-strike',
      { scaleX: 0, transformOrigin: 'left center' },
      {
        scaleX: 1,
        duration: 0.7,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: '.indict-line',
          start: 'top 60%',
        },
      }
    );

    // Shred the PDF mock as scroll progresses
    const shred = gsap.timeline({
      scrollTrigger: {
        trigger: '.shred-wrap',
        start: 'top 75%',
        end: 'bottom top',
        scrub: 1.1,
      },
    });
    shred
      .to('.shred-piece', {
        xPercent: (i) => (i % 2 === 0 ? -1 : 1) * (8 + i * 4),
        yPercent: (i) => (i + 1) * 4,
        rotate: (i) => (i % 2 === 0 ? -1 : 1) * (1 + i * 1.6),
        ease: 'none',
        stagger: 0.04,
      })
      .to(
        '.shred-piece',
        {
          opacity: 0.35,
          ease: 'none',
        },
        '<+0.4'
      );

    // The "footer" reveal — punchline
    gsap.from('.indict-punch', {
      opacity: 0,
      y: 14,
      duration: 0.8,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.indict-punch', start: 'top 85%' },
    });

  });

  return (
    <section
      ref={ref}
      className="relative bg-bg-dark text-white py-32 md:py-44 px-6 md:px-12 overflow-hidden"
    >
      <div className="absolute inset-0 grid-paper-dark [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />

      <div className="relative max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* The accusation */}
        <div className="lg:col-span-7">
          <span className="font-mid text-[12px] uppercase tracking-[0.22em] text-white/40 mb-6 block">
            The indictment
          </span>

          <h2 className="indict-line font-display text-[40px] md:text-[72px] lg:text-[88px] font-medium leading-[1.02] tracking-[-0.02em] text-balance">
            {SENTENCE.map((w, i) => (
              <span
                key={i}
                className="indict-word inline-block mr-[0.22em] relative"
              >
                {w === 'destroying' ? (
                  <span className="relative inline-block text-white">
                    {w}
                    <span className="indict-strike absolute left-0 right-0 top-1/2 h-[6px] bg-brand-pink rounded-full -translate-y-1/2" />
                  </span>
                ) : (
                  w
                )}
              </span>
            ))}
          </h2>

          <p className="indict-punch mt-10 text-white/60 text-[16px] md:text-[18px] leading-[1.6] max-w-[520px]">
            Chunks lose context.{' '}
            <span className="text-white">Embeddings miss meaning.</span>{' '}
            Similarity isn&apos;t comprehension. We&apos;ve been retrieving with a blindfold on for years.
          </p>
        </div>

        {/* The exhibit — a PDF being shredded */}
        <div className="lg:col-span-5">
          <ShreddedDoc />
        </div>
      </div>
    </section>
  );
}

function ShreddedDoc() {
  return (
    <div className="shred-wrap relative aspect-[3/4] w-full max-w-[400px] ml-auto">
      <div className="absolute inset-0 rounded-[24px] overflow-hidden bg-white">
        {/* Page header */}
        <div className="absolute top-0 inset-x-0 z-10 px-6 pt-5 pb-3 text-text-dark">
          <p className="font-display text-[14px] font-medium">research.pdf</p>
          <p className="text-[10px] text-text-muted font-data">page 12 / 42</p>
        </div>

        {/* Body — shredded into horizontal strips */}
        <div className="absolute inset-0 pt-16 flex flex-col">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="shred-piece relative flex-1 border-b border-border-light/40 overflow-hidden"
            >
              <div
                className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[7px] rounded-full bg-border-gray/90"
                style={{ width: `${40 + ((i * 17) % 55)}%` }}
              />
              {/* The "cut" line */}
              <div className="absolute inset-x-0 bottom-0 h-px bg-brand-pink/0 group-hover:bg-brand-pink" />
            </div>
          ))}
        </div>
      </div>

      {/* Label */}
      <div className="absolute -top-3 -right-3 rotate-[-6deg] bg-brand-pink text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow-lg">
        chunked into oblivion
      </div>
    </div>
  );
}
