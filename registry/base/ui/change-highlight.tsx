"use client";

import { useEffect, useRef, type ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export type ChangeHighlightProps = ComponentProps<"span"> & {
  /** Changing this value triggers a highlight; the initial render does not. */
  value: string | number;
  /** Fade-out time in milliseconds. Applies from the next highlight. */
  duration?: number;
  /** Time the highlight stays bright after the latest change, in milliseconds. Applies from the next highlight. */
  holdDuration?: number;
  highlightClassName?: string;
};

const ATTACK = 120;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type Highlight = {
  animation: Animation;
  from: number;
  hold: number;
  fade: number;
};

/** Highlight changed content without moving it or announcing decorative frames. */
export function ChangeHighlight({
  value,
  children,
  duration = 600,
  holdDuration = 180,
  highlightClassName,
  className,
  ...props
}: ChangeHighlightProps) {
  const overlayRef = useRef<HTMLSpanElement>(null);
  const previousValue = useRef(value);
  const highlight = useRef<Highlight | null>(null);
  // Timing is read when a highlight starts, so changing it never interrupts
  // one that is already running.
  const timing = useRef({ duration, holdDuration });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    timing.current = { duration, holdDuration };
  }, [duration, holdDuration]);

  useEffect(() => {
    const changed = !Object.is(previousValue.current, value);
    previousValue.current = value;
    if (reducedMotion) {
      highlight.current?.animation.cancel();
      highlight.current = null;
      return;
    }
    const overlay = overlayRef.current;
    if (!changed || !overlay) return;
    // Resume from the visible brightness, computed from the running animation's
    // clock rather than read back from the DOM (which would force a style recalc).
    const from = highlight.current ? getOpacity(highlight.current) : 0;
    highlight.current?.animation.cancel();
    const fade = toMilliseconds(timing.current.duration, 600);
    const hold = toMilliseconds(timing.current.holdDuration, 180);
    const total = ATTACK + hold + fade;
    const easing = `cubic-bezier(${EASE_OUT.join(", ")})`;
    const animation = overlay.animate(
      [
        { opacity: from, offset: 0, easing },
        { opacity: 1, offset: ATTACK / total, easing: "linear" },
        { opacity: 1, offset: (ATTACK + hold) / total, easing },
        { opacity: 0, offset: 1 },
      ],
      { duration: total, easing: "linear" },
    );
    highlight.current = { animation, from, hold, fade };
  }, [value, reducedMotion]);

  useEffect(
    () => () => {
      highlight.current?.animation.cancel();
      highlight.current = null;
    },
    [],
  );

  return (
    <span
      {...props}
      data-slot="change-highlight"
      className={cn("relative isolate inline-block rounded-md", className)}
    >
      <span
        ref={overlayRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -inset-x-2 -inset-y-1 -z-10 rounded-[inherit] bg-foreground/10 opacity-0",
          highlightClassName,
        )}
      />
      {children}
    </span>
  );
}

function toMilliseconds(value: number, fallback: number) {
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
}

/** Evaluates the same keyframes `animate` was given, at the animation's current time. */
function getOpacity({ animation, from, hold, fade }: Highlight) {
  const time = Number(animation.currentTime ?? Infinity);
  if (animation.playState === "finished" || !Number.isFinite(time)) return 0;
  if (time < ATTACK) return from + (1 - from) * easeOut(time / ATTACK);
  if (time < ATTACK + hold) return 1;
  if (fade > 0 && time < ATTACK + hold + fade)
    return 1 - easeOut((time - ATTACK - hold) / fade);
  return 0;
}

/** CSS `cubic-bezier(EASE_OUT)`: solve x(t) = progress for t, then return y(t). */
function easeOut(progress: number) {
  const [x1, y1, x2, y2] = EASE_OUT;
  const curve = (t: number, p1: number, p2: number) =>
    3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t;
  let low = 0;
  let high = 1;
  let t = progress;
  for (let step = 0; step < 24; step++) {
    const x = curve(t, x1, x2);
    if (Math.abs(x - progress) < 1e-5) break;
    if (x < progress) low = t;
    else high = t;
    t = (low + high) / 2;
  }
  return curve(t, y1, y2);
}
