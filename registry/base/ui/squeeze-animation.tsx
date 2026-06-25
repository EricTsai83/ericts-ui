import * as React from "react";

import { cn } from "@/lib/utils";

import "./squeeze-animation.css";

export type SqueezeAnimationProps = React.ComponentPropsWithoutRef<"div"> & {
  /** Horizontal rebound distance. Numeric values are converted to px. Set to 0 to disable. */
  shakeX?: number | string;
  /** Vertical rebound distance. Numeric values are converted to px. Set to 0 to disable. */
  shakeY?: number | string;
  /** Animation duration. Numeric values are converted to ms. */
  duration?: number | string;
};

export function SqueezeAnimation({
  className,
  duration,
  shakeX,
  shakeY,
  style,
  ...props
}: SqueezeAnimationProps) {
  const animationStyle =
    duration === undefined && shakeX === undefined && shakeY === undefined
      ? style
      : ({
          ...style,
          ...(duration !== undefined
            ? { "--squeeze-animation-duration": formatDurationValue(duration) }
            : {}),
          ...(shakeX !== undefined
            ? { "--squeeze-animation-shake-x": formatShakeValue(shakeX) }
            : {}),
          ...(shakeY !== undefined
            ? { "--squeeze-animation-shake-y": formatShakeValue(shakeY) }
            : {}),
        } as React.CSSProperties);

  return (
    <div
      data-slot="squeeze-animation"
      className={cn(
        "squeeze-animation flex flex-col items-center text-foreground",
        className,
      )}
      style={animationStyle}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="squeeze-animation-svg h-auto w-full max-w-80"
      >
        <g className="squeeze-animation-icon">
          <rect
            x="26"
            y="30"
            width="48"
            height="40"
            rx="12"
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeWidth="6"
          />
          <path
            d="M 38 46 H 62"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <path
            d="M 38 58 H 54"
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

function formatShakeValue(value: number | string | undefined) {
  return typeof value === "number" ? `${value}px` : value;
}

function formatDurationValue(value: number | string | undefined) {
  return typeof value === "number" ? `${value}ms` : value;
}
