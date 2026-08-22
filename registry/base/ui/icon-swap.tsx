"use client";

import * as React from "react";
import { motion, type Transition, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Both layers cross-fade in place — the outgoing icon shrinks and blurs away
 * while the incoming one sharpens into focus. The blur masks the frames where
 * both icons are semi-transparent, so the swap reads as one icon melting into
 * the other instead of two overlapping ghosts.
 */
const defaultTransition: Transition = {
  duration: 0.16,
  ease: [0.215, 0.61, 0.355, 1],
};

export type IconSwapProps = Omit<
  React.ComponentProps<"span">,
  "aria-hidden" | "children"
> & {
  /** Whether the active icon is visible. */
  active: boolean;
  /** Icon shown while inactive. */
  icon: React.ReactNode;
  /** Icon shown while active. */
  activeIcon: React.ReactNode;
  /** Whether state changes animate. */
  animated?: boolean;
  /** Classes applied to both icon layers. */
  iconClassName?: string;
  /** Transition shared by both icon layers. */
  transition?: Transition;
};

export function IconSwap({
  active,
  icon,
  activeIcon,
  animated = true,
  className,
  iconClassName,
  transition = defaultTransition,
  ref,
  ...props
}: IconSwapProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animated && !reduceMotion;
  const resolvedTransition = shouldAnimate ? transition : { duration: 0 };
  const iconClasses = cn(
    "col-start-1 row-start-1 inline-flex origin-center",
    iconClassName,
  );

  return (
    <span
      {...props}
      ref={ref}
      data-slot="icon-swap"
      data-state={active ? "active" : "inactive"}
      data-animated={animated}
      aria-hidden="true"
      className={cn(
        "relative inline-grid shrink-0 place-items-center",
        className,
      )}
    >
      <motion.span
        initial={false}
        animate={{
          opacity: active ? 0 : 1,
          scale: active ? 0.5 : 1,
          filter: active ? "blur(2px)" : "blur(0px)",
        }}
        transition={resolvedTransition}
        data-slot="icon-swap-icon"
        data-state={active ? "closed" : "open"}
        className={iconClasses}
      >
        {icon}
      </motion.span>
      <motion.span
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          scale: active ? 1 : 0.5,
          filter: active ? "blur(0px)" : "blur(2px)",
        }}
        transition={resolvedTransition}
        data-slot="icon-swap-active-icon"
        data-state={active ? "open" : "closed"}
        className={iconClasses}
      >
        {activeIcon}
      </motion.span>
    </span>
  );
}
