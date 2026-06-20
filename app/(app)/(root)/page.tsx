import Link from "next/link";

import { RegistryPreview } from "@/components/registry-preview";
import { registryItems } from "@/lib/registry";

export default function Home() {
  const featuredItems = registryItems.slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="grid gap-6 border-b pb-10 lg:grid-cols-[1fr_320px]">
        <div className="flex max-w-2xl flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight">
            Custom shadcn registry
          </h1>
          <p className="text-lg text-muted-foreground">
            Documentation, previews, and installable registry JSON for EricTS UI
            components and blocks.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/docs"
              className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Read docs
            </Link>
            <Link
              href="/blocks"
              className="inline-flex h-9 items-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Browse blocks
            </Link>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-3 self-start text-sm lg:grid-cols-1">
          <div className="rounded-md border p-3">
            <dt className="text-muted-foreground">Items</dt>
            <dd className="text-2xl font-semibold">{registryItems.length}</dd>
          </div>
          <div className="rounded-md border p-3">
            <dt className="text-muted-foreground">Style</dt>
            <dd className="text-2xl font-semibold">base</dd>
          </div>
          <div className="rounded-md border p-3">
            <dt className="text-muted-foreground">Output</dt>
            <dd className="text-2xl font-semibold">JSON</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Featured blocks
            </h2>
            <p className="text-sm text-muted-foreground">
              Registry entries available through `/r/:name.json`.
            </p>
          </div>
          <Link
            href="/blocks"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4">
          {featuredItems.length > 0 ? (
            featuredItems.map((item) => (
              <article
                key={item.name}
                className="grid gap-4 rounded-md border p-4 lg:grid-cols-[280px_1fr]"
              >
                <div className="flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
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
                  </div>
                </div>
                <div className="flex min-h-[260px] items-center justify-center rounded-md bg-muted/40 p-6">
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
      </section>
    </div>
  );
}
