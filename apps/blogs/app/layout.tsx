import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "Vectorless Blog | Document Retrieval for the Reasoning Era",
  description: "Insights, deep dives, and technical guides on structure-preserving retrieval, RAG, and AI agent memory.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body
        className="bg-[#FCFCFD] text-[#0A0A0A] font-sans antialiased selection:bg-[#bfdbfe] selection:text-[#1d4ed8]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
