"use client";

import {
  useSequencePlayer,
  type SequenceScript,
} from "@/registry/base/hooks/use-sequence-player";
import { cn } from "@/lib/utils";

// Three deliberately plain demos: the hook's job is the spotlight, so the
// sequences only need enough state to show which one is currently playing.
const sequences: readonly (SequenceScript & { label: string })[] = [
  { label: "Bars", steps: 3, stepMs: 900 },
  { label: "Trail", steps: 4, stepMs: [700, 700, 700, 1200] },
  { label: "Toggle", steps: 2, stepMs: 1000 },
];

const BAR_FRAMES = [
  [40, 70, 30],
  [70, 30, 55],
  [30, 55, 80],
];

function Bars({ run }: { run: number }) {
  const heights = BAR_FRAMES[run % BAR_FRAMES.length] ?? BAR_FRAMES[0];

  return (
    <div className="flex h-16 items-end gap-1.5">
      {heights.map((height, index) => (
        <span
          key={index}
          style={{ height: `${height}%` }}
          className="w-3 rounded-sm bg-foreground/70 transition-[height] duration-500 ease-out"
        />
      ))}
    </div>
  );
}

const TRAIL_SLOTS = 4;

function Trail({ run }: { run: number }) {
  const position = run % TRAIL_SLOTS;

  return (
    <div className="flex h-16 items-center gap-2">
      {Array.from({ length: TRAIL_SLOTS }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-3 rounded-full transition-colors duration-300",
            index <= position ? "bg-foreground/70" : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

function Toggle({ run }: { run: number }) {
  const on = run % 2 === 1;

  return (
    <div className="flex h-16 items-center">
      <span
        data-on={on ? "" : undefined}
        className="group/toggle flex h-6 w-11 items-center rounded-full bg-muted p-0.5 transition-colors duration-300 data-on:bg-foreground/70"
      >
        <span className="size-5 rounded-full bg-background transition-transform duration-300 ease-out group-data-on/toggle:translate-x-5" />
      </span>
    </div>
  );
}

const demos = [Bars, Trail, Toggle];

export default function Preview() {
  const { containerProps, activeIndex, stepsFired, runs, isPlaying, takeOver } =
    useSequencePlayer({ sequences });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <p className="text-center text-sm leading-6 text-muted-foreground">
        One demo plays at a time. Hover a card to take the spotlight; it returns
        to the rotation when you leave.
      </p>

      <div
        {...containerProps}
        className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3"
      >
        {sequences.map((sequence, index) => {
          const Demo = demos[index] ?? demos[0];
          const playing = isPlaying && index === activeIndex;

          return (
            <div
              key={sequence.label}
              onPointerEnter={() => takeOver(index)}
              className={cn(
                "flex flex-col items-center gap-3 bg-background px-4 py-4 transition-colors duration-500",
                playing && "bg-muted/40",
              )}
            >
              <Demo run={runs[index] ?? 0} />

              <div className="flex w-full items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {sequence.label}
                </span>
                <span aria-hidden="true" className="flex gap-1">
                  {Array.from({ length: sequence.steps }, (_, step) => (
                    <span
                      key={step}
                      className={cn(
                        "size-1.5 rounded-full transition-colors duration-200",
                        playing && step < stepsFired
                          ? "bg-foreground/60"
                          : "bg-foreground/15",
                      )}
                    />
                  ))}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
