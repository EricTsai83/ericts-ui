"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import { LogoIcon } from "@/components/icons";

const heartRestState = {
  rotate: 10,
  scale: 1.06,
  x: "8%",
  y: "-6%",
};

const heartHoverState = {
  rotate: 0,
  scale: 0.86,
  x: "0%",
  y: "0%",
};

const projectedShadowRestState = {
  opacity: 1,
  rotate: -8,
  scale: 1.08,
  x: "-14%",
  y: "-18%",
};

const projectedShadowHoverState = {
  opacity: 0,
  rotate: -3,
  scale: 0.94,
  x: "-4%",
  y: "-5%",
};

const contactShadowRestState = {
  opacity: 0.16,
  rotate: -2,
  scale: 0.92,
  x: "-4%",
  y: "-5%",
};

const contactShadowHoverState = {
  opacity: 0.72,
  rotate: 0,
  scale: 0.86,
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
  duration: 0.38,
  bounce: 0,
} as const;
const shadowExitTransition = {
  type: "spring",
  duration: 0.3,
  bounce: 0,
} as const;

const heartHitAreaPath =
  "M128 224.6l-8.8-7.8C54 158.8 16 124 16 78.4 16 46 39.2 24 72 24c22.8 0 41.8 13.2 56 36 14.2-22.8 33.2-36 56-36 32.8 0 56 22 56 54.4 0 45.6-38 80.4-103.2 138.4L128 224.6z";

export function HomeHeroMark() {
  const shouldReduceMotion = useReducedMotion();
  const [isHovering, setIsHovering] = React.useState(false);
  const isCompressed = !shouldReduceMotion && isHovering;

  function handleHitAreaPointerEnter(
    event: React.PointerEvent<SVGPathElement>,
  ) {
    if (event.pointerType !== "touch") {
      setIsHovering(true);
    }
  }

  function handleHitAreaMouseEnter() {
    if (window.matchMedia("(hover: hover)").matches) {
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
        animate={
          isCompressed
            ? projectedShadowHoverState
            : projectedShadowRestState
        }
        transition={
          shouldReduceMotion
            ? instantTransition
            : isCompressed
              ? shadowEnterTransition
              : shadowExitTransition
        }
        className="pointer-events-none absolute inset-[14%] size-[72%] blur-[6px] text-foreground/[0.075] dark:text-muted/50"
        style={{ transformOrigin: "center" }}
      >
        <LogoIcon className="size-full" />
      </motion.div>

      <motion.div
        initial={false}
        animate={
          isCompressed ? contactShadowHoverState : contactShadowRestState
        }
        transition={
          shouldReduceMotion
            ? instantTransition
            : isCompressed
              ? shadowEnterTransition
              : shadowExitTransition
        }
        className="pointer-events-none absolute inset-[14%] size-[72%] text-foreground/[0.16] dark:text-muted/55"
        style={{ transformOrigin: "center" }}
      >
        <LogoIcon className="size-full" />
      </motion.div>

      <motion.div
        initial={false}
        animate={isCompressed ? heartHoverState : heartRestState}
        transition={
          shouldReduceMotion
            ? instantTransition
            : isCompressed
              ? heartEnterTransition
              : heartExitTransition
        }
        className="pointer-events-none absolute inset-[14%] size-[72%] text-foreground/88"
        style={{ transformOrigin: "center" }}
      >
        <LogoIcon className="pointer-events-none size-full" />
      </motion.div>

      <svg
        aria-hidden="true"
        className="pointer-events-auto absolute inset-[6%] size-[88%]"
        viewBox="0 0 256 256"
      >
        <path
          d={heartHitAreaPath}
          fill="transparent"
          stroke="transparent"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="28"
          pointerEvents="all"
          onPointerEnter={handleHitAreaPointerEnter}
          onPointerOver={handleHitAreaPointerEnter}
          onPointerLeave={() => setIsHovering(false)}
          onPointerOut={() => setIsHovering(false)}
          onMouseEnter={handleHitAreaMouseEnter}
          onMouseOver={handleHitAreaMouseEnter}
          onMouseLeave={() => setIsHovering(false)}
          onMouseOut={() => setIsHovering(false)}
        />
      </svg>
    </div>
  );
}
