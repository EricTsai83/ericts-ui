import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SVGProps } from "react";

import { HomeHeroMark } from "@/components/home-hero-mark";
import {
  HomeRegistryIndex,
  type HomeRegistryIndexGroup,
} from "@/components/home-registry-index";
import { buttonVariants } from "@/components/ui/button";
import { getRegistryItemsByCategory } from "@/lib/registry";
import {
  getRegistryDisplayItems,
  getRegistryDisplayNavigationGroups,
} from "@/lib/registry-display";

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
  // Components carry enough items to be worth splitting by semantic category;
  // hooks and blocks are short enough that their own sub-categories would read
  // as noise, so each collapses to a single kind-labelled group.
  const indexGroups: HomeRegistryIndexGroup[] = [
    ...getRegistryDisplayNavigationGroups("component").map((group) => ({
      label: group.label,
      items: group.items.map(toIndexItem),
    })),
    ...(["hook", "block"] as const).map((kind) => ({
      label: kind === "hook" ? "Hooks" : "Blocks",
      items: getRegistryDisplayItems(kind)
        .filter((item) => item.browsable !== false)
        .map(toIndexItem),
    })),
  ].filter((group) => group.items.length > 0);
  const componentCount = getRegistryItemsByCategory("ui").length;
  const hookCount = getRegistryItemsByCategory("hooks").length;
  const blockCount = getRegistryItemsByCategory("blocks").length;

  return (
    <main className="isolate min-h-[calc(100vh-3.5rem)] text-foreground">
      <section className="grid lg:grid-cols-[minmax(360px,40vw)_minmax(0,1fr)] lg:items-start">
        <div className="relative flex min-h-[calc(100vh-3.5rem)] flex-col justify-between gap-8 overflow-hidden border-b px-5 py-8 sm:px-8 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:min-h-0 lg:self-start lg:border-b-0 lg:border-r lg:px-10 lg:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-muted/40 to-transparent"
          />

          <div className="relative z-10 flex max-w-xl flex-col gap-7">
            <div className="flex flex-col gap-5">
              <h1 className="max-w-[18ch] text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Motion-First Components
              </h1>
              <p className="max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                Components, hooks, and blocks for any shadcn/ui project. Each
                installs as source, so the timing stays yours to tune.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
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

          <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center py-1">
            <HomeHeroMark />
          </div>

          <div className="relative z-10 flex flex-col gap-7">
            <div className="flex flex-wrap gap-x-10 gap-y-5">
              <Stat
                href="/components"
                value={componentCount}
                label="components"
              />
              <Stat href="/hooks" value={hookCount} label="hooks" />
              <Stat href="/blocks" value={blockCount} label="blocks" />
            </div>

            <div className="flex flex-col gap-2.5">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Built on
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
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
            </div>
          </div>
        </div>

        <div className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10 xl:px-12">
          <div className="mx-auto max-w-6xl">
            <HomeRegistryIndex groups={indexGroups} />
          </div>
        </div>
      </section>

    </main>
  );
}

function toIndexItem(item: { name: string; title: string; href: string }) {
  return { name: item.name, title: item.title, href: item.href };
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
      className="group flex min-w-0 flex-col gap-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="font-mono text-3xl font-medium leading-none tabular-nums text-foreground">
        {value}
      </span>
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground underline-offset-4 transition-colors group-hover:text-foreground group-hover:underline">
        {label}
      </span>
    </Link>
  );
}
