"use client";

import { ArrowRight, ArrowUpRight, Code2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { RegistryPreview } from "@/components/registry-preview";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/registry/base/ui/copy-button";

export type ComponentPreviewBrowserItem = {
  name: string;
  title: string;
  description?: string;
  href: string;
  installTarget: string;
  badges: string[];
};

type ComponentPreviewBrowserProps = {
  items: ComponentPreviewBrowserItem[];
};

export function ComponentPreviewBrowser({ items }: ComponentPreviewBrowserProps) {
  const tabListRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [activeName, setActiveName] = useState(() => items[0]?.name ?? "");
  const activeItem = useMemo(
    () => items.find((item) => item.name === activeName) ?? items[0],
    [activeName, items],
  );
  const installCommand = activeItem
    ? `npx shadcn@latest add ${activeItem.installTarget}`
    : "";
  const activeTabId = activeItem
    ? `component-preview-${activeItem.name}-tab`
    : undefined;

  useEffect(() => {
    const tabList = tabListRef.current;
    const activeTab = activeTabRef.current;

    if (!tabList || !activeTab || tabList.scrollWidth <= tabList.clientWidth) {
      return;
    }

    tabList.scrollTo({
      left: Math.max(activeTab.offsetLeft - 16, 0),
      behavior: "auto",
    });
  }, [activeName]);

  if (!activeItem) {
    return null;
  }

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">
            Component preview
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Try a featured component and copy the install command.
          </p>
        </div>
        <Link
          href="/components"
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse all
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>

      <div className="grid min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0">
          <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b bg-muted/20 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-medium">
                  {activeItem.title}
                </h3>
                {activeItem.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-md bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              {activeItem.description ? (
                <p className="line-clamp-1 text-sm leading-6 text-muted-foreground">
                  {activeItem.description}
                </p>
              ) : null}
            </div>
            <Link
              href={activeItem.href}
              aria-label={`Open ${activeItem.title} component page`}
              title={`Open ${activeItem.title} component page`}
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-lg" }),
                "group/page-link text-muted-foreground hover:border-foreground/20 sm:w-auto sm:gap-1.5 sm:px-2.5",
              )}
            >
              <span className="sr-only sm:not-sr-only">View detail</span>
              <ArrowUpRight
                data-icon="inline-end"
                aria-hidden="true"
                className="transition-transform group-hover/page-link:-translate-y-0.5 group-hover/page-link:translate-x-0.5"
              />
            </Link>
          </div>

          <div
            id="component-preview-panel"
            role="tabpanel"
            aria-labelledby={activeTabId}
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

          <div className="p-3">
            <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-background p-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Code2 aria-hidden="true" className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-xs font-medium text-foreground">Install</p>
                <code className="min-w-0 truncate font-mono text-xs text-muted-foreground">
                  {installCommand}
                </code>
              </div>
              <CopyButton
                value={installCommand}
                variant="ghost"
                size="icon"
                aria-label={`Copy ${activeItem.title} install command`}
                className="shrink-0"
              />
            </div>
          </div>
        </div>

        <aside className="min-w-0 overflow-hidden border-t bg-background lg:flex lg:flex-col lg:overflow-visible lg:border-l lg:border-t-0">
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Preview components"
            className="no-scrollbar flex min-w-0 flex-nowrap overflow-x-auto overflow-y-hidden lg:flex-col lg:overflow-visible"
          >
            {items.map((item) => {
              const isActive = item.name === activeItem.name;

              return (
                <button
                  key={item.name}
                  ref={isActive ? activeTabRef : undefined}
                  id={`component-preview-${item.name}-tab`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="component-preview-panel"
                  onClick={() => setActiveName(item.name)}
                  className={cn(
                    "relative -mb-px flex h-11 min-w-44 flex-none items-center justify-between gap-3 border-b px-4 text-left font-mono text-[11px] font-medium uppercase tracking-[0.08em] transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-w-0",
                    isActive
                      ? "bg-muted/35 text-foreground after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-foreground lg:after:inset-x-auto lg:after:inset-y-2 lg:after:right-0 lg:after:h-auto lg:after:w-px"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                  )}
                >
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </section>
  );
}
