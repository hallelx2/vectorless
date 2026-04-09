import type { Metadata } from "next";
import { Outfit, DM_Sans, Poppins, Roboto } from "next/font/google";
import { SessionProvider } from "@/providers/session-provider";
import { ToastProvider } from "@/providers/toast-provider";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const poppins = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-poppins",
});
const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Vectorless | The retrieval platform for the reasoning era",
  description:
    "Turn anything into something queryable. No chunking. No embeddings. Just reasoning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${dmSans.variable} ${poppins.variable} ${roboto.variable}`}
    >
      <body
        className="bg-white text-[#222222] font-sans antialiased selection:bg-[#bfdbfe] selection:text-[#1d4ed8]"
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
