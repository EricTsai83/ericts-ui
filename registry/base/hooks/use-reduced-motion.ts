"use client";

import * as React from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export type ReducedMotionPreference = "system" | "reduce" | "no-preference";

export function useReducedMotion(
  preference: ReducedMotionPreference = "system",
): boolean {
  const [systemPrefersReducedMotion, setSystemPrefersReducedMotion] =
    React.useState(false);

  React.useEffect(() => {
    if (preference !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    const updatePreference = () => {
      setSystemPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, [preference]);

  if (preference === "reduce") {
    return true;
  }

  if (preference === "no-preference") {
    return false;
  }

  return systemPrefersReducedMotion;
}
