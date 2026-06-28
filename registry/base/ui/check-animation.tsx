import * as React from "react";

import { cn } from "@/lib/utils";

import "./check-animation.css";

export type CheckAnimationVariant = "square" | "circle";
export type CheckAnimationSize = "sm" | "md" | "lg";

export interface CheckAnimationProps
  extends Omit<React.ComponentPropsWithoutRef<"span">, "children"> {
  variant?: CheckAnimationVariant;
  size?: CheckAnimationSize;
  /** Accessible label. Omit for a decorative mark. */
  label?: string;
  strokeWidth?: number;
}

const sizeClassNames: Record<CheckAnimationSize, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-10",
};

const DEFAULT_STROKE_WIDTH = 2;
const VECTOR_EFFECT = "non-scaling-stroke";
const SQUARE_PATH = "M 50,11.5 L 88.5,11.5 L 88.5,88.5 L 11.5,88.5 L 11.5,11.5 Z";
const CIRCLE_PATH =
  "M 88.5,50 C 88.5,71.26 71.26,88.5 50,88.5 C 28.74,88.5 11.5,71.26 11.5,50 C 11.5,28.74 28.74,11.5 50,11.5 C 71.26,11.5 88.5,28.74 88.5,50 Z";
const CHECK_PATH = "M 32.3,51 L 44,62.9 L 68.75,36.5";

const shapePaths: Record<CheckAnimationVariant, string> = {
  square: SQUARE_PATH,
  circle: CIRCLE_PATH,
};

export function CheckAnimation({
  variant = "square",
  size,
  label,
  strokeWidth = DEFAULT_STROKE_WIDTH,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  className,
  ...props
}: CheckAnimationProps) {
  const accessibleLabel = label ?? ariaLabel;

  return (
    <span
      data-slot="check-animation"
      data-variant={variant}
      role={accessibleLabel ? "img" : undefined}
      aria-label={accessibleLabel}
      aria-hidden={accessibleLabel ? undefined : (ariaHidden ?? true)}
      className={cn(
        "check-animation inline-flex shrink-0 items-center justify-center text-foreground",
        size ? sizeClassNames[size] : "w-full max-w-80",
        className,
      )}
      {...props}
    >
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        className={size ? "size-full" : "h-auto w-full"}
      >
        <path
          className="check-animation-shape"
          d={shapePaths[variant]}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect={VECTOR_EFFECT}
          pathLength="100"
          strokeDasharray="100 100"
          strokeDashoffset="100"
        />
        <path
          className="check-animation-checkmark"
          d={CHECK_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect={VECTOR_EFFECT}
          pathLength="100"
          strokeDasharray="100 100"
          strokeDashoffset="100"
        />
      </svg>
    </span>
  );
}
