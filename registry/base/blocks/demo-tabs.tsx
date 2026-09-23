"use client";

import * as React from "react";
import { Tabs } from "@base-ui/react/tabs";
import {
  motion,
  motionValue,
  useTransform,
  type MotionValue,
} from "motion/react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export type DemoTabsScene = {
  /** Shared, linear playback position, from 0 to 1. Use useTransform in a child. */
  progress: MotionValue<number>;
  isPlaying: boolean;
  reducedMotion: boolean;
};

export type DemoTabsItem = {
  /** Unique, stable identifier. */
  value: string;
  label: string;
  description?: string;
  /** Total scene length in milliseconds, including time to read the final frame. */
  duration: number;
  render: (scene: DemoTabsScene) => React.ReactNode;
};

export type DemoTabsProps = Omit<
  React.ComponentProps<"section">,
  "children" | "defaultValue" | "onChange"
> & {
  items: readonly DemoTabsItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  autoPlay?: boolean;
  loop?: boolean;
  selectorLabel?: string;
  emptyLabel?: string;
  classNames?: {
    list?: string;
    tab?: string;
    progress?: string;
    panel?: string;
  };
};

function ProgressLine({
  progress,
  className,
}: {
  progress: MotionValue<number>;
  className?: string;
}) {
  const transform = useTransform(progress, (value) => `scaleX(${value})`);
  return (
    <motion.span
      aria-hidden="true"
      data-slot="demo-tabs-progress"
      className={cn(
        "absolute inset-x-0 bottom-0 h-px origin-left bg-foreground",
        className,
      )}
      style={{ transform }}
    />
  );
}

/**
 * A single clock drives the active scene and its tab underline, without React
 * renders on every frame. Scenes should derive ALL motion from progress, not
 * start independent timers. Manual selection plays once and disables advancing.
 */
export function DemoTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  autoPlay = true,
  loop = true,
  selectorLabel = "Choose a demo",
  emptyLabel = "Add a demo to get started.",
  classNames,
  className,
  ref,
  onFocusCapture,
  onBlurCapture,
  ...props
}: DemoTabsProps) {
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = React.useState(
    defaultValue ?? items[0]?.value,
  );
  const active =
    items.find((item) => item.value === (value ?? selected)) ?? items[0];
  const activeValue = active?.value;
  const duration =
    active && Number.isFinite(active.duration) && active.duration > 0
      ? active.duration
      : 6000;
  const [replay, setReplay] = React.useState(0);
  // A new clock resets both scene and underline atomically, including prop changes.
  const progress = React.useMemo(() => {
    void activeValue;
    void replay;
    void duration;
    return motionValue(reducedMotion ? 1 : 0);
  }, [activeValue, duration, replay, reducedMotion]);
  const [completed, setCompleted] = React.useState<MotionValue<number> | null>(
    null,
  );
  const [requestedPlaying, setRequestedPlaying] = React.useState(autoPlay);
  const [previousAutoPlay, setPreviousAutoPlay] = React.useState(autoPlay);
  if (previousAutoPlay !== autoPlay) {
    setPreviousAutoPlay(autoPlay);
    setRequestedPlaying(autoPlay);
  }
  const [manual, setManual] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  const [visible, setVisible] = React.useState(true);
  const [contentFocused, setContentFocused] = React.useState(false);
  const [node, setNode] = React.useState<HTMLElement | null>(null);
  const mergedRef = React.useCallback(
    (element: HTMLElement | null) => {
      setNode(element);
      if (element && typeof IntersectionObserver === "undefined")
        setInView(true);
      if (typeof ref === "function") return ref(element);
      if (ref) ref.current = element;
    },
    [ref],
  );
  const finished = completed === progress;
  const isPlaying =
    Boolean(active) &&
    requestedPlaying &&
    inView &&
    visible &&
    !contentFocused &&
    !reducedMotion &&
    !finished;

  React.useEffect(() => {
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setInView(Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.2)),
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  React.useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const complete = React.useEffectEvent(() => {
    setCompleted(progress);
    if (manual || items.length < 2) return;
    const index = items.findIndex((item) => item.value === activeValue);
    if (index === items.length - 1 && !loop) return;
    const next = items[(index + 1) % items.length];
    if (value === undefined) setSelected(next.value);
    onValueChange?.(next.value);
  });

  React.useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // Also guard here: a visibility event can precede React's effect cleanup.
      if (document.hidden) {
        last = now;
        frame = requestAnimationFrame(tick);
        return;
      }
      const next = Math.min(
        1,
        progress.get() + Math.max(0, now - last) / duration,
      );
      last = now;
      progress.set(next);
      if (next >= 1) complete();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, progress, duration]);

  function select(next: string) {
    setManual(true);
    setRequestedPlaying(true);
    if (next === activeValue) setReplay((count) => count + 1);
    if (value === undefined) setSelected(next);
    if (next !== activeValue) onValueChange?.(next);
  }

  return (
    <section
      {...props}
      ref={mergedRef}
      data-slot="demo-tabs"
      className={cn(
        "@container/demo w-full overflow-hidden rounded-xl border bg-background text-foreground",
        className,
      )}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        // Focus alone is not a choice: keyboard users tabbing past the
        // tablist keep auto-advance. Only `select` (click, Enter/Space on a
        // tab) switches to manual playback.
        setContentFocused(
          Boolean(
            (event.target as HTMLElement).closest(
              '[data-slot="demo-tabs-panel"]',
            ) &&
              event.currentTarget.contains(
                (event.target as HTMLElement).closest(
                  '[data-slot="demo-tabs-panel"]',
                ),
              ),
          ),
        );
      }}
      onBlurCapture={(event) => {
        onBlurCapture?.(event);
        if (!event.currentTarget.contains(event.relatedTarget))
          setContentFocused(false);
      }}
    >
      {active ? (
        <>
          <Tabs.Root
            value={active.value}
            onValueChange={(next) => {
              if (typeof next === "string") select(next);
            }}
          >
            <Tabs.List
              aria-label={selectorLabel}
              activateOnFocus={false}
              className={cn("flex overflow-x-auto border-b", classNames?.list)}
            >
              {items.map((item) => (
                <Tabs.Tab
                  key={item.value}
                  value={item.value}
                  onClick={() => {
                    if (item.value === activeValue) select(item.value);
                  }}
                  className={cn(
                    "relative flex min-w-24 flex-1 flex-col items-start gap-1 border-r px-5 py-4 text-left last:border-r-0 @min-[40rem]/demo:min-w-44 data-active:bg-muted/50 focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    classNames?.tab,
                  )}
                >
                  <span className="font-mono text-xs">{item.label}</span>
                  {item.description && (
                    <span className="hidden whitespace-nowrap text-xs text-muted-foreground @min-[40rem]/demo:block">
                      {item.description}
                    </span>
                  )}
                  {item.value === activeValue && (
                    <ProgressLine
                      progress={progress}
                      className={classNames?.progress}
                    />
                  )}
                </Tabs.Tab>
              ))}
            </Tabs.List>
            {items.map((item) => (
              <Tabs.Panel
                data-slot="demo-tabs-panel"
                key={item.value}
                value={item.value}
                className={cn(
                  "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  classNames?.panel,
                )}
              >
                {item.value === activeValue && (
                  <React.Fragment key={`${item.value}-${replay}`}>
                    {item.render({ progress, isPlaying, reducedMotion })}
                  </React.Fragment>
                )}
              </Tabs.Panel>
            ))}
          </Tabs.Root>
        </>
      ) : (
        <p className="p-8 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </section>
  );
}
