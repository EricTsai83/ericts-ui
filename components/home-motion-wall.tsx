"use client";

import {
  ArrowUpRight,
  Bell,
  ChevronsLeftRight,
  ChevronsRightLeft,
  FilePlus2,
  FolderPlus,
  Mail,
  Plus,
  Volume1,
  Volume2,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import * as React from "react";

import { useReducedMotion } from "@/registry/base/hooks/use-reduced-motion";
import { CheckAnimation } from "@/registry/base/ui/check-animation";
import {
  ExpandableTabs,
  type ExpandableTabItem,
} from "@/registry/base/ui/expandable-tabs";
import { ExpandableToolbar } from "@/registry/base/ui/expandable-toolbar";
import {
  ExpandingSlider,
  ExpandingSliderTrack,
  ExpandingSliderTrigger,
} from "@/registry/base/ui/expanding-slider";
import { MultiStep } from "@/registry/base/ui/multi-step";
import { OTPInput } from "@/registry/base/ui/otp-input";
import { StatusButton } from "@/registry/base/ui/status-button";
import { TextMorph } from "@/registry/base/ui/text-morph";
import { Button } from "@/components/ui/button";

export type HomeMotionWallItem = {
  name: string;
  title: string;
  href: string;
};

type VignetteProps = {
  /** Increments on every scenario step; each vignette derives its state from it. */
  run: number;
};

/**
 * Lead-in before the first tile starts playing once the wall scrolls into
 * view, so the page settles before anything moves.
 */
const LEAD_IN_MS = 500;

const MULTI_STEP_ITEMS = [
  { id: "workspace", title: "Create a workspace", lines: [128, 88] },
  { id: "team", title: "Invite the team", lines: [104, 136] },
  { id: "ship", title: "Ship it", lines: [96] },
] as const;

function MultiStepVignette({ run }: VignetteProps) {
  return (
    <div className="w-full max-w-60 rounded-xl border bg-background p-4 shadow-sm">
      <MultiStep
        currentStep={run % MULTI_STEP_ITEMS.length}
        steps={MULTI_STEP_ITEMS.map((step) => ({
          id: step.id,
          content: (
            <div className="flex flex-col gap-2.5 pb-1">
              <p className="text-sm font-semibold">{step.title}</p>
              {step.lines.map((width, index) => (
                <span
                  key={`${width}-${index}`}
                  className="block h-2 max-w-full rounded-full bg-muted"
                  style={{ width }}
                />
              ))}
            </div>
          ),
        }))}
      />
    </div>
  );
}

const OTP_CODE = "2489";
/** Four typed digits plus the success beat; step 0 is the empty poster frame. */
const OTP_STEPS = OTP_CODE.length + 1;

function OtpInputVignette({ run }: VignetteProps) {
  const typed = run % OTP_STEPS;

  // The success check draws to the right of the slots (absolutely positioned
  // past their edge), so reserve that gutter inside the centered frame — the
  // stage clips overflow and would otherwise cut the check off.
  return (
    <div className="pr-10">
      <OTPInput
        aria-label="One-time code demo"
        length={OTP_CODE.length}
        value={OTP_CODE.slice(0, typed)}
        status={typed === OTP_CODE.length ? "success" : "idle"}
      />
    </div>
  );
}

/** Collapsed poster, then three expanded beats sliding the volume around. */
const VOLUME_STEPS = [65, 65, 20, 90] as const;

function ExpandingSliderVignette({ run }: VignetteProps) {
  const phase = run % VOLUME_STEPS.length;
  const volume = VOLUME_STEPS[phase];
  const VolumeIcon = volume < 50 ? Volume1 : Volume2;

  return (
    <ExpandingSlider
      label="Volume"
      value={volume}
      expanded={phase !== 0}
      trackWidth={96}
      formatValueText={(value) => `${value}%`}
    >
      <ExpandingSliderTrigger aria-label="Volume">
        <VolumeIcon />
      </ExpandingSliderTrigger>
      <ExpandingSliderTrack />
    </ExpandingSlider>
  );
}

function StatusButtonVignette({ run }: VignetteProps) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const lastRun = React.useRef(0);

  // StatusButton owns its idle → loading → success cycle behind a click, so
  // the player presses the (inert to visitors) button once per step.
  React.useEffect(() => {
    if (run === 0 || run === lastRun.current) return;

    lastRun.current = run;
    frameRef.current?.querySelector("button")?.click();
  }, [run]);

  return (
    <div ref={frameRef}>
      <StatusButton
        className="min-w-44"
        idleLabel="Send me a login link"
        successLabel="Login link sent!"
        loadingDuration={1000}
        successDuration={1200}
      />
    </div>
  );
}

