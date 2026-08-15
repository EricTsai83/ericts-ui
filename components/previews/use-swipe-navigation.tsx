"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { useSwipeNavigation } from "@/registry/base/hooks/use-swipe-navigation";

const pages = [
  {
    title: "Overview",
    description: "A compact summary for the current workspace.",
    label: "12 active projects",
  },
  {
    title: "Activity",
    description: "Recent changes from the people on your team.",
    label: "8 updates today",
  },
  {
    title: "Settings",
    description: "Preferences that apply across every project.",
    label: "3 preferences changed",
  },
] as const;

export default function Preview() {
  const [activeIndex, setActiveIndex] = useState(1);
  const [volume, setVolume] = useState(48);
  const currentPage = pages[activeIndex] ?? pages[0];
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < pages.length - 1;

  const navigatePrevious = useCallback(() => {
    setActiveIndex((index) => Math.max(0, index - 1));
  }, []);

  const navigateNext = useCallback(() => {
    setActiveIndex((index) => Math.min(pages.length - 1, index + 1));
  }, []);

  const swipeRef = useSwipeNavigation<HTMLDivElement>({
    onPrevious: navigatePrevious,
    onNext: navigateNext,
    hasPrevious,
    hasNext,
    ignoreOwnedGestures: true,
    feedback: {
      distance: 24,
      resistance: 0.3,
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
      <p className="text-center text-sm leading-6 text-muted-foreground">
        Swipe the content on touch, or use the arrows. The slider keeps its own
        horizontal gesture.
      </p>

      <div className="overflow-hidden rounded-lg border bg-background">
        <div className="flex h-11 items-center justify-between border-b px-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!hasPrevious}
            aria-label="Previous page"
            onClick={navigatePrevious}
          >
            <ArrowLeft aria-hidden="true" />
          </Button>

          <output
            aria-live="polite"
            className="text-xs font-medium tabular-nums text-muted-foreground"
          >
            {activeIndex + 1} of {pages.length}
          </output>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!hasNext}
            aria-label="Next page"
            onClick={navigateNext}
          >
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>

        <div
          ref={swipeRef}
          role="region"
          aria-label="Swipe navigation demo"
          className="min-h-56 p-5 sm:p-6"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold">{currentPage.title}</h3>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {currentPage.description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 border-y py-3">
              <span className="text-sm font-medium">{currentPage.label}</span>
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-foreground/65"
              />
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Owned gesture · {volume}%
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="h-5 w-full cursor-pointer accent-foreground"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
