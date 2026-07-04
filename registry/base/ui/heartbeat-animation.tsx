"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const heartbeatScale = [1, 1.24, 0.93, 1.19, 0.96, 1, 1];
const heartbeatLift = ["0%", "-4.2%", "1.1%", "-3.2%", "0.7%", "0%", "0%"];
const heartbeatRotate = [0, -1.15, 0.62, -0.85, 0.34, 0, 0];
const heartbeatTimes = [0, 0.055, 0.13, 0.23, 0.34, 0.5, 1];
const maxHeartbeatLift = Math.max(...heartbeatScale) - 1;
const heartbeatProjection = heartbeatScale.map((scale) =>
  Math.max(scale - 1, 0) / maxHeartbeatLift,
);
const heartbeatShadowScale = heartbeatScale.map(
  (scale, index) => scale + heartbeatProjection[index] * 0.055,
);

const heartbeatAnimation = {
  rotate: heartbeatRotate,
  scale: heartbeatScale,
  y: heartbeatLift,
};

const heartbeatShadowAnimation = {
  opacity: heartbeatProjection.map((distance) => 0.13 - distance * 0.04),
  scale: heartbeatShadowScale,
  x: heartbeatProjection.map((distance) => `${distance * -20}%`),
  y: heartbeatProjection.map((distance) => `${distance * -5}%`),
};

const heartbeatTransition = {
  duration: 1.18,
  times: heartbeatTimes,
  ease: "easeOut" as const,
  repeat: Infinity,
  repeatDelay: 0.9,
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
          style={{ transformOrigin: "center 62%" }}
          animate={reduceMotion ? undefined : heartbeatShadowAnimation}
          transition={resolvedTransition}
        >
          {children}
        </motion.span>
      ) : null}

      <motion.span
        data-slot="heartbeat-target"
        className={cn("relative z-10 inline-flex text-current", targetClassName)}
        style={{ transformOrigin: "center 62%" }}
        animate={reduceMotion ? undefined : heartbeatAnimation}
        transition={resolvedTransition}
      >
        {children}
      </motion.span>
    </span>
  );
}
