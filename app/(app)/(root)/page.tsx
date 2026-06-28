import { ArrowRight, Code2 } from "lucide-react";
import Link from "next/link";
import type { SVGProps } from "react";

import {
  ComponentPreviewBrowser,
  type ComponentPreviewBrowserItem,
} from "@/components/component-preview-browser";
import { HomeHeroMark } from "@/components/home-hero-mark";
import { RegistryKindIcon } from "@/components/registry-kind-icon";
import { buttonVariants } from "@/components/ui/button";
import {
  getRegistryItem,
  getRegistryItemBadges,
  getRegistryItemsByCategory,
  type RegistryItem,
} from "@/lib/registry";
import {
  getRegistryKindFromCategory,
  getRegistryKindLabel,
} from "@/lib/registry-kind";
import { getRegistryItemUrl } from "@/lib/site-url";
import { CopyButton } from "@/registry/base/ui/copy-button";

const homeRegistryItemNames = [
  "smooth-height",
  "copy-button",
  "status-button",
  "jitter-animation",
  "squeeze-animation",
  "highlight-tabs",
  "text-morph",
  "multi-step",
  "adaptive-drawer",
  "use-reduced-motion",
] as const;

// Keep the preview browser curated independently from the registry highlight grid.
// These should be UI components with strong live demos, in the order they appear.
const componentPreviewNames = [
  "expandable-tabs",
  "highlight-tabs",
  "smooth-height",
  "status-button",
  "multi-step",
  "adaptive-drawer",
  "text-morph",
] as const;

const builtOn = [
  {
    label: "shadcn/ui",
    icon: ShadcnUiIcon,
    iconClassName: "size-4",
  },
  {
    label: "Base UI",
    icon: BaseUiIcon,
    iconClassName: "h-4 w-3",
  },
  {
    label: "Motion",
    icon: MotionIcon,
    iconClassName: "h-4 w-12",
  },
  {
    label: "Tailwind CSS",
    icon: TailwindCssIcon,
    iconClassName: "h-4 w-7",
  },
] as const;

export default function Home() {
  const installCommand = `npx shadcn@latest add ${getRegistryItemUrl(
    "copy-button",
  )}`;
  const homeRegistryItems = homeRegistryItemNames
    .map((name) => getRegistryItem(name))
    .filter((item): item is RegistryItem => item !== undefined);
  const componentCount = getRegistryItemsByCategory("ui").length;
  const hookCount = getRegistryItemsByCategory("hooks").length;
  const blockCount = getRegistryItemsByCategory("blocks").length;
  const previewItems: ComponentPreviewBrowserItem[] = componentPreviewNames
    .map((name) => getRegistryItem(name))
    .filter((item): item is RegistryItem => item !== undefined)
    .filter((item) => item.category === "ui")
    .map((item) => ({
      name: item.name,
      title: item.title ?? item.name,
      description: item.description,
      href: item.href,
      installUrl: getRegistryItemUrl(item.name),
      badges: getRegistryItemBadges(item, 2).visible,
    }));

  return (
    <main className="isolate min-h-[calc(100vh-3.5rem)] bg-background text-foreground">
      <section className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(340px,42vw)_minmax(0,1fr)] lg:items-start">
        <div className="relative flex min-h-[560px] flex-col justify-between overflow-hidden border-b px-5 py-8 sm:px-8 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:min-h-0 lg:self-start lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-muted/40 to-transparent"
          />

          <div className="relative z-10 flex max-w-xl flex-col gap-7">
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
            <HomeHeroMark />
          </div>

          <div className="relative z-10 max-w-lg text-xs leading-5 text-muted-foreground">
            Special thanks to{" "}
            <Link
              href="https://x.com/shadcn"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              shadcn
            </Link>
            ,{" "}
            <Link
              href="https://x.com/emilkowalski"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Emil Kowalski
            </Link>
            ,{" "}
            <Link
              href="https://x.com/mannupaaji"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Manu Arora
            </Link>
            ,{" "}
            <Link
              href="https://x.com/saurra3h"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Saurabh
            </Link>
            , and the open-source UI work that shaped this site.
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
                  <Stat
                    href="/components"
                    value={componentCount}
                    label="components"
                  />
                  <Stat href="/hooks" value={hookCount} label="hooks" />
                  <Stat href="/blocks" value={blockCount} label="blocks" />
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
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-muted-foreground">
                {builtOn.map(({ label, icon: Icon, iconClassName }) => (
                  <span
                    key={label}
                    className="inline-flex min-w-0 items-center gap-2"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center text-foreground">
                      <Icon aria-hidden="true" className={iconClassName} />
                    </span>
                    <span>{label}</span>
                  </span>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <h2 className="shrink-0 text-xl font-semibold tracking-tight">
                  Registry highlights
                </h2>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-4">
                {homeRegistryItems.map((item) => (
                  <FeaturedItem key={item.name} item={item} />
                ))}
              </div>
            </section>

            <ComponentPreviewBrowser items={previewItems} />
          </div>
        </div>
      </section>
    </main>
  );
}

function ShadcnUiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" {...props}>
      <path fill="none" d="M0 0h256v256H0z" />
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="25"
        d="M208 128l-80 80M192 40L40 192"
      />
    </svg>
  );
}

function BaseUiIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 17 24" {...props}>
      <path d="M9.5 7.015A.477.477 0 0 0 9 7.5V23a8 8 0 0 0 .5-15.985ZM8 9.8V23c-4.418 0-8-3.94-8-8.8V1c4.418 0 8 3.94 8 8.8Z" />
    </svg>
  );
}

function MotionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 1103 386" {...props}>
      <path
        fill="#FFF312"
        d="M416.473 0 198.54 385.66H0L170.17 84.522C196.549 37.842 262.377 0 317.203 0Zm486.875 96.415c0-53.249 44.444-96.415 99.27-96.415 54.826 0 99.27 43.166 99.27 96.415 0 53.248-44.444 96.415-99.27 96.415-54.826 0-99.27-43.167-99.27-96.415ZM453.699 0h198.54L434.306 385.66h-198.54Zm234.492 0h198.542L716.56 301.138c-26.378 46.68-92.207 84.522-147.032 84.522h-99.27Z"
      />
    </svg>
  );
}

function TailwindCssIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 54 33" {...props}>
      <g clipPath="url(#tailwindcss-home-icon-a)">
        <path
          clipRule="evenodd"
          fill="#38bdf8"
          fillRule="evenodd"
          d="M27 0c-7.2 0-11.7 3.6-13.5 10.8 2.7-3.6 5.85-4.95 9.45-4.05 2.054.513 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.513-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z"
        />
      </g>
      <defs>
        <clipPath id="tailwindcss-home-icon-a">
          <path fill="#fff" d="M0 0h54v32.4H0z" />
        </clipPath>
      </defs>
    </svg>
  );
}

function Stat({
  href,
  value,
  label,
}: {
  href: string;
  value: number;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`View ${value} ${label}`}
      className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="font-mono text-sm text-foreground">{value}</span>
      <span>{label}</span>
    </Link>
  );
}

function FeaturedItem({ item }: { item: RegistryItem }) {
  const badges = getRegistryItemBadges(item, 2).visible;
  const registryKind = getRegistryKindFromCategory(item.category);

  return (
    <Link
      href={item.href}
      className="group -mb-px -mr-px flex min-h-52 min-w-0 flex-col justify-between gap-6 border-b border-r p-5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
            {registryKind ? (
              <RegistryKindIcon kind={registryKind} className="size-3.5" />
            ) : null}
            {registryKind ? getRegistryKindLabel(registryKind) : item.category}
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
