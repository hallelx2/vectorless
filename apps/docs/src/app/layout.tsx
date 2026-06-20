import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { fontVariables } from '@/lib/fonts';

export const metadata: Metadata = {
  title: {
    default: 'Vectorless — Document retrieval for the reasoning era',
    template: '%s · Vectorless',
  },
  description:
    'Document retrieval for the reasoning era. No chunking, no embeddings, no vector DB — Vectorless parses a document into a tree, an LLM agent navigates it with treewalk, and returns answers with citations.',
  metadataBase: new URL('https://docs.vectorless.store'),
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider
          theme={{
            enabled: false,
            forcedTheme: 'light',
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
