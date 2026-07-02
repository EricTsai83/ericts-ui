"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

const DEFAULT_ANCHOR_RATIO = 1 / 3;
const DEFAULT_MIN_DURATION = 160;
const DEFAULT_MAX_DURATION = 320;
const DEFAULT_DISTANCE_DURATION_RATIO = 0.45;
const DEFAULT_TARGET_SELECTOR = "[data-scroll-anchor]";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export type ScrollAnchorKey = string | number | null | undefined;

export type UseScrollAnchorOptions<T extends HTMLElement> = {
  /** When this changes while `enabled`, the active target is re-anchored. */
  activeKey: ScrollAnchorKey;
  /** Gate the behavior (e.g. only while a panel is open). Defaults to `true`. */
  enabled?: boolean;
  /**
   * Where the target should land: `0` = top edge, `0.5` = vertical center,
   * `1` = bottom edge. Defaults to `1 / 3` (upper third).
   */
  anchorRatio?: number;
  /**
   * Locate the element to anchor within the container. Defaults to the first
   * `[data-scroll-anchor]` descendant.
   */
  getTarget?: (container: T) => HTMLElement | null;
  /**
   * Ease to the anchor when the key changes. On the first run after enabling —
   * and whenever the user prefers reduced motion — the jump is instant. Defaults
   * to `true`.
   */
  animate?: boolean;
  minDuration?: number;
  maxDuration?: number;
  distanceDurationRatio?: number;
};

export type UseScrollAnchorResult<T extends HTMLElement> = {
  /** Attach to the scrollable container. */
  containerRef: React.RefObject<T | null>;
  /** Imperatively re-anchor the active target (e.g. after async content loads). */
  scrollActiveIntoView: (options?: { animate?: boolean }) => void;
};

/**
 * Keeps a selected item parked at a fixed anchor point within a scroll
 * container — the "click an item, glide it to the upper third" behavior common
 * to navigation panels, command palettes, and step lists.
 *
 * Unlike the native `Element.scrollIntoView({ block: "nearest" })`, which only
 * guarantees visibility, this always lands the target at `anchorRatio` and uses
 * a distance-proportional eased animation you can interrupt. The first placement
 * after enabling is instant (no scroll-from-nowhere), later selection changes
 * glide, and reduced-motion users always jump.
 *
 * @example
 *   const { containerRef } = useScrollAnchor<HTMLDivElement>({
 *     activeKey: selectedId,
 *     enabled: open,
 *     getTarget: (c) => c.querySelector('[aria-current="page"]'),
 *   });
 *   return <div ref={containerRef} className="overflow-y-auto">…</div>;
 */
export function useScrollAnchor<T extends HTMLElement = HTMLElement>({
  activeKey,
  enabled = true,
  anchorRatio = DEFAULT_ANCHOR_RATIO,
  getTarget,
  animate = true,
  minDuration = DEFAULT_MIN_DURATION,
  maxDuration = DEFAULT_MAX_DURATION,
  distanceDurationRatio = DEFAULT_DISTANCE_DURATION_RATIO,
}: UseScrollAnchorOptions<T>): UseScrollAnchorResult<T> {
  const containerRef = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastKeyRef = useRef<ScrollAnchorKey>(activeKey);

  const cancelAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const scrollActiveIntoView = useCallback(
    (options?: { animate?: boolean }) => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const target = getTarget
        ? getTarget(container)
        : container.querySelector<HTMLElement>(DEFAULT_TARGET_SELECTOR);

      if (!target) {
        return;
      }

      const maxScrollTop = Math.max(
        container.scrollHeight - container.clientHeight,
        0,
      );
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetCenter =
        targetRect.top -
        containerRect.top +
        container.scrollTop +
        targetRect.height / 2;
      const nextScrollTop = clamp(
        targetCenter - container.clientHeight * anchorRatio,
        0,
        maxScrollTop,
      );

      cancelAnimation();

      const smooth = (options?.animate ?? animate) && !prefersReducedMotion();
      const distance = nextScrollTop - container.scrollTop;

      if (!smooth || Math.abs(distance) < 1) {
        container.scrollTop = nextScrollTop;
        return;
      }

      const startScrollTop = container.scrollTop;
      const duration = clamp(
        minDuration + Math.abs(distance) * distanceDurationRatio,
        minDuration,
        maxDuration,
      );
      let startedAt: number | null = null;

      const step = (now: number) => {
        if (startedAt === null) {
          startedAt = now;
        }

        const progress = clamp((now - startedAt) / duration, 0, 1);
        container.scrollTop = startScrollTop + distance * easeOutQuart(progress);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
          return;
        }

        container.scrollTop = nextScrollTop;
        frameRef.current = null;
      };

      frameRef.current = requestAnimationFrame(step);
    },
    [
      anchorRatio,
      animate,
      cancelAnimation,
      distanceDurationRatio,
      getTarget,
      maxDuration,
      minDuration,
    ],
  );

  useIsomorphicLayoutEffect(() => {
    if (!enabled) {
      // Stay in sync while gated so the next enable anchors instantly.
      cancelAnimation();
      lastKeyRef.current = activeKey;
      return;
    }

    const keyChanged = lastKeyRef.current !== activeKey;
    scrollActiveIntoView({ animate: keyChanged });
    lastKeyRef.current = activeKey;
  }, [activeKey, cancelAnimation, enabled, scrollActiveIntoView]);

  useEffect(() => cancelAnimation, [cancelAnimation]);

  return { containerRef, scrollActiveIntoView };
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function easeOutQuart(progress: number) {
  return 1 - (1 - progress) ** 4;
}

function clamp(value: number, min: number, max: number) {
  if (max <= min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
