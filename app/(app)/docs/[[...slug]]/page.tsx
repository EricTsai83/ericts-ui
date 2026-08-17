import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findNeighbour } from "fumadocs-core/page-tree";
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
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { DocsCopyPage } from "@/components/docs-copy-page";
import { DocsTableOfContents } from "@/components/docs-toc";
import { getMDXComponents } from "@/components/mdx";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-url";
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
  const neighbours = findNeighbour(source.pageTree, page.url);

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
      <div className="flex items-start justify-between gap-4">
        <DocsTitle>{page.data.title}</DocsTitle>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          <div className="hidden sm:block">
            <DocsCopyPage
              markdownPath={`${page.url}.md`}
              url={`${getSiteUrl()}${page.url}`}
            />
          </div>
          <div className="flex items-center gap-2">
            {neighbours.previous ? (
              <Button
                variant="secondary"
                size="icon-sm"
                nativeButton={false}
                className="extend-touch-target size-8 shadow-none md:size-7"
                render={
                  <Link
                    href={neighbours.previous.url}
                    aria-label={`Previous page: ${String(neighbours.previous.name)}`}
                  />
                }
              >
                <ArrowLeftIcon aria-hidden="true" />
              </Button>
            ) : null}
            {neighbours.next ? (
              <Button
                variant="secondary"
                size="icon-sm"
                nativeButton={false}
                className="extend-touch-target size-8 shadow-none md:size-7"
                render={
                  <Link
                    href={neighbours.next.url}
                    aria-label={`Next page: ${String(neighbours.next.name)}`}
                  />
                }
              >
                <ArrowRightIcon aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody className="docs-prose">
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
