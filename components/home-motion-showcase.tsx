"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Layers,
  MousePointer2,
  PanelTop,
  TextCursorInput,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RegistryPreview } from "@/components/registry-preview";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShowcaseItem = {
  name: string;
  label: string;
  title: string;
  description: string;
  effect: string;
  href: string;
  icon: LucideIcon;
};

const showcaseItems = [
  {
    name: "smooth-height",
    label: "Layout",
    title: "Smooth Height Layout",
    description: "Content changes resize the surface without a hard jump.",
    effect: "height / resize",
    href: "/components/smooth-height",
    icon: PanelTop,
  },
  {
    name: "highlight-tabs",
    label: "Navigation",
    title: "Highlight Tabs",
    description: "Selection moves with shared-layout continuity.",
    effect: "shared layout",
    href: "/components/highlight-tabs",
    icon: Layers,
  },
  {
    name: "text-morph",
    label: "Text",
    title: "Morphing Text",
    description: "Words shift through matching characters, not a blunt fade.",
    effect: "text morph",
    href: "/components/text-morph",
    icon: TextCursorInput,
  },
] satisfies ShowcaseItem[];

const rotateDelay = 3800;
const easeOutQuart = [0.165, 0.84, 0.44, 1] as const;

export function HomeMotionShowcase() {
  const shouldReduceMotion = useReducedMotion();
  const [activeName, setActiveName] = useState(showcaseItems[0].name);
  const [isPaused, setIsPaused] = useState(false);

  const activeItem = useMemo(
    () => showcaseItems.find((item) => item.name === activeName) ?? showcaseItems[0],
    [activeName],
  );

  useEffect(() => {
    if (shouldReduceMotion || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveName((currentName) => {
        const currentIndex = showcaseItems.findIndex(
          (item) => item.name === currentName,
        );
        const nextIndex = (currentIndex + 1) % showcaseItems.length;

        return showcaseItems[nextIndex].name;
      });
    }, rotateDelay);

    return () => window.clearInterval(timer);
  }, [isPaused, shouldReduceMotion]);

  const contentTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ duration: 0.22, ease: easeOutQuart } as const);

  const selectionTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ duration: 0.18, ease: easeOutQuart } as const);

  return (
    <section
      aria-label="Motion component preview"
      className="min-w-0 overflow-hidden rounded-lg border bg-background"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Motion preview</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Small transitions for real component states.
          </p>
        </div>
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <MousePointer2 aria-hidden="true" className="size-3.5" />
          hover to pause
        </div>
      </div>

      <div className="grid min-h-[440px] min-w-0 lg:grid-cols-[176px_1fr]">
        <div className="flex min-w-0 gap-1 overflow-x-auto border-b p-2 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r">
          {showcaseItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.name === activeItem.name;

            return (
              <button
                key={item.name}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveName(item.name)}
                className={cn(
                  "relative flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-36 sm:px-3 lg:min-w-0",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {isActive ? (
                  <motion.span
                    layoutId="home-showcase-active"
                    className="absolute inset-0 rounded-lg bg-muted"
                    transition={selectionTransition}
                  />
                ) : null}
                <Icon aria-hidden="true" className="relative size-4 shrink-0" />
                <span className="relative min-w-0">
                  <span className="block truncate font-medium">
                    {item.label}
                  </span>
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">
                    {item.effect}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-col overflow-hidden">
          <div className="flex min-h-20 items-start justify-between gap-4 border-b px-4 py-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeItem.name}
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, y: 6, filter: "blur(4px)" }
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -4, filter: "blur(3px)" }
                }
                transition={contentTransition}
                className="min-w-0"
              >
                <h2 className="text-base font-semibold tracking-tight">
                  {activeItem.title}
                </h2>
                <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">
                  {activeItem.description}
                </p>
              </motion.div>
            </AnimatePresence>
            <Link
              href={activeItem.href}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "hidden sm:inline-flex",
              )}
            >
              Open
            </Link>
          </div>

          <div className="relative flex min-h-[320px] min-w-0 flex-1 items-center justify-center overflow-hidden bg-muted/30 p-4 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${activeItem.name}-preview`}
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, y: 10, scale: 0.985 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -8, scale: 0.99 }
                }
                transition={contentTransition}
                className="relative flex min-w-0 w-full max-w-full items-center justify-center overflow-hidden"
              >
                <RegistryPreview name={activeItem.name} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="h-1 bg-muted">
            {!shouldReduceMotion && !isPaused ? (
              <motion.div
                key={activeItem.name}
                className="h-full origin-left bg-foreground"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: rotateDelay / 1000, ease: "linear" }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
