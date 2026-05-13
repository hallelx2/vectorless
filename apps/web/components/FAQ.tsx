'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const FAQ_ITEMS = [
  {
    q: 'Is this just RAG with extra steps?',
    a: 'The opposite — we removed the steps. No chunker, no embedder, no vector DB, no similarity threshold. The LLM reads a structured table of contents and asks for the sections it needs by ID. Retrieval becomes a function call, not a math problem.',
  },
  {
    q: 'My documents have no headings. Does this still work?',
    a: 'Yes. If a document doesn\'t come pre-structured, we generate a semantic table of contents with an LLM during ingest. You get the same navigable map — auto-built — for messy PDFs, scanned reports, and plain text.',
  },
  {
    q: 'How is the cost different from a vector DB?',
    a: 'You skip the embedding bill entirely (no per-token embedding fees, no upserts). Storage is plain Postgres JSONB plus the raw document. The only variable cost is the LLM reading the ToC at query time — usually ~200 tokens.',
  },
  {
    q: 'What about really long documents?',
    a: 'The ToC is hierarchical. For a 500-page legal contract, the LLM first picks a top-level section, then drills down. Two reasoning hops, one fetch — works the same way a human would navigate.',
  },
  {
    q: 'Can I keep using embeddings where they help?',
    a: 'Yes — hybrid retrieval is supported. Toggle embedding fallback for sections that don\'t map cleanly, or run them in parallel. We\'re not religious about it, we just don\'t make you start there.',
  },
  {
    q: 'What LLMs / frameworks does it work with?',
    a: 'Any. Vectorless ships as a TypeScript SDK (Python coming) and is intentionally narrow — ingest and retrieve. Use it inside LangGraph, CrewAI, LlamaIndex, an MCP server, or your own loop. Bring your own model.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Yes — the SDK is open source and free for development. The hosted plan is free for the first 100 documents; paid plans start when you scale beyond that.',
  },
  {
    q: 'How is it different from llms.txt?',
    a: 'Same instinct, more surface area. llms.txt is a static convention for one site; Vectorless generates a queryable manifest for any document, makes every section addressable, and handles the fetch.',
  },
];

export default function FAQ() {
  const ref = useScopedRef<HTMLElement>();
  const [open, setOpen] = useState<number | null>(0);

  useGsapEffect(ref, () => {
    gsap.from('.faq-head > span', {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.faq-head', start: 'top 85%' },
    });

    gsap.from('.faq-item', {
      opacity: 0,
      y: 18,
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.05,
      scrollTrigger: { trigger: '.faq-list', start: 'top 85%' },
    });
  });

  return (
    <section
      ref={ref}
      id="faq"
      className="relative py-32 md:py-44 px-6 md:px-12 border-t border-border-light"
    >
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <span className="font-data text-[11px] uppercase tracking-[0.22em] text-text-muted mb-3 block">
            Common questions
          </span>
          <h2 className="faq-head font-display text-[36px] md:text-[52px] font-medium leading-[1.04] tracking-[-0.025em] text-text-base mb-6">
            <span className="split-line"><span>Honest answers</span></span>
            <span className="split-line"><span>to the obvious</span></span>
            <span className="split-line"><span><span className="font-serif italic font-normal">questions.</span></span></span>
          </h2>
          <p className="text-[15px] text-text-secondary leading-[1.6] max-w-[320px]">
            Can&apos;t find your question? Open an issue on GitHub or email{' '}
            <a className="underline underline-offset-4 hover:text-text-dark" href="mailto:hello@vectorless.dev">
              hello@vectorless.dev
            </a>.
          </p>
        </div>

        <div className="faq-list lg:col-span-8 divide-y divide-border-light border-y border-border-light">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="faq-item">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-6 py-6 text-left hover:opacity-80 transition-opacity"
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-[17px] md:text-[20px] font-medium text-text-dark tracking-[-0.01em]">
                    {item.q}
                  </span>
                  <span
                    className={`h-8 w-8 shrink-0 rounded-full border border-border-gray flex items-center justify-center transition-all ${isOpen ? 'bg-bg-dark text-white border-bg-dark' : 'text-text-secondary'}`}
                    aria-hidden
                  >
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
                <div
                  className="grid transition-all duration-300 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="text-[15px] md:text-[16px] leading-[1.65] text-text-secondary pb-6 pr-12 max-w-[640px]">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
