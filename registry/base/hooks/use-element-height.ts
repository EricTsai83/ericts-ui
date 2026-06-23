"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Tracks an element's rendered height so a container can animate between content
 * heights — accordions, collapsibles, step flows, expanding cards, anything that
 * grows or shrinks to fit its content.
 *
 * Why this exists: you still can't reliably CSS-transition `height: auto` across
 * browsers (the native `interpolate-size` / `calc-size()` approach is promising
 * but not yet universally supported). The portable pattern is "measure, then
 * animate to a pixel value" — which is exactly what this hook gives you.
 *
 * @example
 *   const [ref, height] = useElementHeight<HTMLDivElement>();
 *   return (
 *     <motion.div animate={{ height: height ?? "auto" }} className="overflow-hidden">
 *       <div ref={ref}>{content}</div>
 *     </motion.div>
 *   );
 *
 * Notes for animators:
 * - Uses a *callback ref*, so it re-measures correctly even when the measured
 *   element is conditionally rendered or swapped out — the common case for
 *   collapsibles. (A `useRef` + `useEffect([])` hook would silently miss that.)
 * - Reads the *border-box* height (padding + border included), because that's the
 *   box the parent actually has to grow to.
 * - `threshold` ignores sub-pixel ResizeObserver noise that would otherwise
 *   re-trigger the animation every frame and read as jitter.
 */
export function useElementHeight<T extends HTMLElement>(threshold = 0.5) {
  const [height, setHeight] = useState<number | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback(
    (element: T | null) => {
      // Tear down the previous observer whenever the element changes or unmounts.
      observerRef.current?.disconnect();

      if (!element) return;

      const updateHeight = (nextHeight: number) => {
        setHeight((currentHeight) => {
          if (currentHeight === null) return nextHeight;

          return Math.abs(currentHeight - nextHeight) > threshold
            ? nextHeight
            : currentHeight;
        });
      };

      updateHeight(element.getBoundingClientRect().height);

      if (typeof ResizeObserver === "undefined") return;

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];

        if (!entry) return;

        const borderBoxSize = Array.isArray(entry.borderBoxSize)
          ? entry.borderBoxSize[0]
          : entry.borderBoxSize;

        updateHeight(
          borderBoxSize?.blockSize ??
            entry.target.getBoundingClientRect().height
        );
      });

      observer.observe(element);
      observerRef.current = observer;
    },
    [threshold]
  );

  return [ref, height] as const;
}
