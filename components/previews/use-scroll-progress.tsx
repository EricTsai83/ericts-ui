"use client";

import { useCallback, useRef, type CSSProperties } from "react";

import { useReducedMotion } from "@/registry/base/hooks/use-reduced-motion";
import { useScrollProgress } from "@/registry/base/hooks/use-scroll-progress";

export default function Preview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLOutputElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const updateProgress = useCallback((progress: number) => {
    const percentage = Math.round(progress * 100);

    meterRef.current?.style.setProperty(
      "--scroll-progress-preview",
      String(progress),
    );

    if (valueRef.current) {
      valueRef.current.value = `${percentage}%`;
      valueRef.current.setAttribute("aria-valuenow", String(percentage));
    }
  }, []);

  useScrollProgress({
    containerRef,
    trackRef,
    distance: 2,
    smoothing: prefersReducedMotion ? 0 : 0.08,
    onProgress: updateProgress,
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <p className="text-center text-sm leading-6 text-muted-foreground">
        Scroll the panel. Progress is written directly to the meter without a
        React render on every frame.
      </p>
      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label="Scroll progress demo"
        className="no-scrollbar h-72 overflow-y-auto rounded-lg border bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div ref={trackRef} className="relative h-[864px]">
          <div className="sticky top-0 flex h-72 items-center justify-center p-6">
            <div className="flex items-center gap-5">
              <div
                aria-hidden="true"
                className="relative h-40 w-2 overflow-hidden rounded-full bg-muted"
              >
                <div
                  ref={meterRef}
                  className="absolute inset-0 origin-bottom scale-y-(--scroll-progress-preview) rounded-full bg-foreground"
                  style={
                    { "--scroll-progress-preview": 0 } as CSSProperties
                  }
                />
              </div>
              <div className="flex min-w-32 flex-col gap-2">
                <span className="text-sm font-medium">Reading progress</span>
                <output
                  ref={valueRef}
                  role="progressbar"
                  aria-label="Scroll progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={0}
                  className="font-mono text-4xl font-semibold tabular-nums tracking-tight"
                >
                  0%
                </output>
                <span className="text-xs leading-5 text-muted-foreground">
                  Container source · 2 viewport heights
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
