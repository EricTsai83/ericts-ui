import * as React from "react";

import { cn } from "@/lib/utils";

import "./shy-heart.css";

type ShyHeartTimingValue = number | string;
type ShyHeartLengthValue = number | string;

type ShyHeartStyle = React.CSSProperties & {
  "--shy-heart-duration"?: string;
  "--shy-heart-size"?: string;
  "--shy-heart-tilt-duration"?: string;
};

export type ShyHeartProps = Omit<
  React.ComponentProps<"span">,
  "children"
> & {
  /** Enable the heart entrance and hover reaction. Defaults to true. */
  animated?: boolean;
  /** Entrance duration. Numeric values are converted to ms. */
  duration?: ShyHeartTimingValue;
  /** Heart width. Numeric values are converted to px. Defaults to 64px. */
  size?: ShyHeartLengthValue;
  /** Hover-tilt duration. Numeric values are converted to ms. */
  tiltDuration?: ShyHeartTimingValue;
  /** Accessible label. Omit for a decorative heart. */
  label?: string;
  /** Classes applied to the outlined heart body. */
  heartClassName?: string;
  /** Classes applied to both three-line blush groups. */
  blushClassName?: string;
};

export function ShyHeart({
  animated = true,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  blushClassName,
  className,
  duration,
  heartClassName,
  label,
  ref,
  size,
  style,
  tiltDuration,
  ...props
}: ShyHeartProps) {
  const accessibleLabel = label ?? ariaLabel;
  const shyHeartStyle: ShyHeartStyle = { ...style };

  if (duration !== undefined) {
    shyHeartStyle["--shy-heart-duration"] = toCssTime(duration);
  }

  if (size !== undefined) {
    shyHeartStyle["--shy-heart-size"] = toCssLength(size);
  }

  if (tiltDuration !== undefined) {
    shyHeartStyle["--shy-heart-tilt-duration"] = toCssTime(tiltDuration);
  }

  return (
    <span
      ref={ref}
      data-slot="shy-heart"
      data-animated={animated ? "" : undefined}
      role={accessibleLabel ? "img" : undefined}
      aria-label={accessibleLabel}
      aria-hidden={accessibleLabel ? undefined : (ariaHidden ?? true)}
      className={cn(
        "shy-heart relative inline-flex shrink-0 items-center justify-center text-foreground",
        className,
      )}
      style={shyHeartStyle}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="shy-heart-svg h-auto w-full overflow-visible"
        viewBox="0 0 256 256"
      >
        <g className="shy-heart-motion-stage">
          <g className="shy-heart-figure">
            <path
              data-slot="shy-heart-body"
              className={cn("shy-heart-body", heartClassName)}
              d="M128 224.6L119.2 216.8C54 158.8 16 124 16 78.4C16 46 39.2 24 72 24C94.8 24 113.8 37.2 128 60C142.2 37.2 161.2 24 184 24C216.8 24 240 46 240 78.4C240 124 202 158.8 136.8 216.8L128 224.6Z"
            />
            <g
              data-slot="shy-heart-blush-left"
              className={cn(
                "shy-heart-blush shy-heart-blush-left",
                blushClassName,
              )}
            >
              <path
                className="shy-heart-blush-backdrop"
                d="M50 120H103"
              />
              <g className="shy-heart-blush-lines">
                <path d="M65 108V127" />
                <path d="M77 108V127" />
                <path d="M89 108V127" />
              </g>
            </g>
            <g
              data-slot="shy-heart-blush-right"
              className={cn(
                "shy-heart-blush shy-heart-blush-right",
                blushClassName,
              )}
            >
              <path
                className="shy-heart-blush-backdrop"
                d="M153 120H206"
              />
              <g className="shy-heart-blush-lines">
                <path d="M191 108V127" />
                <path d="M179 108V127" />
                <path d="M167 108V127" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}

function toCssTime(value: ShyHeartTimingValue) {
  return typeof value === "number" ? `${value}ms` : value;
}

function toCssLength(value: ShyHeartLengthValue) {
  return typeof value === "number" ? `${value}px` : value;
}
