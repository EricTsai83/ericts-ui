import Link from "next/link";
import type { Metadata } from "next";

import { RegistryPreview } from "@/components/registry-preview";
import { getRegistryCategories, registryItems } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Blocks",
  description: "Browse installable components and blocks in the registry.",
};

export default function BlocksPage() {
  const categories = getRegistryCategories();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-3 border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Blocks</h1>
        <p className="max-w-2xl text-muted-foreground">
          Preview registry entries or open generated JSON.
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.length > 0
            ? categories.map((category) => (
                <Link
                  key={category}
                  href={`/blocks/${category}`}
                  className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-sm font-medium capitalize transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {category}
                </Link>
              ))
            : null}
        </div>
      </div>

      <div className="grid gap-4">
        {registryItems.length > 0 ? (
          registryItems.map((item) => (
            <article
              key={item.name}
              className="grid gap-4 rounded-md border p-4 lg:grid-cols-[280px_1fr]"
            >
              <div className="flex flex-col justify-between gap-4">
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.category}
                  </div>
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
                </div>
              </div>
              <div className="flex min-h-[300px] items-center justify-center rounded-md bg-muted/40 p-6">
                <RegistryPreview name={item.name} />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No registry components yet.
          </div>
        )}
      </div>
    </div>
  );
}
