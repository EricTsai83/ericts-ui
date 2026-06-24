import {
  ArrowRight,
  Check,
  Component,
  FileJson2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { HomeMotionShowcase } from "@/components/home-motion-showcase";
import { buttonVariants } from "@/components/ui/button";
import { CopyButton } from "@/registry/base/ui/copy-button";
import { getRegistryItem, getRegistryItemBadges } from "@/lib/registry";
import { getRegistryItemUrl } from "@/lib/site-url";

const featuredNames = ["smooth-height", "highlight-tabs", "text-morph"];

export default function Home() {
  const installCommand = `pnpm dlx shadcn@latest add ${getRegistryItemUrl(
    "text-morph",
  )}`;
  const featuredItems = featuredNames
    .map((name) => getRegistryItem(name))
    .filter((item) => item !== undefined);

  return (
    <main className="mx-auto flex min-w-0 w-full max-w-6xl flex-col overflow-hidden px-4 py-8 sm:px-6 sm:py-12">
      <section className="grid min-w-0 gap-10 pb-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1fr)] lg:items-center lg:gap-12">
        <div className="flex min-w-0 max-w-2xl flex-col gap-7">
          <div className="flex flex-col gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border bg-muted/40 px-2.5 py-1 text-sm font-medium text-muted-foreground">
              <Sparkles aria-hidden="true" className="size-4 text-foreground" />
              ericts/ui registry
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-[13ch] text-4xl font-semibold tracking-tight text-balance sm:max-w-xl sm:text-5xl">
                Fluid motion components for shadcn.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Install small UI primitives for layout changes, state feedback,
                and interaction motion without leaving the shadcn workflow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/components"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              Browse components
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
            <Link
              href="/docs"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Read docs
            </Link>
          </div>

          <div className="max-w-2xl rounded-lg border bg-muted/30 p-2">
            <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-2">
              <FileJson2
                aria-hidden="true"
                className="hidden size-4 shrink-0 text-muted-foreground sm:block"
              />
              <code className="min-w-0 flex-1 truncate font-mono text-xs leading-6 text-muted-foreground sm:text-sm">
                {installCommand}
              </code>
              <CopyButton
                value={installCommand}
                variant="ghost"
                size="icon-sm"
                aria-label="Copy install command"
                className="shrink-0"
              />
            </div>
          </div>
        </div>

        <HomeMotionShowcase />
      </section>

      <section className="grid gap-6 border-t pt-10 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Start with motion
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Three compact entries that show the registry&apos;s focus: smooth
            layout, clear navigation, and careful text transitions.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-background">
          {featuredItems.map((item) => {
            const badges = getRegistryItemBadges(item, 2).visible;

            return (
              <Link
                key={item.name}
                href={item.href}
                className="group grid gap-3 border-b p-4 transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Component
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <h3 className="truncate text-sm font-semibold">
                      {item.title}
                    </h3>
                  </div>
                  {item.description ? (
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-1.5 md:justify-end">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex h-6 items-center gap-1 rounded-md border bg-muted/40 px-2 text-xs font-medium text-muted-foreground"
                    >
                      <Check aria-hidden="true" className="size-3" />
                      {badge}
                    </span>
                  ))}
                </div>

                <span className="inline-flex h-8 items-center justify-start gap-1.5 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground md:justify-end">
                  Open
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
