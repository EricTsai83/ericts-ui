import * as React from "react";

import { cn } from "@/lib/utils";

import "./squeeze.css";

type SqueezeCardValue = number | string;

export type SqueezeOptions = {
  /** Horizontal rebound distance. Numeric values are converted to px. Set to 0 to disable. */
  shakeX?: SqueezeCardValue;
  /** Vertical rebound distance. Numeric values are converted to px. Set to 0 to disable. */
  shakeY?: SqueezeCardValue;
  /** Animation duration. Numeric values are converted to ms. */
  duration?: SqueezeCardValue;
};

export type SqueezeProps = React.ComponentProps<"span"> &
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
      className={cn("squeeze inline-flex", className)}
      style={getSqueezeStyle({ duration, shakeX, shakeY }, style)}
      {...props}
    >
      <span
        data-slot="squeeze-target"
        className={cn("squeeze-target inline-flex", targetClassName)}
      >
        {children}
      </span>
    </span>
  );
}

export type SqueezeCardProps = React.ComponentProps<"div"> &
  SqueezeOptions & {
    /** Classes applied to the animated SVG group. */
    targetClassName?: string;
  };

export function SqueezeCard({
  className,
  duration,
  shakeX,
  shakeY,
  style,
  targetClassName,
  ...props
}: SqueezeCardProps) {
  return (
    <div
      data-slot="squeeze"
      className={cn(
        "squeeze flex flex-col items-center text-foreground",
        className,
      )}
      style={getSqueezeStyle({ duration, shakeX, shakeY }, style)}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className="squeeze-svg h-auto w-full max-w-80"
      >
        <g
          data-slot="squeeze-target"
          className={cn(
            "squeeze-target squeeze-icon",
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

function getSqueezeStyle(
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
      ? { "--squeeze-duration": formatDurationValue(duration) }
      : {}),
    ...(shakeX !== undefined
      ? { "--squeeze-shake-x": formatShakeValue(shakeX) }
      : {}),
    ...(shakeY !== undefined
      ? { "--squeeze-shake-y": formatShakeValue(shakeY) }
      : {}),
  } as React.CSSProperties;
}

function formatShakeValue(value: SqueezeCardValue | undefined) {
  return typeof value === "number" ? `${value}px` : value;
}

function formatDurationValue(value: SqueezeCardValue | undefined) {
  return typeof value === "number" ? `${value}ms` : value;
}
