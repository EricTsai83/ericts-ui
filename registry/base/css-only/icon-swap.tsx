"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import "./icon-swap.css";

type IconSwapStyle = React.CSSProperties & {
  "--icon-swap-duration"?: string;
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
  /**
   * CSS transition duration in milliseconds. Defaults to 160ms via the
   * `--icon-swap-duration` custom property, which can also be set in CSS.
   */
  duration?: number;
  /** Classes applied to both icon layers. */
  iconClassName?: string;
};

export function IconSwap({
  active,
  icon,
  activeIcon,
  animated = true,
  duration,
  className,
  iconClassName,
  style,
  ref,
  ...props
}: IconSwapProps) {
  const resolvedStyle: IconSwapStyle = { ...style };

  if (duration !== undefined) {
    resolvedStyle["--icon-swap-duration"] = `${duration}ms`;
  }

  const iconClasses = cn("icon-swap__icon", iconClassName);

  return (
    <span
      {...props}
      ref={ref}
      data-slot="icon-swap"
      data-state={active ? "active" : "inactive"}
      data-animated={animated}
      aria-hidden="true"
      className={cn("icon-swap", className)}
      style={resolvedStyle}
    >
      <span
        data-slot="icon-swap-icon"
        data-state={active ? "closed" : "open"}
        className={iconClasses}
      >
        {icon}
      </span>
      <span
        data-slot="icon-swap-active-icon"
        data-state={active ? "open" : "closed"}
        className={iconClasses}
      >
        {activeIcon}
      </span>
    </span>
  );
}
