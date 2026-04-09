import FadeIn from './FadeIn';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-40 pb-32 px-6 md:px-12 max-w-[1080px] mx-auto text-center flex flex-col items-center overflow-hidden">
      {/* Subtle Radial Background */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(20,86,240,0.06)_0%,rgba(59,130,246,0.04)_40%,transparent_70%)] blur-[40px] pointer-events-none -z-10"></div>
      
      <FadeIn delay={0.1}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light bg-white/50 backdrop-blur-sm mb-8 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          <span className="text-[12px] font-medium text-text-muted tracking-wide uppercase">Vectorless SDK v1.0 is live</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <h1 className="font-display text-5xl md:text-[80px] font-medium leading-[1.10] text-text-base mb-6 max-w-[900px]">
          Turn anything into<br className="hidden md:block" /> something <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-pink animate-[gradient_8s_linear_infinite] bg-[length:200%_auto]">queryable.</span>
        </h1>
      </FadeIn>
      <FadeIn delay={0.3}>
        <p className="text-[20px] font-medium text-text-secondary leading-[1.50] max-w-[600px] mx-auto mb-10">
          Vectorless is the retrieval platform that structures your documents, PDFs, notes, and data — and makes them instantly queryable by any LLM. No chunking. No embeddings. Just reasoning.
        </p>
      </FadeIn>
      <FadeIn delay={0.4} className="flex flex-col sm:flex-row items-center gap-4">
        <Link href="#early-access" className="bg-bg-dark text-white px-[20px] py-[11px] rounded-[8px] text-[16px] font-medium hover:bg-[#222] transition-colors">
          Get Started
        </Link>
        <Link href="#docs" className="bg-[#f0f0f0] text-[#333333] px-[20px] py-[11px] rounded-[8px] text-[16px] font-medium hover:bg-[#e5e5e5] transition-colors">
          View Documentation
        </Link>
      </FadeIn>
    </section>
  );
}
