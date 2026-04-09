import FadeIn from './FadeIn';

export default function Platform() {
  return (
    <section className="py-32 px-6 md:px-12 max-w-[1200px] mx-auto">
      <FadeIn>
        <span className="font-mid text-[18px] font-medium text-text-muted mb-4 block">The Platform</span>
        <h2 className="font-display text-4xl md:text-[56px] font-medium leading-[1.10] text-text-base mb-12">
          Structure first. Query second.
        </h2>
      </FadeIn>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
        <FadeIn delay={0.1} className="md:col-span-5">
          <div className="text-[16px] font-medium leading-[1.50] text-text-secondary space-y-6">
            <p>
              Most retrieval systems start by destroying your documents — slicing them into chunks that lose coherence at every cut. Vectorless takes the opposite approach.
            </p>
            <p>
              We read your document. We understand its structure. We build a navigable map of it. And when a question comes in, an LLM reasons its way to the right section — not the nearest vector.
            </p>
            <p>
              The result: retrieval that actually understands what it&apos;s looking for.
            </p>
          </div>
        </FadeIn>
        
        <div className="md:col-span-6 md:col-start-7 flex flex-col gap-12">
          <FadeIn delay={0.2}>
            <h3 className="font-mid text-[24px] font-medium text-text-dark mb-3">Structure-aware ingest</h3>
            <p className="text-[16px] font-normal leading-[1.50] text-text-secondary">
              Every document is parsed into its natural sections — chapters, headings, clauses, entries. The structure becomes the retrieval unit.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <h3 className="font-mid text-[24px] font-medium text-text-dark mb-3">Reasoning-based navigation</h3>
            <p className="text-[16px] font-normal leading-[1.50] text-text-secondary">
              At query time, an LLM reads your document&apos;s map and decides what to fetch. No similarity math. No threshold tuning.
            </p>
          </FadeIn>
          <FadeIn delay={0.4}>
            <h3 className="font-mid text-[24px] font-medium text-text-dark mb-3">Parallel resolution</h3>
            <p className="text-[16px] font-normal leading-[1.50] text-text-secondary">
              When multiple sections are needed, they&apos;re fetched simultaneously. Complex questions cost the same as simple ones.
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
