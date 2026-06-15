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
  const skyClipId = React.useId();

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
    }, shouldReduceMotion ? 0 : 360);
    setTheme(nextIsDark ? "dark" : "light");
  }, [setTheme, shouldReduceMotion, visualIsDark]);

  const transition = {
    duration: shouldReduceMotion ? 0 : 0.32,
    ease: [0.645, 0.045, 0.355, 1],
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
        className="size-4.5 transition-colors"
      >
        <defs>
          <clipPath id={skyClipId}>
            <path d="M3 3h18v13.5H3z" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${skyClipId})`}>
          <motion.g
            animate={{
              opacity: visualIsDark ? 0 : 1,
              rotate: visualIsDark ? 90 : 0,
              y: visualIsDark ? 10 : 0,
            }}
            initial={false}
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
            transition={transition}
          >
            <circle cx="12" cy="9" r="3.25" />
            <path d="M12 3.75v1" />
            <path d="M12 13.25v1" />
            <path d="M6.75 9h1" />
            <path d="M16.25 9h1" />
            <path d="M8.25 5.25l.7.7" />
            <path d="M15.05 12.05l.7.7" />
            <path d="M15.75 5.25l-.7.7" />
            <path d="M8.95 12.05l-.7.7" />
          </motion.g>
        </g>
        <motion.g
          animate={{
            opacity: visualIsDark ? 0.72 : 1,
          }}
          initial={false}
          stroke={visualIsDark ? "var(--foreground)" : "var(--muted-foreground)"}
          transition={transition}
        >
          <path d="M4.5 13.5c1.3-1 2.4-1 3.7 0s2.4 1 3.7 0s2.4-1 3.7 0s2.4 1 3.7 0" />
          <path d="M5.5 17c1.1-.8 2.1-.8 3.2 0s2.1.8 3.2 0s2.1-.8 3.2 0s2.1.8 3.2 0" />
        </motion.g>
      </svg>
    </button>
  );
}
