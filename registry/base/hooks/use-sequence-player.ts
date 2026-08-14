"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * One scripted sequence: how many beats it plays and how long each beat rests.
 *
 * `stepMs` accepts an array when the beats are unequal — a code-entry demo that
 * types four digits and then holds on a success check needs a long final beat,
 * and averaging that into one number makes the payoff read as a glitch. The last
 * entry repeats if the array is shorter than `steps`.
 */
export type SequenceScript = {
  steps: number;
  stepMs: number | readonly number[];
};

export type UseSequencePlayerOptions = {
  /** One entry per sequence, in spotlight order. */
  sequences: readonly SequenceScript[];
  /**
   * Quiet beat before the first sequence starts, so a page that just scrolled
   * into view settles before anything moves. Defaults to 500ms.
   */
  leadInMs?: number;
  /** Set false to hold everything at its poster frame. Defaults to true. */
  enabled?: boolean;
  /**
   * Whether `takeOver` keeps replaying its sequence instead of handing off.
   * Defaults to true — the point of taking over is to watch one thing repeat.
   */
  loopTakeOver?: boolean;
};

type ContainerProps = {
  ref: (node: HTMLElement | null) => void;
  onFocusCapture: () => void;
  onBlurCapture: (event: { currentTarget: HTMLElement; relatedTarget: EventTarget | null }) => void;
  onPointerLeave: () => void;
};

export type UseSequencePlayerResult = {
  /**
   * Spread onto the element that wraps every sequence. Supplies the visibility
   * observer plus the focus and pointer pauses; without it the player would keep
   * animating off-screen and would yank the spotlight away from a keyboard user
   * reading one sequence.
   */
  containerProps: ContainerProps;
  /** Index of the sequence currently holding the spotlight. */
  activeIndex: number;
  /** Beats already fired in the active sequence; the last one is still resting. */
  stepsFired: number;
  /**
   * Per-sequence play counter. Feed `runs[i]` to a sequence as a prop (or a
   * React `key`) and derive its visual state from that number — the player never
   * needs to know what any sequence actually renders.
   */
  runs: readonly number[];
  /** False while paused: reduced motion, off-screen, background tab, or focused. */
  isPlaying: boolean;
  /** Dwell for one beat, for driving a progress indicator. */
  dwellMs: (sequenceIndex: number, step: number) => number;
  /** Move the spotlight to a sequence now — hover, click, or focus. */
  takeOver: (index: number) => void;
  /** Hand the spotlight back to automatic advancing. */
  release: () => void;
};

type Playback = {
  index: number;
  /** Beats already fired in this cycle; the last one is still resting. */
  stepsFired: number;
  /** "taken" holds the spotlight on one sequence; "auto" advances through all. */
  mode: "auto" | "taken";
};

function resolveDwell(stepMs: SequenceScript["stepMs"], step: number) {
  return typeof stepMs === "number"
    ? stepMs
    : (stepMs[Math.min(step, stepMs.length - 1)] ?? 0);
}

/**
 * Drives a set of scripted sequences so exactly one plays at a time, then hands
 * the spotlight to the next.
 *
 * Why this exists: showing several animated demos at once is noise — every one
 * competes for the same attention and none of them reads. The fix is a spotlight,
 * and the fiddly part is not the timer but knowing when *not* to run it. This
 * hook holds all of that: it stays still until the container is on screen, pauses
 * on a hidden tab, pauses while focus is inside (so a keyboard user is never
 * interrupted mid-read), honours `prefers-reduced-motion` by never starting, and
 * lets a pointer take the spotlight and give it back.
 *
 * The hook is deliberately content-blind. It never renders anything and never
 * learns what a sequence is; it only counts beats and tells you which sequence
 * is on beat `n`. Sequences derive their own state from `runs[i]`.
 *
 * @example
 *   const SCRIPTS = [
 *     { steps: 3, stepMs: 1500 },
 *     { steps: 5, stepMs: [600, 600, 600, 1900, 500] },
 *   ];
 *
 *   const { containerProps, activeIndex, runs, takeOver } = useSequencePlayer({
 *     sequences: SCRIPTS,
 *   });
 *
 *   return (
 *     <div {...containerProps}>
 *       {SCRIPTS.map((_, index) => (
 *         <div key={index} onPointerEnter={() => takeOver(index)}>
 *           <Demo run={runs[index] ?? 0} playing={index === activeIndex} />
 *         </div>
 *       ))}
 *     </div>
 *   );
 *
 * Notes for animators:
 * - Beat 0 is a *poster frame*: nothing has fired yet, so every sequence should
 *   look deliberate at `run === 0`. A sequence whose resting state is empty reads
 *   as a broken box for as long as it waits its turn.
 * - `stepsFired` counts beats already started, so the beat currently resting is
 *   `stepsFired - 1`. That is the one a progress indicator should be filling.
 * - The container ref is a *callback ref*, so the observer reattaches correctly
 *   when the wrapper is conditionally rendered.
 * - Under reduced motion the player never starts and `runs` stays all zeroes,
 *   which leaves every sequence on its poster frame rather than mid-animation.
 */