const EXPANDABLE_TAB_ITEMS: ExpandableTabItem[] = [
  {
    id: "create",
    label: "Create",
    icon: <Plus className="size-4" />,
    items: [
      {
        id: "file",
        label: "New file",
        icon: <FilePlus2 className="size-4" />,
        shortcut: "⌘N",
      },
      {
        id: "folder",
        label: "New folder",
        icon: <FolderPlus className="size-4" />,
      },
    ],
  },
  {
    id: "inbox",
    label: "Inbox",
    icon: <Bell className="size-4" />,
    items: [
      { id: "mentions", label: "Mentions", description: "2 new" },
      { id: "assigned", label: "Assigned to you", description: "Triage" },
    ],
  },
];

const EXPANDABLE_TAB_VALUES = [null, "create", "inbox"] as const;

function ExpandableTabsVignette({ run }: VignetteProps) {
  return (
    <div className="relative flex h-48 w-full items-end justify-center">
      <ExpandableTabs
        aria-label="Quick actions demo"
        items={EXPANDABLE_TAB_ITEMS}
        value={EXPANDABLE_TAB_VALUES[run % EXPANDABLE_TAB_VALUES.length]}
      />
    </div>
  );
}

function ExpandableToolbarVignette({ run }: VignetteProps) {
  return (
    // side="center" splits the actions around a pinned trigger, so the
    // toolbar grows symmetrically out of the middle of the stage.
    <ExpandableToolbar
      open={run % 2 === 1}
      side="center"
      anchor="trigger"
      expandIcon={<ChevronsLeftRight aria-hidden="true" />}
      collapseIcon={<ChevronsRightLeft aria-hidden="true" />}
      expandLabel="Show quick actions"
      collapseLabel="Hide quick actions"
    >
      <Button type="button" variant="ghost" size="icon-sm" aria-label="New file">
        <FilePlus2 aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="New folder"
      >
        <FolderPlus aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Notifications"
      >
        <Bell aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Send invite"
      >
        <Mail aria-hidden="true" />
      </Button>
    </ExpandableToolbar>
  );
}

function CheckAnimationVignette({ run }: VignetteProps) {
  return (
    <div key={run} className="flex items-center gap-8">
      <CheckAnimation
        variant="square"
        size="lg"
        label="Checked"
        className="text-foreground"
      />
      <CheckAnimation
        variant="circle"
        size="lg"
        label="Verified"
        className="text-primary"
      />
    </div>
  );
}

// Anagrams: every word reuses the exact same letters, so nothing fades in or
// out — the morph is pure movement, which is the component at its best.
const MORPH_WORDS = ["listen", "silent", "enlist"] as const;

function TextMorphVignette({ run }: VignetteProps) {
  return (
    <TextMorph className="text-2xl font-semibold tracking-tight">
      {MORPH_WORDS[run % MORPH_WORDS.length]}
    </TextMorph>
  );
}

type WallVignette = {
  Component: React.ComponentType<VignetteProps>;
  /** How many steps one playback cycle of this vignette runs through. */
  steps: number;
  /**
   * Dwell after each step: long enough for the motion to finish and rest.
   * An array assigns each step its own dwell (the last entry repeats), for
   * scenarios with one slow beat — e.g. the OTP success check draw.
   */
  stepMs: number | readonly number[];
};

function dwellMs(stepMs: WallVignette["stepMs"], stepIndex: number) {
  return typeof stepMs === "number"
    ? stepMs
    : stepMs[Math.min(stepIndex, stepMs.length - 1)];
}

const vignettes: Record<string, WallVignette> = {
  "multi-step": { Component: MultiStepVignette, steps: 3, stepMs: 1500 },
  "otp-input": {
    Component: OtpInputVignette,
    steps: OTP_STEPS,
    // Four typing beats, a long success beat so the check finishes drawing
    // and reads, then a short cleared beat before the cycle hands off.
    stepMs: [600, 600, 600, 1900, 500],
  },
  "expanding-slider": {
    Component: ExpandingSliderVignette,
    steps: VOLUME_STEPS.length,
    stepMs: 1000,
  },
  "status-button": {
    Component: StatusButtonVignette,
    steps: 1,
    stepMs: 2800,
  },
  "expandable-tabs": {
    Component: ExpandableTabsVignette,
    steps: 3,
    stepMs: 1300,
  },
  "expandable-toolbar": {
    Component: ExpandableToolbarVignette,
    steps: 2,
    stepMs: 1200,
  },
  "check-animation": {
    Component: CheckAnimationVignette,
    steps: 1,
    stepMs: 1800,
  },
  "text-morph": { Component: TextMorphVignette, steps: 3, stepMs: 1100 },
};

type Playback = {
  index: number;
  /** Steps already fired in the current cycle; the last one is still filling. */
  stepsFired: number;
  /** Hover playback loops on one tile; auto advances to the next tile. */
  mode: "auto" | "hover";
};

