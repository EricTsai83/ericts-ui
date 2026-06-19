"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import "./smooth-height.css";

export type SmoothHeightProps = React.ComponentPropsWithoutRef<"div"> & {
  children: React.ReactNode;
  innerClassName?: string;
};

export function SmoothHeight({
  children,
  className,
  innerClassName,
  style,
  ...props
}: SmoothHeightProps) {
  const [height, setHeight] = React.useState<number | null>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const content = contentRef.current;

    if (!content) return;

    const updateHeight = (nextHeight: number) => {
      setHeight((currentHeight) => {
        if (currentHeight === null) return nextHeight;

        return Math.abs(currentHeight - nextHeight) > 0.5
          ? nextHeight
          : currentHeight;
      });
    };

    updateHeight(content.getBoundingClientRect().height);

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) return;

      const borderBoxSize = Array.isArray(entry.borderBoxSize)
        ? entry.borderBoxSize[0]
        : entry.borderBoxSize;

      updateHeight(
        borderBoxSize?.blockSize ?? entry.target.getBoundingClientRect().height
      );
    });

    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      {...props}
      data-slot="smooth-height"
      className={cn("smooth-height", className)}
      style={height === null ? style : { ...style, height: `${height}px` }}
    >
      <div
        ref={contentRef}
        data-slot="smooth-height-content"
        className={innerClassName}
      >
        {children}
      </div>
    </div>
  );
}
