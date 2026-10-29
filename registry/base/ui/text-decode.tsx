"use client";

import { useEffect, useRef, type ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export type TextDecodeProps = Omit<ComponentProps<"span">, "children"> & {
  children: string;
  /** Total time in milliseconds, including the last character settling. */
  duration?: number;
  /** Increment to decode the same text again. Text changes also replay. */
  replayKey?: string | number;
  characters?: string;
};

/** Scramble, then lock each grapheme from left to right. No per-frame React renders. */
export function TextDecode({
  children,
  duration = 900,
  replayKey = 0,
  characters = "01ABCDEF<>/{}",
  className,
  ...props
}: TextDecodeProps) {
  const visualRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const visual = visualRef.current;
    if (!visual) return;
    visual.textContent = children;
    if (
      reducedMotion ||
      duration <= 0 ||
      !Number.isFinite(duration) ||
      !children
    )
      return;

    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    const letters = Array.from(
      segmenter.segment(children),
      ({ segment }) => segment,
    );
    const alphabet = Array.from(
      segmenter.segment(characters),
      ({ segment }) => segment,
    );
    if (!alphabet.length) return;
    const started = performance.now();
    let frame = 0;
    let lastTick = -1;
    const draw = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      if (progress >= 1) {
        visual.textContent = children;
        return;
      }
      // Limit text mutations to 25fps while using a single cancellable clock.
      const tick = Math.floor((now - started) / 40);
      if (tick !== lastTick) {
        lastTick = tick;
        const locked = Math.floor(progress * letters.length);
        visual.textContent = letters
          .map((letter, index) =>
            index < locked || !letter.trim()
              ? letter
              : alphabet[Math.floor(Math.random() * alphabet.length)],
          )
          .join("");
      }
      frame = requestAnimationFrame(draw);
    };
    draw(started);
    return () => {
      cancelAnimationFrame(frame);
      visual.textContent = children;
    };
  }, [children, duration, replayKey, characters, reducedMotion]);

  return (
    <span
      {...props}
      data-slot="text-decode"
      className={cn("relative inline-grid", className)}
    >
      <span className="sr-only">{children}</span>
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 whitespace-pre-wrap"
      >
        {children}
      </span>
      <span
        ref={visualRef}
        aria-hidden="true"
        className="col-start-1 row-start-1 whitespace-pre-wrap"
      >
        {children}
      </span>
    </span>
  );
}
