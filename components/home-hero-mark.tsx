"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { LogoIcon } from "@/components/icons";

const heartRestState = {
  rotate: 12,
  scale: 1,
  x: "5%",
  y: "-3%",
};

const heartHoverState = {
  rotate: 0,
  scale: 1.125,
  x: "0%",
  y: "0%",
};

const shadowRestState = {
  opacity: 0.92,
  rotate: -10,
  scale: 1,
  x: "-20%",
  y: "-23%",
};

const shadowHoverState = {
  opacity: 0.9,
  rotate: 0,
  scale: 0.72,
  x: "0%",
  y: "0%",
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

const heartHitAreaPath =
  "M128 224.6l-8.8-7.8C54 158.8 16 124 16 78.4 16 46 39.2 24 72 24c22.8 0 41.8 13.2 56 36 14.2-22.8 33.2-36 56-36 32.8 0 56 22 56 54.4 0 45.6-38 80.4-103.2 138.4L128 224.6z";

export function HomeHeroMark() {
  const shouldReduceMotion = useReducedMotion();
  const [isHovering, setIsHovering] = React.useState(false);
  const isAligned = !shouldReduceMotion && isHovering;

  function handleHitAreaPointerEnter(
    event: React.PointerEvent<SVGPathElement>,
  ) {
    if (event.pointerType !== "touch") {
      setIsHovering(true);
    }
  }

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
        className="pointer-events-none absolute inset-0 size-full text-foreground/[0.085] dark:text-muted/75"
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
        className="pointer-events-none absolute inset-[18%] size-[64%] text-foreground/88"
        style={{ transformOrigin: "center" }}
      >
        <LogoIcon className="pointer-events-none size-full" />
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
          viewBox="0 0 256 256"
        >
          <path
            d={heartHitAreaPath}
            fill="transparent"
            stroke="transparent"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="18"
            pointerEvents="all"
            onPointerEnter={handleHitAreaPointerEnter}
            onPointerLeave={() => setIsHovering(false)}
          />
        </svg>
      </motion.div>
    </div>
  );
}
