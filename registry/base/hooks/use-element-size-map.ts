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
  const observerRef = useRef<ResizeObserver | null>(null);
  const elements = useRef(new Map<string, T>());
  const idsByElement = useRef(new WeakMap<Element, string>());
  const callbacks = useRef(new Map<string, (node: T | null) => void>());
  const thresholdRef = useRef(threshold);

  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  useEffect(() => {
    const activeElements = elements.current;

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
      activeElements.clear();
      idsByElement.current = new WeakMap();
    };
  }, []);

  const updateSizes = useCallback(
    (updates: ReadonlyArray<readonly [string, ElementSize]>) => {
      setSizes((current) => {
        let next = current;

        for (const [id, nextSize] of updates) {
          const currentSize = current[id];

          if (
            currentSize &&
            Math.abs(currentSize.width - nextSize.width) <=
              thresholdRef.current &&
            Math.abs(currentSize.height - nextSize.height) <=
              thresholdRef.current
          ) {
            continue;
          }

          if (next === current) {
            next = { ...current };
          }

          next[id] = nextSize;
        }

        return next;
      });
    },
    [],
  );

  const getObserver = useCallback(() => {
    if (typeof ResizeObserver === "undefined") return null;

    if (!observerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        const updates: Array<readonly [string, ElementSize]> = [];

        for (const entry of entries) {
          const id = idsByElement.current.get(entry.target);

          if (id === undefined) continue;

          updates.push([id, readElementSize(entry.target, entry)]);
        }

        if (updates.length > 0) {
          updateSizes(updates);
        }
      });
    }

    return observerRef.current;
  }, [updateSizes]);

  const disconnect = useCallback((id: string) => {
    const element = elements.current.get(id);

    if (!element) return;

    observerRef.current?.unobserve(element);
    idsByElement.current.delete(element);
    elements.current.delete(id);
  }, []);

  const updateSize = useCallback(
    (id: string, nextSize: ElementSize) => {
      updateSizes([[id, nextSize]]);
    },
    [updateSizes],
  );

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

        const observer = getObserver();

        if (observer) {
          elements.current.set(id, node);
          idsByElement.current.set(node, id);
          observer.observe(node);
        }
      };

      callbacks.current.set(id, ref);

      return ref;
    },
    [disconnect, getObserver, updateSize],
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
