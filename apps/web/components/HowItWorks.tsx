'use client';

import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';
import CodeBlock from './CodeBlock';

const steps = [
  {
    n: '01',
    verb: 'Ingest.',
    title: 'Add your document.',
    description:
      'Drop in a PDF, DOCX, URL, or raw text. We read the whole thing — title, headings, footnotes, the lot — and store every section as a stable, addressable unit. No chunk size to tune. No overlap to tweak.',
    pun: 'No knife required.',
  },
  {
    n: '02',
    verb: 'Map.',
    title: 'Get a navigable table of contents.',
    description:
      'You get back a structured manifest — every section with a title, a summary, and a deterministic link. Think llms.txt, but generated for you, on anything. A document, finally treated like a real interface.',
    pun: 'A map your LLM can actually read.',
  },
  {
    n: '03',
    verb: 'Reason.',
    title: 'Let the LLM choose what to fetch.',
    description:
      'Hand the map and a question to any model. It reasons about which sections matter, we fetch them in parallel, and you get back complete, structured context — not the nearest neighbour, the right answer.',
    pun: 'Retrieval that knows where it\'s going.',
  },
];

const snippets = [
  {
    label: 'TypeScript',
    language: 'typescript',
    code: `// 01 — Ingest
const { doc_id, toc } = await vectorless.addDocument(file);

// 02 — Map
const sectionIds = await llm.reason(toc, question);

// 03 — Reason
const context = await vectorless.fetchSections(doc_id, sectionIds);
const answer  = await llm.answer(context, question);`,
  },
  {
    label: 'Python',
    language: 'python',
    code: `# 01 — Ingest
doc_id, toc = await vectorless.add_document(file)

# 02 — Map
section_ids = await llm.reason(toc, question)

# 03 — Reason
context = await vectorless.fetch_sections(doc_id, section_ids)
answer  = await llm.answer(context, question)`,
  },
];

export default function HowItWorks() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, () => {
    // Each step rises into view and the connecting "tread" draws beneath it
    gsap.utils.toArray<HTMLElement>('.stair-step').forEach((el, i) => {
      const isOdd = i % 2 === 1;

      gsap.from(el, {
        y: 80,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
        },
      });

      gsap.fromTo(
        el.querySelector('.stair-tread') as HTMLElement,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: 'expo.inOut',
          transformOrigin: isOdd ? 'right center' : 'left center',
          scrollTrigger: {
            trigger: el,
            start: 'top 70%',
          },
        }
      );

      gsap.from(el.querySelectorAll('.stair-detail'), {
        opacity: 0,
        y: 18,
        duration: 0.8,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 70%' },
      });
    });

    // Lit code block reveal at the end
    gsap.from('.stair-code', {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.stair-code',
        start: 'top 80%',
      },
    });

  });

  return (
    <section
      id="how"
      ref={ref}
      className="relative py-32 md:py-44 px-6 md:px-12 overflow-hidden border-t border-border-light bg-white"
    >
      {/* Header */}
      <div className="max-w-[1240px] mx-auto mb-24">
        <span className="font-mid text-[12px] uppercase tracking-[0.22em] text-text-muted block mb-3">
          The method
        </span>
        <h2 className="font-display text-[40px] md:text-[72px] font-medium leading-[1.02] tracking-[-0.02em] text-text-base max-w-[900px]">
          Three steps down.{' '}
          <span className="text-text-muted">No vectors required.</span>
        </h2>
      </div>

      {/* Staircase */}
      <div className="max-w-[1240px] mx-auto relative">
        {steps.map((s, i) => {
          const isOdd = i % 2 === 1;
          return (
            <div
              key={s.n}
              className={`stair-step relative grid grid-cols-12 gap-6 md:gap-12 mb-2 md:mb-0`}
              style={{
                paddingLeft: `${(isOdd ? steps.length - 1 - i : i) * 0}px`,
              }}
            >
              {/* Step content panel, stair-stepped horizontally */}
              <div
                className={`col-span-12 md:col-span-9 ${
                  i === 0
                    ? 'md:col-start-1'
                    : i === 1
                    ? 'md:col-start-3'
                    : 'md:col-start-4'
                }`}
              >
                <div className="relative rounded-[28px] bg-bg-base border border-border-light px-8 md:px-14 py-12 md:py-16 shadow-[0_30px_80px_-40px_rgba(20,86,240,0.18)] overflow-hidden">
                  {/* The "tread" — a horizontal bar that draws in */}
                  <div className="stair-tread absolute top-0 left-0 right-0 h-[6px] bg-gradient-to-r from-brand-blue via-primary-500 to-brand-pink" />

                  <div className="grid grid-cols-12 gap-8 items-start">
                    <div className="col-span-12 md:col-span-3">
                      <div className="stair-detail font-data text-[12px] text-text-muted tracking-[0.2em] uppercase mb-2">
                        Step {s.n}
                      </div>
                      <div className="stair-detail font-display text-[36px] md:text-[56px] font-medium leading-[1] text-transparent bg-clip-text bg-gradient-to-br from-brand-blue to-brand-pink">
                        {s.verb}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-9 md:pl-6">
                      <h3 className="stair-detail font-display text-[24px] md:text-[32px] font-medium leading-[1.15] text-text-dark mb-4">
                        {s.title}
                      </h3>
                      <p className="stair-detail text-[16px] md:text-[17px] leading-[1.6] text-text-secondary max-w-[640px]">
                        {s.description}
                      </p>
                      <p className="stair-detail mt-6 text-[13px] font-medium text-text-muted italic">
                        &ldquo;{s.pun}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Subtle step number watermark */}
                  <div className="absolute -right-2 bottom-0 font-display text-[160px] md:text-[220px] leading-none font-medium text-black/[0.02] select-none pointer-events-none">
                    {s.n}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Code reward */}
      <div className="max-w-[1240px] mx-auto mt-24 md:mt-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5">
          <span className="font-mid text-[12px] uppercase tracking-[0.22em] text-text-muted block mb-3">
            In code
          </span>
          <h3 className="font-display text-[28px] md:text-[40px] font-medium leading-[1.1] tracking-[-0.01em] text-text-dark">
            Five lines.{' '}
            <span className="text-text-muted">Every retrieval problem.</span>
          </h3>
          <p className="mt-4 text-[15px] text-text-secondary max-w-[420px]">
            Bring your own LLM. Bring your own framework. We just hand you a primitive that fits where vectors don&apos;t.
          </p>
        </div>
        <div className="stair-code lg:col-span-7 min-h-[360px]">
          <CodeBlock snippets={snippets} />
        </div>
      </div>
    </section>
  );
}
