import FadeIn from './FadeIn';
import SpotlightCard from './SpotlightCard';

export default function UseCases() {
  const cases = [
    {
      title: "Research & Academia",
      desc: "Query across papers, systematic reviews, and literature libraries with precision that embeddings can't match."
    },
    {
      title: "Legal & Compliance",
      desc: "Contracts, policies, and regulatory documents — structured retrieval that respects clause boundaries, not chunk limits."
    },
    {
      title: "Clinical & Medical",
      desc: "Guidelines, protocols, drug references. Retrieve complete clinical sections, not fragments of dosing tables."
    },
    {
      title: "Technical Documentation",
      desc: "API references, system manuals, codebases-as-docs. Navigate like an expert, not a search engine."
    },
    {
      title: "Enterprise Knowledge Bases",
      desc: "Internal wikis, SOPs, policy documents. Turn your company's knowledge into a queryable, structured layer."
    },
    {
      title: "Education & e-Learning",
      desc: "Textbooks, syllabi, course materials. Students and AI tutors get the right chapter — not a chunk of three different ones."
    }
  ];

  return (
    <section className="py-32 px-6 md:px-12 max-w-[1200px] mx-auto border-t border-border-light">
      <FadeIn>
        <span className="font-mid text-[18px] font-medium text-text-muted mb-4 block">Use Cases</span>
        <h2 className="font-display text-4xl md:text-[56px] font-medium leading-[1.10] text-text-base mb-20">
          Built for documents that matter.
        </h2>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cases.map((item, i) => (
          <FadeIn key={i} delay={0.1 * (i % 3)} className="h-full">
            <SpotlightCard className="h-full p-10 group">
              <h3 className="font-display text-[28px] font-medium text-text-dark mb-4 group-hover:text-primary-600 transition-colors duration-300">{item.title}</h3>
              <p className="text-[16px] font-normal leading-[1.50] text-text-secondary">
                {item.desc}
              </p>
            </SpotlightCard>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
