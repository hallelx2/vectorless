import FadeIn from './FadeIn';
import SpotlightCard from './SpotlightCard';

export default function Features() {
  const features = [
    {
      title: "Structured Ingest",
      desc: "Turn PDFs, DOCX, TXT, URLs, and raw text into structured, addressable section maps automatically.",
      className: "md:col-span-2"
    },
    {
      title: "LLM-Navigable Maps",
      desc: "Every document becomes an llms.txt-style manifest — a map any language model can reason over natively.",
      className: "md:col-span-1"
    },
    {
      title: "Parallel Section Fetching",
      desc: "Fetch one section or twenty. The latency is the same. Fan-out retrieval without the fan-out cost.",
      className: "md:col-span-1"
    },
    {
      title: "Hybrid Retrieval",
      desc: "Not all documents have structure. Enable embedding-based fallback alongside reasoning — the best of both approaches.",
      className: "md:col-span-1"
    },
    {
      title: "Deterministic Links",
      desc: "Every section gets a stable, addressable URL. Retrieval is auditable, debuggable, and reproducible.",
      className: "md:col-span-1"
    },
    {
      title: "Any LLM, Any Framework",
      desc: "Vectorless is a retrieval primitive. Bring your own LLM. Drop it into LangGraph, CrewAI, LlamaIndex, or your own stack.",
      className: "md:col-span-2"
    },
    {
      title: "ToC Generation",
      desc: "No headings in your document? We generate a semantic table of contents using an LLM — structure from the unstructured.",
      className: "md:col-span-1"
    },
    {
      title: "Postgres Native",
      desc: "One database. JSONB for maps, pgvector for embeddings, full-text search built in. No separate vector infrastructure.",
      className: "md:col-span-2"
    }
  ];

  return (
    <section className="py-32 px-6 md:px-12 max-w-[1200px] mx-auto border-t border-border-light">
      <FadeIn>
        <span className="font-mid text-[18px] font-medium text-text-muted mb-4 block">Features</span>
        <h2 className="font-display text-4xl md:text-[56px] font-medium leading-[1.10] text-text-base mb-20">
          Everything retrieval should be.
        </h2>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(220px,auto)]">
        {features.map((feature, i) => (
          <FadeIn key={i} delay={0.1 * (i % 4)} className={feature.className}>
            <SpotlightCard className="h-full p-10 flex flex-col justify-between group">
              <div>
                <h3 className="font-display text-[28px] font-medium text-text-dark mb-4 group-hover:text-primary-600 transition-colors duration-300">{feature.title}</h3>
                <p className="text-[16px] font-normal leading-[1.50] text-text-secondary">
                  {feature.desc}
                </p>
              </div>
            </SpotlightCard>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
