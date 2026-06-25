import * as React from "react";

import { cn } from "@/lib/utils";

import "./squeeze-animation.css";

type SqueezeAnimationValue = number | string;

export type SqueezeOptions = {
  /** Horizontal rebound distance. Numeric values are converted to px. Set to 0 to disable. */
  shakeX?: SqueezeAnimationValue;
  /** Vertical rebound distance. Numeric values are converted to px. Set to 0 to disable. */
  shakeY?: SqueezeAnimationValue;
  /** Animation duration. Numeric values are converted to ms. */
  duration?: SqueezeAnimationValue;
};

export type SqueezeProps = React.ComponentPropsWithoutRef<"span"> &
  SqueezeOptions & {
    /** Classes applied to the animated child wrapper. */
    targetClassName?: string;
  };

export function Squeeze({
  className,
  children,
  duration,
  shakeX,
  shakeY,
  style,
  targetClassName,
  ...props
}: SqueezeProps) {
  return (
    <span
      data-slot="squeeze"
      className={cn("squeeze-animation inline-flex", className)}
      style={getSqueezeAnimationStyle({ duration, shakeX, shakeY }, style)}
      {...props}
    >
      <span
        data-slot="squeeze-target"
        className={cn("squeeze-animation-target inline-flex", targetClassName)}
      >
        {children}
      </span>
    </span>
  );
}

export type SqueezeAnimationProps = React.ComponentPropsWithoutRef<"div"> &
  SqueezeOptions & {
    /** Classes applied to the animated SVG group. */
    targetClassName?: string;
  };

export function SqueezeAnimation({
  className,
  duration,
  shakeX,
  shakeY,
  style,
  targetClassName,
  ...props
}: SqueezeAnimationProps) {
  return (
    <div
      data-slot="squeeze-animation"
      className={cn(
        "squeeze-animation flex flex-col items-center text-foreground",
        className,
      )}
      style={getSqueezeAnimationStyle({ duration, shakeX, shakeY }, style)}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="squeeze-animation-svg h-auto w-full max-w-80"
      >
        <g
          data-slot="squeeze-animation-target"
          className={cn(
            "squeeze-animation-target squeeze-animation-icon",
            targetClassName,
          )}
        >
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

function getSqueezeAnimationStyle(
  {
    duration,
    shakeX,
    shakeY,
  }: Pick<SqueezeOptions, "duration" | "shakeX" | "shakeY">,
  style: React.CSSProperties | undefined,
) {
  if (duration === undefined && shakeX === undefined && shakeY === undefined) {
    return style;
  }

  return {
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
  } as React.CSSProperties;
}

function formatShakeValue(value: SqueezeAnimationValue | undefined) {
  return typeof value === "number" ? `${value}px` : value;
}

function formatDurationValue(value: SqueezeAnimationValue | undefined) {
  return typeof value === "number" ? `${value}ms` : value;
}
