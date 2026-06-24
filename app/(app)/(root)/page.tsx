import {
  ArrowRight,
  Code2,
  Component,
  FileJson2,
  Layers3,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { LogoIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import {
  getRegistryItem,
  getRegistryItemBadges,
  getRegistryItemsByCategory,
  type RegistryItem,
} from "@/lib/registry";
import { getRegistryItemUrl } from "@/lib/site-url";
import { CopyButton } from "@/registry/base/ui/copy-button";

const featuredNames = [
  "smooth-height",
  "copy-button",
  "status-button",
  "highlight-tabs",
  "text-morph",
  "multi-step",
  "adaptive-drawer",
  "use-reduced-motion",
] as const;

const builtOn = ["shadcn", "Base UI", "Motion", "Tailwind CSS", "Next.js"];

const registryNotes = [
  {
    icon: Component,
    title: "Installable source",
    description:
      "Every entry lands in your codebase as editable component or hook source.",
  },
  {
    icon: Layers3,
    title: "Motion primitives",
    description:
      "Layout, state, text, and navigation transitions with restrained defaults.",
  },
  {
    icon: PackageCheck,
    title: "Registry workflow",
    description:
      "Use the same shadcn add flow for previews, docs, and JSON endpoints.",
  },
] as const;

export default function Home() {
  const installCommand = `npx shadcn@latest add ${getRegistryItemUrl(
    "copy-button",
  )}`;
  const featuredItems = featuredNames
    .map((name) => getRegistryItem(name))
    .filter((item): item is RegistryItem => item !== undefined);
  const componentCount = getRegistryItemsByCategory("ui").length;
  const hookCount = getRegistryItemsByCategory("hooks").length;

  return (
    <main className="isolate min-h-[calc(100vh-3.5rem)] overflow-hidden bg-background text-foreground">
      <section className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(340px,42vw)_minmax(0,1fr)]">
        <div className="relative flex min-h-[560px] flex-col justify-between overflow-hidden border-b px-5 py-8 sm:px-8 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:72px_72px] opacity-45 [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)] dark:opacity-20"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-muted/40 to-transparent"
          />

          <div className="relative z-10 flex max-w-xl flex-col gap-7">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground">
              <Sparkles aria-hidden="true" className="size-4 text-foreground" />
              ericts/ui registry
            </div>

            <div className="flex flex-col gap-5">
              <h1 className="max-w-[12ch] text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Motion primitives for shadcn teams.
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                A compact registry for polished interaction components, hooks,
                and CSS-friendly motion patterns you can install as source.
              </p>
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
          </div>

          <div className="relative z-10 my-12 flex flex-1 items-center justify-center lg:my-0">
            <div className="relative aspect-square w-full max-w-[360px]">
              <div className="absolute inset-5 border border-border/60" />
              <div className="absolute inset-12 border border-border/40" />
              <LogoIcon
                aria-hidden="true"
                className="absolute inset-0 size-full -rotate-6 text-foreground/20"
              />
              <LogoIcon
                aria-hidden="true"
                className="absolute inset-[18%] size-[64%] rotate-6 text-foreground/80"
              />
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/components"
              className="transition-colors hover:text-foreground"
            >
              Components
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/hooks" className="transition-colors hover:text-foreground">
              Hooks
            </Link>
          </div>
        </div>

        <div className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-10">
            <section className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <h2 className="shrink-0 text-sm font-medium">README</h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex max-w-5xl flex-col gap-4">
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  Install small, composable UI pieces for animated height,
                  clipboard feedback, tab highlights, multi-step flows, adaptive
                  drawers, and reduced-motion-aware behavior.
                </p>
                <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <Stat value={componentCount} label="components" />
                  <Stat value={hookCount} label="hooks" />
                  <Stat value={featuredItems.length} label="featured entries" />
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border bg-card text-card-foreground">
                <div className="flex h-9 items-center gap-6 border-b px-4 text-sm">
                  <span className="border-b border-foreground py-2 text-foreground">
                    CLI
                  </span>
                  <span className="py-2 text-muted-foreground">JSON</span>
                  <span className="py-2 text-muted-foreground">Preview</span>
                </div>
                <div className="flex min-w-0 items-center gap-3 px-4 py-4">
                  <Code2
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
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
            </section>

            <section className="grid gap-4 border-y py-5 sm:grid-cols-[140px_1fr] sm:items-center">
              <p className="text-sm font-medium text-muted-foreground">
                Built on
              </p>
              <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-muted-foreground">
                {builtOn.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <h2 className="shrink-0 text-xl font-semibold tracking-tight">
                  Featured registry
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-4">
                {featuredItems.map((item) => (
                  <FeaturedItem key={item.name} item={item} />
                ))}
              </div>
            </section>

            <section className="grid gap-5 border-t pt-8 lg:grid-cols-[220px_1fr]">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  Framework
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Designed for teams that want motion without a new design
                  system.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {registryNotes.map((note) => (
                  <div
                    key={note.title}
                    className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4"
                  >
                    <note.icon
                      aria-hidden="true"
                      className="size-4 text-foreground"
                    />
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm font-medium">{note.title}</h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {note.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
      <span className="font-mono text-sm text-foreground">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function FeaturedItem({ item }: { item: RegistryItem }) {
  const badges = getRegistryItemBadges(item, 2).visible;

  return (
    <Link
      href={item.href}
      className="group -mb-px -mr-px flex min-h-52 min-w-0 flex-col justify-between gap-6 border-b border-r p-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
            <FileJson2 aria-hidden="true" className="size-3.5" />
            {item.category}
          </span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-base font-medium text-foreground">
            {item.title ?? item.name}
          </h3>
          {item.description ? (
            <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>

      {badges.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
