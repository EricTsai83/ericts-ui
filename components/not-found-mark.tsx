"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

import { LogoIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

// A double-thump "lub-dub" heartbeat with a rest, so the mark feels like it
// keeps skipping back to life. Matches the registry's motion ethos.
const HEARTBEAT_SCALE = [1, 1.16, 0.97, 1.09, 1, 1, 1];
const MAX_HEARTBEAT_LIFT = Math.max(...HEARTBEAT_SCALE) - 1;
const HEARTBEAT_PROJECTION = HEARTBEAT_SCALE.map((scale) =>
  Math.max(scale - 1, 0) / MAX_HEARTBEAT_LIFT,
);
const HEARTBEAT_TIMES = [0, 0.1, 0.2, 0.32, 0.46, 0.75, 1];

const HEARTBEAT = {
  scale: HEARTBEAT_SCALE,
};

const HEARTBEAT_SHADOW = {
  opacity: HEARTBEAT_PROJECTION.map((distance) => 0.14 - distance * 0.045),
  scale: HEARTBEAT_SCALE,
  x: HEARTBEAT_PROJECTION.map((distance) => `${distance * -18}%`),
};

const HEARTBEAT_TRANSITION = {
  duration: 2,
  times: HEARTBEAT_TIMES,
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatDelay: 0.3,
};

/**
 * The "404" display, with the brand heart standing in for the middle zero.
 * The heart beats on a loop while faint ghost copies drift behind it, as if
 * the page wandered off mid-motion.
 */
export function NotFoundMark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex select-none items-center justify-center font-semibold leading-none tracking-tighter text-[clamp(4.5rem,22vw,11rem)] text-foreground",
        className,
      )}
    >
      <span>4</span>

      <span className="relative mx-[0.06em] inline-flex size-[0.74em] items-center justify-center">
        {/* Projected shadow: a right-side light casts the high beat to the left. */}
        <motion.span
          className="pointer-events-none absolute inset-0 z-0 text-foreground dark:text-muted"
          style={{ transformOrigin: "center" }}
          animate={reduceMotion ? undefined : HEARTBEAT_SHADOW}
          transition={HEARTBEAT_TRANSITION}
        >
          <LogoIcon className="size-full blur-[2px]" />
        </motion.span>

        {/* The beating heart. */}
        <motion.span
          className="relative z-10 text-foreground"
          style={{ transformOrigin: "center" }}
          animate={reduceMotion ? undefined : HEARTBEAT}
          transition={HEARTBEAT_TRANSITION}
        >
          <LogoIcon className="size-full" />
        </motion.span>
      </span>

      <span>4</span>
    </div>
  );
}

const subscribe = () => () => {};
const getPathSnapshot = () =>
  window.location.pathname + window.location.search;
const getServerPathSnapshot = () => "";

/**
 * Shows the address the visitor actually landed on. Read from the browser via
 * useSyncExternalStore so it stays out of the server render (which has no URL).
 */
export function RequestedPath() {
  const path = useSyncExternalStore(
    subscribe,
    getPathSnapshot,
    getServerPathSnapshot,
  );

  return (
    <code className="min-w-0 truncate rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs text-foreground sm:text-sm">
      {path || "this page"}
    </code>
  );
}
