import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OpenInV0Button } from "@/components/open-in-v0-button";
import { RegistryPreview } from "@/components/registry-preview";
import { getRegistryCategories, registryItems } from "@/lib/registry";

type PageProps = {
  params: Promise<{
    category: string;
  }>;
};

export function generateStaticParams() {
  return getRegistryCategories().map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;

  return {
    title: `${category} blocks`,
    description: `Browse ${category} entries in the registry.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const items = registryItems.filter((item) => item.category === category);

  if (items.length === 0) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-3 border-b pb-6">
        <Link
          href="/blocks"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Blocks
        </Link>
        <h1 className="text-3xl font-semibold capitalize tracking-tight">
          {category}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {items.length} registry {items.length === 1 ? "entry" : "entries"} in
          this category.
        </p>
      </div>

      <div className="grid gap-4">
        {items.map((item) => (
          <article
            key={item.name}
            className="grid gap-4 rounded-md border p-4 lg:grid-cols-[280px_1fr]"
          >
            <div className="flex flex-col justify-between gap-4">
              <div>
                <h2 className="font-medium">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={item.href}
                  className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Preview
                </Link>
                <Link
                  href={item.registryUrl}
                  className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  JSON
                </Link>
                <OpenInV0Button name={item.name} className="w-fit" />
              </div>
            </div>
            <div className="flex min-h-[300px] items-center justify-center rounded-md bg-muted/40 p-6">
              <RegistryPreview name={item.name} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
