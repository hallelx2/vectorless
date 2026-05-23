import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, FileText } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const PDF = "/Vectorless-Whitepaper.pdf";

export const metadata: Metadata = {
  title: "Whitepaper — Vectorless",
  description:
    "Retrieval you can stand behind. The case for vectorless retrieval in healthcare, finance, and law — and the product that ships it. One Go binary, self-hosted, drop in any RAG pipeline.",
  openGraph: {
    title: "Vectorless Whitepaper — Retrieval you can stand behind",
    description:
      "Precision retrieval for the domains that can't afford guesses. Read the case for vectorless retrieval.",
    type: "article",
  },
};

const CONTENTS = [
  { id: "00", title: "Introduction: The Accuracy Ceiling", blurb: "Where vector RAG stopped being enough" },
  { id: "01", title: "Why Vectors Hit the Wall", blurb: "Three failure modes that show up in production" },
  { id: "02", title: "What Vectorless Means", blurb: "Retrieval as navigation, not approximation" },
  { id: "03", title: "Healthcare, Finance & High-Accuracy Domains", blurb: "Where the case writes itself — with examples" },
  { id: "04", title: "How vectorless.store Works", blurb: "One Go binary, dropped into your pipeline" },
  { id: "05", title: "Integration & Compliance", blurb: "Self-hosted, air-gap-ready, audit-trail-native" },
];

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-base)] font-sans selection:bg-[var(--color-highlight)] selection:text-[var(--color-text-base)]">
      <Nav />
      <main>
        {/* Header */}
        <section className="relative overflow-hidden px-6 md:px-12 pt-28 sm:pt-32 pb-16">
          <div className="absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_top,black_15%,transparent_70%)] pointer-events-none" />
          <div className="relative z-10 max-w-[1200px] mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light bg-white/70 backdrop-blur-sm mb-8 shadow-sm">
              <FileText className="h-3.5 w-3.5 text-primary-500" />
              <span className="font-data text-[11px] font-medium text-text-muted tracking-[0.16em] uppercase">
                Whitepaper 01 · 2026
              </span>
            </div>

            <h1 className="font-display text-[40px] sm:text-5xl md:text-[68px] font-medium leading-[1.02] tracking-[-0.03em] text-text-base max-w-[860px]">
              Retrieval you can stand behind.{" "}
              <span className="font-serif italic font-normal text-text-secondary">
                In courtrooms, clinics, and capital.
              </span>
            </h1>

            <p className="text-[17px] md:text-[19px] text-text-secondary leading-[1.55] max-w-[620px] mt-7">
              Vectors are fuzzy nearest-neighbour guesses. For chat, that&apos;s fine. For
              healthcare, finance, and law, it&apos;s a liability. This paper makes the case for{" "}
              <span className="text-text-base font-medium">vectorless retrieval</span> — and
              introduces the product that ships it.
            </p>

            <p className="font-data text-[11px] text-text-muted tracking-[0.04em] mt-5">
              One Go binary · Self-hosted · Drop in any RAG pipeline · 20 pages
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-8">
              <a
                href={PDF}
                download
                className="group inline-flex items-center gap-3 bg-bg-dark text-white pl-6 pr-2 py-2 rounded-full text-[15px] font-medium hover:bg-black transition-colors"
              >
                Download PDF
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                  <Download className="h-4 w-4 text-bg-dark" />
                </span>
              </a>
              <a
                href={PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-text-dark px-5 py-3 rounded-full border border-border-gray hover:bg-black/[0.03] transition-colors"
              >
                Open in new tab <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Contents */}
        <section className="px-6 md:px-12 pb-16">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-[2px] w-8 bg-primary-500" />
              <span className="font-data text-[11px] font-medium text-text-muted tracking-[0.18em] uppercase">
                Inside the paper
              </span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 border-b border-border-light">
              {CONTENTS.map((s) => (
                <li key={s.id} className="flex items-baseline gap-5 py-5 border-t border-border-light">
                  <span className="font-data text-[13px] text-text-muted shrink-0">{s.id}</span>
                  <div>
                    <h3 className="text-[16px] font-medium text-text-dark">{s.title}</h3>
                    <p className="text-[14px] text-text-muted mt-0.5">{s.blurb}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Embedded reader */}
        <section className="px-6 md:px-12 pb-24">
          <div className="max-w-[1200px] mx-auto">
            <div className="rounded-[20px] border border-border-gray overflow-hidden bg-bg-dark shadow-[0_30px_80px_-20px_rgba(20,86,240,0.18)]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-brand-pink" />
                  <span className="font-data text-[11px] uppercase tracking-[0.18em] text-white/60">
                    Vectorless-Whitepaper.pdf
                  </span>
                </div>
                <a
                  href={PDF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-data text-[11px] text-white/60 hover:text-white transition-colors"
                >
                  Open ↗
                </a>
              </div>
              <object data={`${PDF}#view=FitH`} type="application/pdf" className="w-full h-[75vh] bg-white">
                <iframe src={PDF} title="Vectorless Whitepaper" className="w-full h-[75vh]" />
                <div className="p-10 text-center text-white/70 text-[15px]">
                  Your browser can&apos;t display the PDF inline.{" "}
                  <a href={PDF} download className="underline text-white">
                    Download it instead.
                  </a>
                </div>
              </object>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
