import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Blocks,
  Braces,
  Component,
} from "lucide-react";
import Link from "next/link";

import { NotFoundMark, RequestedPath } from "@/components/not-found-mark";
import { buttonVariants } from "@/components/ui/button";

const destinations = [
  {
    href: "/components",
    label: "Components",
    description: "Animated UI you can install as source.",
    icon: Component,
  },
  {
    href: "/hooks",
    label: "Hooks",
    description: "Reusable motion and behavior hooks.",
    icon: Braces,
  },
  {
    href: "/blocks",
    label: "Blocks",
    description: "Composed patterns ready to drop in.",
    icon: Blocks,
  },
  {
    href: "/docs",
    label: "Docs",
    description: "Setup, usage, and conventions.",
    icon: BookOpen,
  },
];

export default function NotFound() {
  return (
    <main className="relative isolate flex flex-1 flex-col overflow-hidden bg-background text-foreground">
      {/* Dotted grid + soft glow, faded toward the edges. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, var(--border) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(ellipse 80% 65% at 50% 38%, black 25%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 65% at 50% 38%, black 25%, transparent 78%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[28%] -z-10 size-[min(70vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted/50 blur-3xl"
      />

      <div className="flex flex-1 items-center justify-center px-5 py-24 sm:px-8">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <NotFoundMark />

          <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              This page skipped a beat.
            </h1>
            <div className="flex max-w-full items-center gap-2 text-sm text-muted-foreground">
              <span className="shrink-0">You tried</span>
              <RequestedPath />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/"
              className={buttonVariants({ variant: "default", size: "lg" })}
            >
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Back to home
            </Link>
            <Link
              href="/components"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Browse components
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-2 grid w-full gap-px overflow-hidden rounded-lg border bg-border text-left sm:grid-cols-2">
            {destinations.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 bg-background p-4 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-muted-foreground transition-colors group-hover:text-foreground">
                  <item.icon aria-hidden="true" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
