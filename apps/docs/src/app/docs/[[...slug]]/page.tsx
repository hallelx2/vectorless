import { getPageImage, getPageMarkdownUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { gitConfig } from '@/lib/shared';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  return (
    <DocsPage 
      toc={page.data.toc} 
      full={page.data.full}
      breadcrumb={{
        enabled: true,
      }}
    >
      <div className="mb-12">
        <DocsTitle className="text-4xl sm:text-5xl font-semibold tracking-tight text-vl-ink mb-4">
          {page.data.title}
        </DocsTitle>
        <DocsDescription className="text-xl font-light text-vl-secondary leading-relaxed max-w-3xl">
          {page.data.description}
        </DocsDescription>
        
        <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-vl-muted border-b border-vl-hairline pb-8">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-vl-blue" />
            <span>Updated 2026</span>
          </div>
          <div className="h-4 w-px bg-vl-hairline" />
          <MarkdownCopyButton markdownUrl={markdownUrl} className="hover:text-vl-ink transition-colors" />
          <div className="h-4 w-px bg-vl-hairline" />
          <ViewOptionsPopover
            markdownUrl={markdownUrl}
            githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
            className="hover:text-vl-ink transition-colors"
          />
        </div>
      </div>

      <DocsBody className="prose prose-vl max-w-none">
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
