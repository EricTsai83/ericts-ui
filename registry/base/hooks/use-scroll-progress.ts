"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";

const DEFAULT_DISTANCE = 1;
const DEFAULT_SMOOTHING = 0.1;
const SETTLE_THRESHOLD = 0.0004;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ScrollProgressSource = "container" | "window";

export type UseScrollProgressOptions<
  TContainer extends HTMLElement,
  TTrack extends HTMLElement,
> = {
  /** Scrollable element. Also used as the measured viewport in container mode. */
  containerRef: RefObject<TContainer | null>;
  /** Element whose top edge marks progress zero in window mode. */
  trackRef?: RefObject<TTrack | null>;
  /** Read from the element or the page. Defaults to `container`. */
  source?: ScrollProgressSource;
  /** Length of the 0–1 range, in measured viewport heights. */
  distance?: number;
  /** Exponential follow time in seconds. Set to `0` for direct scrubbing. */
  smoothing?: number;
  /** Gate scroll tracking without unmounting the consumer. */
  enabled?: boolean;
  /** Value emitted while disabled. Defaults to `1`. */
  disabledProgress?: number;
  /** Called outside React's render cycle whenever progress changes. */
  onProgress: (progress: number) => void;
  /** Called after the scroll viewport is measured. */
  onMeasure?: (viewportHeight: number) => void;
};

export type UseScrollProgressResult = {
  /** Re-read viewport size and progress after imperative layout changes. */
  measure: () => void;
};

/**
 * Tracks vertical scroll as a clamped 0–1 value without rendering on every
 * frame. It supports a nested scroll container or the page, optional
 * exponential smoothing, resize measurement, and an imperative refresh.
 */
export function useScrollProgress<
  TContainer extends HTMLElement = HTMLElement,
  TTrack extends HTMLElement = HTMLElement,
>({
  containerRef,
  trackRef,
  source = "container",
  distance = DEFAULT_DISTANCE,
  smoothing = DEFAULT_SMOOTHING,
  enabled = true,
  disabledProgress = 1,
  onProgress,
  onMeasure,
}: UseScrollProgressOptions<
  TContainer,
  TTrack
>): UseScrollProgressResult {
  const onProgressRef = useRef(onProgress);
  const onMeasureRef = useRef(onMeasure);
  const viewportHeightRef = useRef(1);
  const initialProgress = clamp(disabledProgress, 0, 1);
  const currentRef = useRef(initialProgress);
  const targetRef = useRef(initialProgress);
  const frameRef = useRef<number | null>(null);
  const previousFrameTimeRef = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    onProgressRef.current = onProgress;
    onMeasureRef.current = onMeasure;
  });

  const cancelFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    previousFrameTimeRef.current = null;
  }, []);

  const readProgress = useCallback(() => {
    if (!enabled) {
      return clamp(disabledProgress, 0, 1);
    }

    const container = containerRef.current;

    if (!container) {
      return 0;
    }

    const scrollSpan =
      viewportHeightRef.current * Math.max(0.01, finiteNumber(distance, 1));

    if (source === "window") {
      const track = trackRef?.current;

      if (!track) {
        return 0;
      }

      return clamp(-track.getBoundingClientRect().top / scrollSpan, 0, 1);
    }

    return clamp(container.scrollTop / scrollSpan, 0, 1);
  }, [containerRef, disabledProgress, distance, enabled, source, trackRef]);

  const emitImmediately = useCallback(() => {
    const progress = readProgress();
    targetRef.current = progress;
    currentRef.current = progress;
    cancelFrame();
    onProgressRef.current(progress);
  }, [cancelFrame, readProgress]);

  const measure = useCallback(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const viewportHeight =
      source === "window" ? window.innerHeight : container.clientHeight;

    if (viewportHeight <= 0) {
      return;
    }

    viewportHeightRef.current = viewportHeight;
    onMeasureRef.current?.(viewportHeight);
    emitImmediately();
  }, [containerRef, emitImmediately, source]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const animate = (now: number) => {
      const previous = previousFrameTimeRef.current;
      const deltaSeconds =
        previous === null ? 1 / 60 : Math.min((now - previous) / 1000, 0.1);
      previousFrameTimeRef.current = now;

      const followTime = Math.max(0, finiteNumber(smoothing, 0));
      const blend =
        followTime === 0 ? 1 : 1 - Math.exp(-deltaSeconds / followTime);
      const next =
        currentRef.current + (targetRef.current - currentRef.current) * blend;

      if (Math.abs(targetRef.current - next) <= SETTLE_THRESHOLD) {
        currentRef.current = targetRef.current;
        frameRef.current = null;
        previousFrameTimeRef.current = null;
        onProgressRef.current(currentRef.current);
        return;
      }

      currentRef.current = next;
      onProgressRef.current(next);
      frameRef.current = requestAnimationFrame(animate);
    };

    const handleScroll = () => {
      targetRef.current = readProgress();

      if (finiteNumber(smoothing, DEFAULT_SMOOTHING) <= 0) {
        currentRef.current = targetRef.current;
        onProgressRef.current(currentRef.current);
        return;
      }

      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    measure();

    const scroller: Window | TContainer =
      source === "window" ? window : container;

    if (enabled) {
      scroller.addEventListener("scroll", handleScroll, { passive: true });
    }

    window.addEventListener("resize", measure);

    const resizeObserver =
      source === "container" && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;

    resizeObserver?.observe(container);

    return () => {
      cancelFrame();
      scroller.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", measure);
      resizeObserver?.disconnect();
    };
  }, [
    cancelFrame,
    containerRef,
    enabled,
    measure,
    readProgress,
    smoothing,
    source,
  ]);

  return { measure };
}

function finiteNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
