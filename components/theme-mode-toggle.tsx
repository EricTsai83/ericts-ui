"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "fumadocs-ui/provider/base";

import { cn } from "@/lib/utils";

type ThemeModeToggleProps = {
  className?: string;
};

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeModeToggle({ className }: ThemeModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );
  const isDark = resolvedTheme === "dark";
  const shouldReduceMotion = useReducedMotion();
  const [visualOverride, setVisualOverride] = React.useState<boolean | null>(
    null,
  );
  const visualIsDark = visualOverride ?? isDark;
  const visualOverrideTimer =
    React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonClassName = cn(
    "group inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-transparent text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    className,
  );

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
    }, shouldReduceMotion ? 0 : 260);
    setTheme(nextIsDark ? "dark" : "light");
  }, [setTheme, shouldReduceMotion, visualIsDark]);

  const markTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className={buttonClassName}
      >
        <span className="size-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      aria-pressed={visualIsDark}
      className={buttonClassName}
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
          initial={false}
          animate={{
            opacity: visualIsDark ? 0 : 1,
            scale: visualIsDark ? 0.84 : 1,
            rotate: visualIsDark ? -12 : 0,
          }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          transition={markTransition}
        >
          <g>
            <circle cx="12" cy="12" r="8.1" />
          </g>
          <g
            strokeWidth="1.85"
          >
            <line x1="7.25" y1="13.15" x2="11.15" y2="9.25" />
            <line x1="9.2" y1="15.35" x2="15.35" y2="9.2" />
            <line x1="12.5" y1="17" x2="17" y2="12.5" />
          </g>
        </motion.g>

        <motion.g
          initial={false}
          animate={{
            opacity: visualIsDark ? 1 : 0,
            scale: visualIsDark ? 1 : 0.84,
            rotate: visualIsDark ? 0 : 12,
          }}
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
          transition={markTransition}
        >
          <path
            d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          />
          <g
            strokeWidth="2.05"
          >
            <line x1="7.1" y1="14.5" x2="10.95" y2="10.65" />
            <line x1="9.65" y1="16.35" x2="13.2" y2="12.8" />
            <line x1="13.45" y1="17.15" x2="15.95" y2="14.65" />
          </g>
        </motion.g>
      </svg>
    </button>
  );
}