export function HomeMotionWall({ items }: { items: HomeMotionWallItem[] }) {
  const shown = React.useMemo(
    () => items.filter((item) => vignettes[item.name]),
    [items],
  );
  const count = shown.length;
  const gridRef = React.useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [runs, setRuns] = React.useState<number[]>([]);
  const [playback, setPlayback] = React.useState<Playback>({
    index: 0,
    stepsFired: 0,
    mode: "auto",
  });
  const [inView, setInView] = React.useState(false);
  const [pageVisible, setPageVisible] = React.useState(true);
  const [focusPaused, setFocusPaused] = React.useState(false);

  const fire = React.useCallback(
    (index: number) => {
      setRuns((runs) =>
        Array.from(
          { length: count },
          (_, i) => (runs[i] ?? 0) + (i === index ? 1 : 0),
        ),
      );
    },
    [count],
  );

  React.useEffect(() => {
    const node = gridRef.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.2 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const update = () => setPageVisible(!document.hidden);

    update();
    document.addEventListener("visibilitychange", update);

    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const canPlay =
    !shouldReduceMotion && inView && pageVisible && !focusPaused && count > 0;

  React.useEffect(() => {
    if (!canPlay) return;

    const current = shown[playback.index % count];
    const { steps, stepMs } = vignettes[current.name];
    const delay =
      playback.stepsFired === 0
        ? LEAD_IN_MS
        : dwellMs(stepMs, playback.stepsFired - 1);

    const id = setTimeout(() => {
      if (playback.stepsFired < steps) {
        fire(playback.index);
        setPlayback((p) => ({ ...p, stepsFired: p.stepsFired + 1 }));
      } else if (playback.mode === "hover") {
        fire(playback.index);
        setPlayback((p) => ({ ...p, stepsFired: 1 }));
      } else {
        const next = (playback.index + 1) % count;

        fire(next);
        setPlayback({ index: next, stepsFired: 1, mode: "auto" });
      }
    }, delay);

    return () => clearTimeout(id);
  }, [canPlay, count, fire, playback, shown]);

  const startHoverPlayback = React.useCallback(
    (index: number) => {
      fire(index);
      setPlayback({ index, stepsFired: 1, mode: "hover" });
    },
    [fire],
  );

  if (count === 0) return null;

  const activeIndex = playback.index % count;

  // Hidden below sm: playback lights up one tile at a time, and in a
  // single-column stack the active tile is usually off-screen — the wall
  // reads as static posters. ComponentPreviewBrowser covers live demos there.
  return (
    <section className="hidden flex-col gap-6 sm:flex">
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 text-xl font-semibold tracking-tight">
          Live from the registry
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div
        ref={gridRef}
        onPointerLeave={() =>
          setPlayback((p) => (p.mode === "hover" ? { ...p, mode: "auto" } : p))
        }
        onFocusCapture={() => setFocusPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocusPaused(false);
          }
        }}
        className="grid overflow-hidden rounded-lg border sm:grid-cols-2"
      >
        {shown.map((item, index) => (
          <WallTile
            key={item.name}
            item={item}
            index={index}
            playing={canPlay && index === activeIndex}
            stepsFired={index === activeIndex ? playback.stepsFired : 0}
            run={runs[index] ?? 0}
            hoverPlayEnabled={!shouldReduceMotion}
            onPlay={startHoverPlayback}
          />
        ))}
      </div>
    </section>
  );
}

function WallTile({
  item,
  index,
  playing,
  stepsFired,
  run,
  hoverPlayEnabled,
  onPlay,
}: {
  item: HomeMotionWallItem;
  index: number;
  playing: boolean;
  stepsFired: number;
  run: number;
  hoverPlayEnabled: boolean;
  onPlay: (index: number) => void;
}) {
  const { Component: Vignette, steps, stepMs } = vignettes[item.name];

  return (
    <div
      onPointerEnter={() => {
        if (hoverPlayEnabled) onPlay(index);
      }}
      className="group/tile relative -mb-px -mr-px flex min-w-0 flex-col border-b border-r"
    >
      {/* A fixed-height, clipped stage: vignettes that animate their own size
          (multi-step, the toolbar, the OTP success state) stay inside their
          frame instead of stretching the tile and shifting the page. */}
      <div className="relative flex h-60 items-center justify-center overflow-hidden px-5">
        {/* The vignettes are playback footage, not controls: inert keeps them
            unclickable and out of the focus order / accessibility tree. */}
        <div inert className="flex w-full items-center justify-center">
          <Vignette run={run} />
        </div>

        {playing ? (
          <div
            aria-hidden="true"
            className="absolute inset-x-5 bottom-3 flex gap-1"
          >
            {Array.from({ length: steps }, (_, step) => (
              <span
                key={step}
                className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/15"
              >
                {step < stepsFired - 1 ? (
                  <span className="block h-full w-full bg-foreground/60" />
                ) : step === stepsFired - 1 ? (
                  <motion.span
                    key={run}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: dwellMs(stepMs, step) / 1000,
                      ease: "linear",
                    }}
                    className="block h-full w-full origin-left bg-foreground/60"
                  />
                ) : null}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <Link
        href={item.href}
        className="group/link inline-flex items-center gap-1 self-start rounded-sm px-4 pb-3.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {item.title}
        <ArrowUpRight
          aria-hidden="true"
          className="size-3 -translate-x-0.5 opacity-0 transition-[opacity,transform] duration-150 group-hover/link:translate-x-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100"
        />
      </Link>
    </div>
  );
}
