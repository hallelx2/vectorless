import AnnouncementBar from "@/components/AnnouncementBar";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Trust from "@/components/Trust";
import Problem from "@/components/Problem";
import Platform from "@/components/Platform";
import HowItWorks from "@/components/HowItWorks";
import Anatomy from "@/components/Anatomy";
import Features from "@/components/Features";
import UseCases from "@/components/UseCases";
import Testimonials from "@/components/Testimonials";
import SDK from "@/components/SDK";
import FAQ from "@/components/FAQ";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-base)] font-sans selection:bg-[var(--color-highlight)] selection:text-[var(--color-text-base)]">
      <AnnouncementBar />
      <Nav />
      <main>
        <Hero />
        <Trust />
        <Problem />
        <Platform />
        <HowItWorks />
        <Anatomy />
        <Features />
        <UseCases />
        <Testimonials />
        <SDK />
        <FAQ />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
