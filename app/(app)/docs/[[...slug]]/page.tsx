import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import {
  TOCProvider,
  TOCPopover,
} from "fumadocs-ui/layouts/docs/page/slots/toc";

import { DocsTableOfContents } from "@/components/docs-toc";
import { getMDXComponents } from "@/components/mdx";
import { source } from "@/lib/source";

type PageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return {};
  }

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const MDXContent = page.data.body;
  const hasTableOfContents = page.data.toc.length > 0;
  const shouldReserveTableOfContentsSpace =
    !hasTableOfContents && page.data.full !== true;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      className="min-w-0 max-w-[calc(var(--spacing)*160)] px-4 py-6 md:px-0 md:pt-6 lg:py-8 xl:px-0 xl:pt-8"
      tableOfContent={{ enabled: hasTableOfContents }}
      slots={{
        toc: {
          provider: TOCProvider,
          main: DocsTableOfContents,
          popover: TOCPopover,
        },
      }}
      tableOfContentPopover={{ enabled: false }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent components={getMDXComponents()} />
      </DocsBody>
      {shouldReserveTableOfContentsSpace ? (
        <div
          aria-hidden="true"
          className="hidden xl:layout:[--fd-toc-width:var(--fd-sidebar-width)]"
        />
      ) : null}
    </DocsPage>
  );
}
