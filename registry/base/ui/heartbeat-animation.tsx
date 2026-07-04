"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const heartbeatScale = [1, 1.16, 0.97, 1.09, 1, 1, 1];
const heartbeatTimes = [0, 0.1, 0.2, 0.32, 0.46, 0.75, 1];
const maxHeartbeatLift = Math.max(...heartbeatScale) - 1;
const heartbeatProjection = heartbeatScale.map((scale) =>
  Math.max(scale - 1, 0) / maxHeartbeatLift,
);
const heartbeatShadowScale = heartbeatScale.map(
  (scale, index) => scale + heartbeatProjection[index] * 0.055,
);

const heartbeatAnimation = {
  scale: heartbeatScale,
};

const heartbeatShadowAnimation = {
  opacity: heartbeatProjection.map((distance) => 0.12 - distance * 0.035),
  scale: heartbeatShadowScale,
  x: heartbeatProjection.map((distance) => `${distance * -18}%`),
};

const heartbeatTransition = {
  duration: 2,
  times: heartbeatTimes,
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatDelay: 0.3,
};

type HeartbeatTransition = NonNullable<HTMLMotionProps<"span">["transition"]>;

export type HeartbeatProps = React.ComponentPropsWithoutRef<"span"> & {
  /** Classes applied to the visible animated child wrapper. */
  targetClassName?: string;
  /** Classes applied to the projected shadow layer. */
  shadowClassName?: string;
  /** Hide the projected shadow layer. */
  showShadow?: boolean;
  /** Override the default double-thump transition. */
  transition?: HeartbeatTransition;
};

export function Heartbeat({
  className,
  children,
  shadowClassName,
  showShadow = true,
  targetClassName,
  transition = heartbeatTransition,
  ...props
}: HeartbeatProps) {
  const reduceMotion = useReducedMotion();
  const resolvedTransition = reduceMotion ? { duration: 0 } : transition;

  return (
    <span
      data-slot="heartbeat"
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      {...props}
    >
      {showShadow ? (
        <motion.span
          aria-hidden="true"
          data-slot="heartbeat-shadow"
          className={cn(
            "pointer-events-none absolute inset-0 z-0 text-current blur-[5px]",
            shadowClassName,
          )}
          style={{ transformOrigin: "center" }}
          animate={reduceMotion ? undefined : heartbeatShadowAnimation}
          transition={resolvedTransition}
        >
          {children}
        </motion.span>
      ) : null}

      <motion.span
        data-slot="heartbeat-target"
        className={cn("relative z-10 inline-flex text-current", targetClassName)}
        style={{ transformOrigin: "center" }}
        animate={reduceMotion ? undefined : heartbeatAnimation}
        transition={resolvedTransition}
      >
        {children}
      </motion.span>
    </span>
  );
}
