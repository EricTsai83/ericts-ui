"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react";

import { cn } from "@/lib/utils";

export type CircleCheckAnimationSize = "sm" | "md" | "lg";

export interface CircleCheckAnimationProps
  extends Omit<HTMLMotionProps<"span">, "children"> {
  size?: CircleCheckAnimationSize;
  /** Accessible label. Omit for a decorative icon. */
  label?: string;
  strokeWidth?: number;
}

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const CIRCLE_RADIUS = 9.25;
const CIRCLE_LENGTH = 2 * Math.PI * CIRCLE_RADIUS;
const CHECK_LENGTH = 13;

const sizeClassNames: Record<CircleCheckAnimationSize, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-10",
};

export function CircleCheckAnimation({
  size = "md",
  label,
  strokeWidth = 2.4,
  className,
  ...props
}: CircleCheckAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  const circleTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ duration: 0.42, ease: EASE_OUT } as const);
  const checkTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ duration: 0.28, ease: EASE_OUT, delay: 0.2 } as const);

  return (
    <motion.span
      data-slot="circle-check-animation"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center text-foreground",
        sizeClassNames[size],
        className,
      )}
      {...props}
    >
      {!shouldReduceMotion ? (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0.32, scale: 0.55 }}
          animate={{ opacity: 0, scale: 1.45 }}
          transition={{ duration: 0.46, ease: EASE_OUT, delay: 0.04 }}
          className="absolute inset-0 rounded-full bg-current"
        />
      ) : null}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="relative size-full overflow-visible"
      >
        <motion.circle
          cx="12"
          cy="12"
          r={CIRCLE_RADIUS}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray={CIRCLE_LENGTH}
          initial={
            shouldReduceMotion
              ? { strokeDashoffset: 0, opacity: 1 }
              : { strokeDashoffset: CIRCLE_LENGTH, opacity: 0.55 }
          }
          animate={{ strokeDashoffset: 0, opacity: 1 }}
          transition={circleTransition}
          style={{ rotate: -90, transformOrigin: "50% 50%" }}
        />
        <motion.path
          d="m7.75 12.25 2.8 2.85 5.95-6.35"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray={CHECK_LENGTH}
          initial={
            shouldReduceMotion
              ? { strokeDashoffset: 0, opacity: 1 }
              : { strokeDashoffset: CHECK_LENGTH, opacity: 0 }
          }
          animate={{ strokeDashoffset: 0, opacity: 1 }}
          transition={checkTransition}
        />
      </svg>
    </motion.span>
  );
}
