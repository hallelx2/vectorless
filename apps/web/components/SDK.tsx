'use client';

import CodeBlock from './CodeBlock';
import { useGsapEffect, useScopedRef, gsap } from '@/hooks/useGsap';

const sdkSnippets = [
  {
    label: 'TypeScript',
    language: 'typescript',
    code: `vectorless.addDocument(file, options)
  // → { doc_id, toc }

vectorless.getToC(doc_id)
  // → ToC manifest

vectorless.fetchSection(doc_id, section_id)
  // → { title, content, page_range }

vectorless.fetchSections(doc_id, section_ids)
  // → Section[]

vectorless.listDocuments()
  // → DocumentSummary[]`,
  },
  {
    label: 'Python',
    language: 'python',
    code: `vectorless.add_document(file, options)
  # → { doc_id, toc }

vectorless.get_toc(doc_id)
  # → ToC manifest

vectorless.fetch_section(doc_id, section_id)
  # → { title, content, page_range }

vectorless.fetch_sections(doc_id, section_ids)
  # → List[Section]

vectorless.list_documents()
  # → List[DocumentSummary]`,
  },
];

const METHODS = [
  { name: 'addDocument', verb: 'put' },
  { name: 'getToC', verb: 'read' },
  { name: 'fetchSection', verb: 'pick' },
  { name: 'fetchSections', verb: 'pick·N' },
  { name: 'listDocuments', verb: 'list' },
];

export default function SDK() {
  const ref = useScopedRef<HTMLElement>();
  useGsapEffect(ref, () => {
    gsap.from('.sdk-head > span', {
      yPercent: 110,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.06,
      scrollTrigger: { trigger: '.sdk-head', start: 'top 80%' },
    });

    gsap.from('.sdk-copy > *', {
      opacity: 0,
      y: 18,
      duration: 0.8,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '.sdk-copy', start: 'top 80%' },
    });

    gsap.from('.sdk-method', {
      opacity: 0,
      x: -20,
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: '.sdk-list', start: 'top 85%' },
    });

    gsap.from('.sdk-code', {
      opacity: 0,
      y: 40,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.sdk-code', start: 'top 85%' },
    });

  });

  return (
    <section
      id="sdk"
      ref={ref}
      className="relative py-32 md:py-44 px-6 md:px-12 max-w-[1240px] mx-auto border-t border-border-light"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5">
          <span className="font-mid text-[12px] uppercase tracking-[0.22em] text-text-muted mb-3 block">
            The SDK
          </span>
          <h2 className="sdk-head font-display text-[40px] md:text-[56px] font-medium leading-[1.04] tracking-[-0.02em] text-text-base mb-7">
            <span className="split-line"><span>A retrieval primitive</span></span>
            <span className="split-line"><span>that fits anywhere.</span></span>
          </h2>

          <div className="sdk-copy space-y-5">
            <p className="text-[16px] leading-[1.6] text-text-secondary max-w-[480px]">
              TypeScript first, Python coming. The surface is small on purpose — ingest and retrieve. Your reasoning, your LLM, your orchestration. We just handle structure.
            </p>

            <ul className="sdk-list grid grid-cols-2 gap-2 mt-3 max-w-[420px]">
              {METHODS.map((m) => (
                <li
                  key={m.name}
                  className="sdk-method flex items-center justify-between gap-3 rounded-xl border border-border-light bg-white px-3.5 py-2.5"
                >
                  <span className="font-data text-[13px] text-text-dark truncate">
                    {m.name}
                  </span>
                  <span className="font-data text-[10px] uppercase tracking-[0.15em] text-text-muted">
                    {m.verb}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 inline-flex items-start gap-3 rounded-2xl bg-primary-500/[0.06] border border-primary-500/15 px-5 py-4 max-w-[460px]">
              <span className="text-[16px] mt-[2px]">↯</span>
              <p className="text-[13px] leading-[1.55] text-text-dark">
                <span className="font-semibold text-primary-600">MCP server coming</span> — call Vectorless natively inside Claude, Cursor, and any MCP-compatible runtime.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="sdk-code min-h-[380px]">
            <CodeBlock snippets={sdkSnippets} />
          </div>
        </div>
      </div>
    </section>
  );
}
