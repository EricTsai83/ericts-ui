"use client";

import { ArrowRight, Code2, Eye, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { RegistryPreview } from "@/components/registry-preview";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/registry/base/ui/copy-button";

export type ComponentPreviewBrowserItem = {
  name: string;
  title: string;
  description?: string;
  href: string;
  installUrl: string;
  kindLabel: string;
  badges: string[];
};

type ComponentPreviewBrowserProps = {
  items: ComponentPreviewBrowserItem[];
};

export function ComponentPreviewBrowser({ items }: ComponentPreviewBrowserProps) {
  const [activeName, setActiveName] = useState(
    () =>
      items.find((item) => item.name === "highlight-tabs")?.name ??
      items[0]?.name ??
      "",
  );
  const activeItem = useMemo(
    () => items.find((item) => item.name === activeName) ?? items[0],
    [activeName, items],
  );

  if (!activeItem) {
    return null;
  }

  const installCommand = `npx shadcn@latest add ${activeItem.installUrl}`;
  const previewHref = `/view/base/${activeItem.name}`;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Component preview
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            A fast way to scan the registry, switch between live previews, and
            jump into the install path without leaving the home page.
          </p>
        </div>
        <div className="mt-3 h-px flex-1 bg-border" />
      </div>

      <div className="grid overflow-hidden rounded-lg border bg-card text-card-foreground lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          <div className="flex min-h-10 items-center justify-between gap-3 border-b bg-muted/25 px-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <Code2 aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="shrink-0 font-mono">TSX</span>
              <span className="truncate font-mono">
                components/ui/{activeItem.name}.tsx
              </span>
            </div>
            <Link
              href={activeItem.href}
              className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Docs
            </Link>
          </div>

          <div
            id="component-preview-panel"
            role="tabpanel"
            aria-label={`${activeItem.title} preview`}
            className="relative flex min-h-[360px] items-center justify-center overflow-hidden border-b bg-background p-4 sm:min-h-[400px] sm:p-6"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:48px_48px] opacity-35 [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_86%,transparent)] dark:opacity-20"
            />
            <div className="relative z-10 flex w-full min-w-0 items-center justify-center">
              <RegistryPreview name={activeItem.name} />
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]">
            <div className="flex min-w-0 flex-col gap-3 border-b p-4 md:border-b-0 md:border-r">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
                  {activeItem.kindLabel}
                </span>
                {activeItem.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-medium">{activeItem.title}</h3>
                {activeItem.description ? (
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {activeItem.description}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-0 flex-col justify-center gap-3 p-4">
              <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2">
                <PackageCheck
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                  {installCommand}
                </code>
                <CopyButton
                  value={installCommand}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Copy ${activeItem.title} install command`}
                  className="shrink-0"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={previewHref}
                  className={buttonVariants({ variant: "default", size: "sm" })}
                >
                  <Eye data-icon="inline-start" aria-hidden="true" />
                  Preview
                </Link>
                <Link
                  href={activeItem.href}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Open docs
                </Link>
              </div>
            </div>
          </div>
        </div>

        <aside className="flex min-w-0 flex-col border-t bg-background lg:border-l lg:border-t-0">
          <div className="border-b px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              Quick preview
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Preview components"
            className="flex flex-col"
          >
            {items.map((item) => {
              const isActive = item.name === activeItem.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="component-preview-panel"
                  onClick={() => setActiveName(item.name)}
                  className={cn(
                    "flex min-h-16 w-full flex-col items-start justify-center gap-1 border-b px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-muted/50 text-foreground"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  )}
                >
                  <span className="line-clamp-1 text-sm font-medium">
                    {item.title}
                  </span>
                  <span className="line-clamp-1 font-mono text-xs">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      <div className="flex min-h-8 items-center justify-between gap-3 border-b px-3 text-xs text-muted-foreground">
        <span className="font-mono">COMPONENT CATALOG</span>
        <Link
          href="/components"
          className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse all
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}
