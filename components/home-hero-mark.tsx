"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { LogoIcon } from "@/components/icons";

const heartRestState = {
  rotate: 6,
  scale: 1,
};

const heartHoverState = {
  rotate: 0,
  scale: 1.125,
};

const shadowRestState = {
  opacity: 1,
  rotate: -6,
  scale: 1,
};

const shadowHoverState = {
  opacity: 0.9,
  rotate: 0,
  scale: 0.72,
};

const instantTransition = { duration: 0 } as const;
const heartEnterTransition = {
  type: "spring",
  duration: 0.36,
  bounce: 0,
} as const;
const heartExitTransition = {
  type: "spring",
  duration: 0.26,
  bounce: 0,
} as const;
const shadowEnterTransition = {
  type: "spring",
  duration: 0.42,
  bounce: 0,
  delay: 0.025,
} as const;
const shadowExitTransition = {
  type: "spring",
  duration: 0.28,
  bounce: 0,
} as const;

export function HomeHeroMark() {
  const shouldReduceMotion = useReducedMotion();
  const [isHovering, setIsHovering] = React.useState(false);
  const isAligned = !shouldReduceMotion && isHovering;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative aspect-square w-full max-w-[360px] lg:w-[min(100%,360px,38vh)]"
    >
      <motion.div
        initial={false}
        animate={isAligned ? shadowHoverState : shadowRestState}
        transition={
          shouldReduceMotion
            ? instantTransition
            : isAligned
              ? shadowEnterTransition
              : shadowExitTransition
        }
        className="pointer-events-none absolute inset-0 size-full text-foreground/10 dark:text-muted/85"
        style={{ transformOrigin: "center" }}
      >
        <LogoIcon className="size-full" />
      </motion.div>

      <motion.div
        initial={false}
        animate={isAligned ? heartHoverState : heartRestState}
        transition={
          shouldReduceMotion
            ? instantTransition
            : isAligned
              ? heartEnterTransition
              : heartExitTransition
        }
        className="pointer-events-auto absolute inset-[18%] size-[64%] text-foreground/85"
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        style={{ transformOrigin: "center" }}
      >
        <LogoIcon className="size-full" />
      </motion.div>
    </div>
  );
}
