"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "fumadocs-ui/provider/base";

import { cn } from "@/lib/utils";

type ThemeModeToggleProps = {
  className?: string;
};

export function ThemeModeToggle({ className }: ThemeModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const shouldReduceMotion = useReducedMotion();
  const [visualOverride, setVisualOverride] = React.useState<boolean | null>(
    null,
  );
  const visualIsDark = visualOverride ?? isDark;
  const visualOverrideTimer =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (visualOverrideTimer.current) {
        clearTimeout(visualOverrideTimer.current);
      }
    };
  }, []);

  const toggleTheme = React.useCallback(() => {
    const nextIsDark = !visualIsDark;

    if (visualOverrideTimer.current) {
      clearTimeout(visualOverrideTimer.current);
    }

    setVisualOverride(nextIsDark);
    visualOverrideTimer.current = setTimeout(() => {
      setVisualOverride(null);
    }, shouldReduceMotion ? 0 : 560);
    setTheme(nextIsDark ? "dark" : "light");
  }, [setTheme, shouldReduceMotion, visualIsDark]);

  const exitDuration = shouldReduceMotion ? 0 : 0.24;
  const enterDelay = shouldReduceMotion ? 0 : 0.24;
  const enterDuration = shouldReduceMotion ? 0 : 0.26;
  const sunTransition = {
    duration: visualIsDark ? exitDuration : enterDuration,
    delay: visualIsDark ? 0 : enterDelay,
    ease: [0.645, 0.045, 0.355, 1],
  } as const;
  const moonTransition = {
    duration: visualIsDark ? enterDuration : exitDuration,
    delay: visualIsDark ? enterDelay : 0,
    ease: [0.645, 0.045, 0.355, 1],
  } as const;
  const waveTransition = {
    duration: shouldReduceMotion ? 0 : 0.18,
    ease: "easeOut",
  } as const;

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      aria-pressed={visualIsDark}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:bg-card",
        className,
      )}
      onClick={toggleTheme}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-5 transition-colors"
      >
        <motion.g
          animate={{
            opacity: visualIsDark ? 0 : 1,
            rotate: visualIsDark ? 28 : 0,
            y: visualIsDark ? 6 : 0,
          }}
          initial={false}
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
          transition={sunTransition}
        >
          <circle cx="12" cy="10.4" r="3.45" />
          <path d="M12 3.55v1.25" />
          <path d="M12 16v1.25" />
          <path d="M5.15 10.4h1.25" />
          <path d="M17.6 10.4h1.25" />
          <path d="M7.15 5.55l.88.88" />
          <path d="M15.97 14.37l.88.88" />
          <path d="M16.85 5.55l-.88.88" />
          <path d="M8.03 14.37l-.88.88" />
        </motion.g>
        <motion.g
          animate={{
            opacity: visualIsDark ? 1 : 0,
            rotate: visualIsDark ? 0 : -18,
            x: -0.7,
            y: visualIsDark ? 0 : 6,
          }}
          initial={false}
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
          }}
          transition={moonTransition}
        >
          <path d="M14.75 5.9a4.85 4.85 0 1 0 3.85 8.25a3.05 3.05 0 1 1 -3.85 -8.25Z" />
        </motion.g>
        <motion.g
          animate={{
            opacity: visualIsDark ? 0.72 : 1,
            stroke: visualIsDark
              ? "var(--foreground)"
              : "var(--muted-foreground)",
          }}
          initial={false}
          transition={waveTransition}
        >
          <path d="M2 20c1.45-1.05 2.75-1.05 4.2 0s2.75 1.05 4.2 0s2.75-1.05 4.2 0s2.75 1.05 4.2 0s2.75-1.05 4.2 0" />
        </motion.g>
      </svg>
    </button>
  );
}
