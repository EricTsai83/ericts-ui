import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RegistryPreview } from "@/components/registry-preview";
import { getRegistryItem, registryItems } from "@/lib/registry";

type PageProps = {
  params: Promise<{
    style: string;
    name: string;
  }>;
};

export function generateStaticParams() {
  return registryItems.map((item) => ({
    style: "base",
    name: item.name,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name, style } = await params;
  const item = style === "base" ? getRegistryItem(name) : undefined;

  if (!item) {
    return {};
  }

  return {
    title: item.title,
    description: item.description,
  };
}

export default async function ViewPage({ params }: PageProps) {
  const { name, style } = await params;
  const item = style === "base" ? getRegistryItem(name) : undefined;

  if (!item) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="border-b px-4 py-3">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-sm font-medium">{item.title}</h1>
            <p className="text-xs text-muted-foreground">{item.name}</p>
          </div>
          <a
            href={item.registryUrl}
            className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            JSON
          </a>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <RegistryPreview name={item.name} />
      </div>
    </main>
  );
}
