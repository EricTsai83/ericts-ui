import * as React from "react";

import { cn } from "@/lib/utils";

import "./jitter-animation.css";

export type JitterAxis = "both" | "horizontal" | "vertical";
export type JitterAnimationAxis = JitterAxis;

export type JitterProps = React.ComponentPropsWithoutRef<"span"> & {
  /** The axis the content jitters on. Defaults to horizontal. */
  axis?: JitterAxis;
  /** Classes applied to the animated child wrapper. */
  targetClassName?: string;
};

export function Jitter({
  axis = "horizontal",
  className,
  children,
  targetClassName,
  ...props
}: JitterProps) {
  return (
    <span
      data-slot="jitter"
      data-axis={axis}
      className={cn("jitter inline-flex", className)}
      {...props}
    >
      <span
        data-slot="jitter-target"
        className={cn("jitter-target inline-flex", targetClassName)}
      >
        {children}
      </span>
    </span>
  );
}

export type JitterAnimationProps = React.ComponentPropsWithoutRef<"div"> & {
  /** The axis the icon jitters on. Defaults to horizontal. */
  axis?: JitterAxis;
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
        "jitter jitter-animation flex flex-col items-center text-foreground",
        className,
      )}
      {...props}
    >
      <div
        data-slot="jitter-animation-target"
        className="jitter-target w-full max-w-80"
      >
        <svg viewBox="0 0 100 100" aria-hidden="true" className="h-auto w-full">
          <g
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M 24 34 L 16 42 L 24 50"
              strokeWidth="5"
              opacity="0.55"
            />
            <path
              d="M 24 50 L 16 58 L 24 66"
              strokeWidth="5"
              opacity="0.35"
            />
            <path
              d="M 76 34 L 84 42 L 76 50"
              strokeWidth="5"
              opacity="0.55"
            />
            <path
              d="M 76 50 L 84 58 L 76 66"
              strokeWidth="5"
              opacity="0.35"
            />
            <rect
              x="35"
              y="34"
              width="30"
              height="32"
              rx="8"
              fill="currentColor"
              fillOpacity="0.1"
              strokeWidth="6"
            />
            <path d="M 45 46 L 50 42 L 55 46" strokeWidth="5" />
            <path d="M 45 54 L 50 58 L 55 54" strokeWidth="5" />
          </g>
        </svg>
      </div>
    </div>
  );
}
