import * as React from "react";

import { cn } from "@/lib/utils";

import "./jitter-animation.css";

export type JitterAnimationAxis = "both" | "horizontal" | "vertical";

export type JitterAnimationProps = React.ComponentPropsWithoutRef<"div"> & {
  /** The axis the icon jitters on. Defaults to horizontal. */
  axis?: JitterAnimationAxis;
};

export function JitterAnimation({
  axis = "horizontal",
  className,
  ...props
}: JitterAnimationProps) {
  return (
    <div
      data-slot="jitter-animation"
      data-axis={axis}
      className={cn(
        "jitter-animation flex flex-col items-center text-foreground",
        className,
      )}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="h-auto w-full max-w-80"
      >
        <g className="jitter-animation-icon">
          <path
            d="M 38 32 L 20 50 L 38 68"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6"
          />
          <path
            d="M 62 32 L 80 50 L 62 68"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="6"
          />
          <path
            d="M 54 26 L 46 74"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="6"
          />
        </g>
      </svg>
    </div>
  );
}
