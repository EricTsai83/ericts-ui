"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ElementSize = {
  width: number;
  height: number;
};

/**
 * Tracks the rendered size of multiple keyed elements with ResizeObserver.
 *
 * Use it when an animated shell, indicator, toolbar, or floating panel needs to
 * move toward the measured width/height of whichever keyed element is active.
 *
 * @example
 *   const { setMeasureRef, sizes } = useElementSizeMap<HTMLDivElement>();
 *   const activeSize = sizes[activeId];
 *
 *   return (
 *     <>
 *       <div aria-hidden className="invisible absolute">
 *         {items.map((item) => (
 *           <div key={item.id} ref={setMeasureRef(item.id)}>
 *             {item.content}
 *           </div>
 *         ))}
 *       </div>
 *       <motion.div animate={activeSize}>
 *         {activeItem.content}
 *       </motion.div>
 *     </>
 *   );
 */
export function useElementSizeMap<T extends HTMLElement>(threshold = 0.5) {
  const [sizes, setSizes] = useState<Record<string, ElementSize>>({});
  const observers = useRef(new Map<string, ResizeObserver>());
  const callbacks = useRef(new Map<string, (node: T | null) => void>());
  const thresholdRef = useRef(threshold);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    const activeObservers = observers.current;

    return () => {
      activeObservers.forEach((observer) => observer.disconnect());
      activeObservers.clear();
    };
  }, []);

  const updateSize = useCallback((id: string, nextSize: ElementSize) => {
    setSizes((current) => {
      const currentSize = current[id];

      if (
        currentSize &&
        Math.abs(currentSize.width - nextSize.width) <= thresholdRef.current &&
        Math.abs(currentSize.height - nextSize.height) <= thresholdRef.current
      ) {
        return current;
      }

      return { ...current, [id]: nextSize };
    });
  }, []);

  const disconnect = useCallback((id: string) => {
    observers.current.get(id)?.disconnect();
    observers.current.delete(id);
  }, []);

  const setMeasureRef = useCallback(
    (id: string) => {
      const current = callbacks.current.get(id);

      if (current) {
        return current;
      }

      const ref = (node: T | null) => {
        disconnect(id);

        if (!node) {
          return;
        }

        updateSize(id, readElementSize(node));

        if (typeof ResizeObserver === "undefined") return;

        const observer = new ResizeObserver((entries) => {
          const entry = entries[0];

          if (!entry) return;

          updateSize(id, readElementSize(entry.target, entry));
        });

        observer.observe(node);
        observers.current.set(id, observer);
      };

      callbacks.current.set(id, ref);

      return ref;
    },
    [disconnect, updateSize],
  );

  return { setMeasureRef, sizes } as const;
}

function readElementSize(
  element: Element,
  entry?: ResizeObserverEntry,
): ElementSize {
  const borderBoxSize = Array.isArray(entry?.borderBoxSize)
    ? entry.borderBoxSize[0]
    : entry?.borderBoxSize;

  if (borderBoxSize) {
    return {
      width: borderBoxSize.inlineSize,
      height: borderBoxSize.blockSize,
    };
  }

  const rect = element.getBoundingClientRect();

  return {
    width: rect.width,
    height: rect.height,
  };
}
