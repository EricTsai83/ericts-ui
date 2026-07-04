"use client";

import { useSyncExternalStore } from "react";

import { LogoIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Heartbeat } from "@/registry/base/ui/heartbeat-animation";

/**
 * The "404" display, with the brand heart standing in for the middle zero.
 * The heart beats on a loop while faint ghost copies drift behind it, as if
 * the page wandered off mid-motion.
 */
export function NotFoundMark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex select-none items-center justify-center font-semibold leading-none tracking-tighter text-[clamp(4.5rem,22vw,11rem)] text-foreground",
        className,
      )}
    >
      <span>4</span>

      <Heartbeat
        className="mx-[0.06em] size-[0.74em]"
        shadowClassName="text-foreground"
        targetClassName="text-foreground"
      >
        <LogoIcon className="size-full" />
      </Heartbeat>

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
