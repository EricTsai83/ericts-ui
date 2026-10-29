import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

import "./scan-reveal.css";

export type ScanRevealProps = ComponentProps<"div"> & {
  /** Decorative starting layer. Keep controls in children, not here. */
  before: ReactNode;
  /** Sweep duration in milliseconds. Remount with a new key to replay. */
  duration?: number;
  /** Direction of travel: left to right, or top to bottom. */
  direction?: "horizontal" | "vertical";
  beforeClassName?: string;
  beamClassName?: string;
};

/** A moving edge reveals children over a decorative starting layer. */
export function ScanReveal({
  before,
  children,
  duration = 1400,
  direction = "horizontal",
  beforeClassName,
  beamClassName,
  className,
  style,
  ...props
}: ScanRevealProps) {
  return (
    <div
      {...props}
      data-slot="scan-reveal"
      data-direction={direction}
      className={cn("scan-reveal", className)}
      style={
        {
          "--scan-reveal-duration": `${Number.isFinite(duration) ? Math.max(0, duration) : 1400}ms`,
          ...style,
        } as CSSProperties
      }
    >
      <div
        inert
        aria-hidden="true"
        className={cn("scan-reveal-before", beforeClassName)}
      >
        {before}
      </div>
      <div className="scan-reveal-content">{children}</div>
      <div
        aria-hidden="true"
        className={cn("scan-reveal-beam", beamClassName)}
      />
    </div>
  );
}
