import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { SessionProvider } from "@/providers/session-provider";
import { ToastProvider } from "@/providers/toast-provider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "Vectorless | Retrieval for the reasoning era",
  description:
    "The retrieval primitive for AI agents. No chunks. No embeddings. Just structured documents any LLM can reason over.",
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
        className="bg-white text-[#0a0a0a] font-sans antialiased selection:bg-[#bfdbfe] selection:text-[#1d4ed8]"
        suppressHydrationWarning
      >
        <SessionProvider>
          {children}
          <ToastProvider />
        </SessionProvider>
      </body>
    </html>
  );
}