export function useSequencePlayer({
  sequences,
  leadInMs = 500,
  enabled = true,
  loopTakeOver = true,
}: UseSequencePlayerOptions): UseSequencePlayerResult {
  const count = sequences.length;
  const prefersReducedMotion = useReducedMotion();
  const [runs, setRuns] = useState<number[]>([]);
  const [playback, setPlayback] = useState<Playback>({
    index: 0,
    stepsFired: 0,
    mode: "auto",
  });
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [focusPaused, setFocusPaused] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const containerRef = useCallback((node: HTMLElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;

    if (!node) return;

    // Without an observer we cannot know when to start, so assume visible
    // rather than silently never playing.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { threshold: 0.2 },
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const update = () => setPageVisible(!document.hidden);

    update();
    document.addEventListener("visibilitychange", update);

    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  const fire = useCallback(
    (index: number) => {
      setRuns((current) =>
        Array.from(
          { length: count },
          (_, i) => (current[i] ?? 0) + (i === index ? 1 : 0),
        ),
      );
    },
    [count],
  );

  const isPlaying =
    enabled &&
    !prefersReducedMotion &&
    inView &&
    pageVisible &&
    !focusPaused &&
    count > 0;

  useEffect(() => {
    if (!isPlaying) return;

    const index = playback.index % count;
    const script = sequences[index];

    if (!script) return;

    const delay =
      playback.stepsFired === 0
        ? leadInMs
        : resolveDwell(script.stepMs, playback.stepsFired - 1);

    const timeout = setTimeout(() => {
      if (playback.stepsFired < script.steps) {
        fire(index);
        setPlayback((current) => ({
          ...current,
          stepsFired: current.stepsFired + 1,
        }));
        return;
      }

      if (playback.mode === "taken" && loopTakeOver) {
        fire(index);
        setPlayback((current) => ({ ...current, stepsFired: 1 }));
        return;
      }

      const next = (index + 1) % count;

      fire(next);
      setPlayback({ index: next, stepsFired: 1, mode: "auto" });
    }, delay);

    return () => clearTimeout(timeout);
  }, [count, fire, isPlaying, leadInMs, loopTakeOver, playback, sequences]);

  const takeOver = useCallback(
    (index: number) => {
      if (index < 0 || index >= count) return;

      fire(index);
      setPlayback({ index, stepsFired: 1, mode: "taken" });
    },
    [count, fire],
  );

  const release = useCallback(() => {
    setPlayback((current) =>
      current.mode === "taken" ? { ...current, mode: "auto" } : current,
    );
  }, []);

  const dwellMs = useCallback(
    (sequenceIndex: number, step: number) => {
      const script = sequences[sequenceIndex];

      return script ? resolveDwell(script.stepMs, step) : 0;
    },
    [sequences],
  );

  return {
    containerProps: {
      ref: containerRef,
      onFocusCapture: () => setFocusPaused(true),
      onBlurCapture: (event) => {
        // Focus moving between sequences inside the container is not a release;
        // only focus actually leaving resumes the player.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusPaused(false);
        }
      },
      onPointerLeave: release,
    },
    activeIndex: count > 0 ? playback.index % count : 0,
    stepsFired: playback.stepsFired,
    runs,
    isPlaying,
    dwellMs,
    takeOver,
    release,
  };
}
