"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

import { LogoIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

// A double-thump "lub-dub" heartbeat with a rest, so the mark feels like it
// keeps skipping back to life. Matches the registry's motion ethos.
const HEARTBEAT = {
  scale: [1, 1.16, 0.97, 1.09, 1, 1, 1],
};

const HEARTBEAT_TRANSITION = {
  duration: 2,
  times: [0, 0.1, 0.2, 0.32, 0.46, 0.75, 1],
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
        {/* Drifting ghost layers — depth + a touch of "lost in motion". */}
        {[
          {
            className: "text-foreground/[0.06] dark:text-muted/40 blur-[2px]",
            drift: { x: ["-6%", "2%", "-6%"], y: ["4%", "-3%", "4%"] },
            duration: 6.5,
          },
          {
            className: "text-foreground/10 dark:text-muted/55",
            drift: { x: ["3%", "-4%", "3%"], y: ["-3%", "3%", "-3%"] },
            duration: 5,
          },
        ].map((layer, index) => (
          <motion.span
            key={index}
            className={cn("absolute inset-0", layer.className)}
            animate={reduceMotion ? undefined : layer.drift}
            transition={{
              duration: layer.duration,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <LogoIcon className="size-full" />
          </motion.span>
        ))}

        {/* The beating heart. */}
        <motion.span
          className="relative text-foreground/90"
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
