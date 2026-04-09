import FadeIn from './FadeIn';
import Link from 'next/link';

export default function Pricing() {
  return (
    <section id="pricing" className="py-32 px-6 md:px-12 max-w-[1200px] mx-auto border-t border-border-light text-center">
      <FadeIn>
        <h2 className="font-display text-4xl md:text-[56px] font-medium leading-[1.10] text-text-base mb-8">
          Simple pricing.<br />Coming soon.
        </h2>
        <p className="text-[16px] font-medium leading-[1.50] text-text-secondary max-w-[600px] mx-auto mb-10">
          Vectorless is in early access. If you&apos;re building something interesting with RAG, documents, or LLM retrieval — we want to hear from you.
        </p>
        <Link href="#early-access" className="inline-block bg-primary-500 text-white px-8 py-3 rounded-full text-[16px] font-medium hover:bg-primary-600 transition-colors">
          Join the Early Access List
        </Link>
      </FadeIn>
    </section>
  );
}
