import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import Platform from "@/components/Platform";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import UseCases from "@/components/UseCases";
import SDK from "@/components/SDK";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-base)] font-sans selection:bg-[var(--color-highlight)] selection:text-[var(--color-text-base)]">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Platform />
        <HowItWorks />
        <Features />
        <UseCases />
        <SDK />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
