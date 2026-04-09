'use client';

import FadeIn from './FadeIn';
import CodeBlock from './CodeBlock';

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
  // → DocumentSummary[]`
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
  # → List[DocumentSummary]`
  }
];

export default function SDK() {
  return (
    <section id="sdk" className="py-32 px-6 md:px-12 max-w-[1200px] mx-auto border-t border-border-light">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5">
          <FadeIn>
            <span className="font-mid text-[18px] font-medium text-text-muted mb-4 block">SDK</span>
            <h2 className="font-display text-4xl md:text-[48px] font-medium leading-[1.10] text-text-base mb-8">
              A retrieval primitive that fits anywhere you build.
            </h2>
            <p className="text-[16px] font-medium leading-[1.50] text-text-secondary mb-8">
              Vectorless ships as a TypeScript SDK first, with Python bindings coming. It&apos;s intentionally narrow — ingest and retrieve. Your reasoning, your LLM, your orchestration. We handle the hard parts of structured storage.
            </p>
            <div className="bg-primary-200/30 p-6 rounded-[13px] border border-primary-200">
              <p className="text-[14px] font-medium leading-[1.50] text-text-dark">
                <span className="font-semibold text-primary-600">MCP server integration coming</span> — use Vectorless natively inside Claude, Cursor, and any MCP-compatible agent runtime.
              </p>
            </div>
          </FadeIn>
        </div>
        
        <div className="lg:col-span-7">
          <FadeIn delay={0.2} className="h-full min-h-[350px]">
            <CodeBlock snippets={sdkSnippets} />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
