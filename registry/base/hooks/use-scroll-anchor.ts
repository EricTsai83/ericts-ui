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
export type ScrollAnchorEasing = (progress: number) => number;

/** Ready-made `progress → progress` easings to pass as `easing`. */
export const scrollAnchorEasings = {
  easeOutQuart: (progress: number) => 1 - (1 - progress) ** 4,
  easeOutCubic: (progress: number) => 1 - (1 - progress) ** 3,
  easeInOutCubic: (progress: number) =>
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - (-2 * progress + 2) ** 3 / 2,
  linear: (progress: number) => progress,
} satisfies Record<string, ScrollAnchorEasing>;

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
  /** Easing for the animated scroll. Defaults to `scrollAnchorEasings.easeOutQuart`. */
  easing?: ScrollAnchorEasing;
  /**
   * Animation length in ms — a fixed number, or a function of the scroll
   * distance in px. Omit for a distance-proportional ramp (160–320ms).
   */
  duration?: number | ((distance: number) => number);
  /** Jump instantly when the user prefers reduced motion. Defaults to `true`. */
  respectReducedMotion?: boolean;
  /** Fires once the target reaches its anchor (after animating or jumping). */
  onSettled?: () => void;
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
 * an interruptible eased animation. The first placement after enabling is
 * instant (no scroll-from-nowhere), later selection changes glide, and
 * reduced-motion users jump (unless you opt out).
 *
 * Options are read live, so passing inline `getTarget` / `easing` / `onSettled`
 * is safe — the scroll only re-runs when `activeKey` or `enabled` change.
 *
 * @example
 *   const { containerRef } = useScrollAnchor<HTMLDivElement>({
 *     activeKey: selectedId,
 *     enabled: open,
 *     getTarget: (c) => c.querySelector('[aria-current="page"]'),
 *     easing: scrollAnchorEasings.easeInOutCubic,
 *     duration: (distance) => Math.min(120 + distance * 0.5, 400),
 *   });
 *   return <div ref={containerRef} className="overflow-y-auto">…</div>;
 */
export function useScrollAnchor<T extends HTMLElement = HTMLElement>(
  options: UseScrollAnchorOptions<T>,
): UseScrollAnchorResult<T> {
  const { activeKey, enabled = true } = options;

  const containerRef = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastKeyRef = useRef<ScrollAnchorKey>(activeKey);
  // Read options live so inline callbacks don't churn the effect below. Synced
  // in a layout effect (declared first, so it runs before the scroll effect).
  const optionsRef = useRef(options);

  useIsomorphicLayoutEffect(() => {
    optionsRef.current = options;
  });

  const cancelAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const scrollActiveIntoView = useCallback(
    (overrides?: { animate?: boolean }) => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const {
        anchorRatio = DEFAULT_ANCHOR_RATIO,
        getTarget,
        animate = true,
        easing = scrollAnchorEasings.easeOutQuart,
        duration,
        respectReducedMotion = true,
        onSettled,
      } = optionsRef.current;

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

      const reduceMotion = respectReducedMotion && prefersReducedMotion();
      const smooth = (overrides?.animate ?? animate) && !reduceMotion;
      const distance = nextScrollTop - container.scrollTop;
      const totalDuration = Math.max(0, resolveDuration(duration, distance));

      if (!smooth || Math.abs(distance) < 1 || totalDuration === 0) {
        container.scrollTop = nextScrollTop;
        onSettled?.();
        return;
      }

      const startScrollTop = container.scrollTop;
      let startedAt: number | null = null;

      const stepFrame = (now: number) => {
        if (startedAt === null) {
          startedAt = now;
        }

        const progress = clamp((now - startedAt) / totalDuration, 0, 1);
        container.scrollTop = startScrollTop + distance * easing(progress);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(stepFrame);
          return;
        }

        container.scrollTop = nextScrollTop;
        frameRef.current = null;
        onSettled?.();
      };

      frameRef.current = requestAnimationFrame(stepFrame);
    },
    [cancelAnimation],
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

function resolveDuration(
  duration: number | ((distance: number) => number) | undefined,
  distance: number,
) {
  if (typeof duration === "function") {
    return duration(Math.abs(distance));
  }

  if (typeof duration === "number") {
    return duration;
  }

  return clamp(
    DEFAULT_MIN_DURATION + Math.abs(distance) * DEFAULT_DISTANCE_DURATION_RATIO,
    DEFAULT_MIN_DURATION,
    DEFAULT_MAX_DURATION,
  );
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function clamp(value: number, min: number, max: number) {
  if (max <= min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
