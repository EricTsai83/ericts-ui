import * as React from "react";

import { cn } from "@/lib/utils";

import "./magnetic-shadow-animation.css";

type MagneticShadowTimingValue = number | string;
type CssVariableStyle = React.CSSProperties & Record<`--${string}`, string>;

export type MagneticShadowProps = React.ComponentPropsWithoutRef<"span"> & {
  /** Keep the gathered state active without requiring hover. */
  active?: boolean;
  /** Animation duration for release. Numeric values are converted to ms. */
  duration?: MagneticShadowTimingValue;
  /** Animation duration for gather. Numeric values are converted to ms. */
  activeDuration?: MagneticShadowTimingValue;
  /** CSS easing used by the transform and opacity transitions. */
  ease?: string;
  /** Optional decorative content for the shadow layers. Defaults to children. */
  shadow?: React.ReactNode;
  /** Classes applied to the visible animated child wrapper. */
  targetClassName?: string;
  /** Classes applied to the far projected shadow layer. */
  projectedShadowClassName?: string;
  /** Classes applied to the close contact shadow layer. */
  contactShadowClassName?: string;
  /** Hide the far projected shadow layer. */
  showProjectedShadow?: boolean;
  /** Hide the close contact shadow layer. */
  showContactShadow?: boolean;
};

export function MagneticShadow({
  active,
  activeDuration,
  children,
  className,
  contactShadowClassName,
  duration,
  ease,
  projectedShadowClassName,
  shadow,
  showContactShadow = true,
  showProjectedShadow = true,
  style,
  targetClassName,
  ...props
}: MagneticShadowProps) {
  const shadowContent = shadow ?? children;

  return (
    <span
      data-slot="magnetic-shadow"
      data-active={active ? "true" : undefined}
      className={cn(
        "magnetic-shadow relative inline-flex items-center justify-center",
        className,
      )}
      style={getMagneticShadowStyle({ activeDuration, duration, ease }, style)}
      {...props}
    >
      {showProjectedShadow ? (
        <span
          aria-hidden="true"
          data-slot="magnetic-shadow-projected"
          className={cn(
            "magnetic-shadow-layer magnetic-shadow-projected pointer-events-none absolute inset-0 z-0 inline-flex text-current blur-[6px]",
            projectedShadowClassName,
          )}
        >
          {shadowContent}
        </span>
      ) : null}

      {showContactShadow ? (
        <span
          aria-hidden="true"
          data-slot="magnetic-shadow-contact"
          className={cn(
            "magnetic-shadow-layer magnetic-shadow-contact pointer-events-none absolute inset-0 z-0 inline-flex text-current",
            contactShadowClassName,
          )}
        >
          {shadowContent}
        </span>
      ) : null}

      <span
        data-slot="magnetic-shadow-target"
        className={cn(
          "magnetic-shadow-layer magnetic-shadow-target relative z-10 inline-flex text-current",
          targetClassName,
        )}
      >
        {children}
      </span>
    </span>
  );
}

function getMagneticShadowStyle(
  {
    activeDuration,
    duration,
    ease,
  }: Pick<MagneticShadowProps, "activeDuration" | "duration" | "ease">,
  style: React.CSSProperties | undefined,
) {
  if (activeDuration === undefined && duration === undefined && ease === undefined) {
    return style;
  }

  return {
    ...style,
    ...(activeDuration !== undefined
      ? { "--magnetic-shadow-active-duration": toCssTime(activeDuration) }
      : {}),
    ...(duration !== undefined
      ? { "--magnetic-shadow-duration": toCssTime(duration) }
      : {}),
    ...(ease !== undefined ? { "--magnetic-shadow-ease": ease } : {}),
  } as CssVariableStyle;
}

function toCssTime(value: MagneticShadowTimingValue) {
  return typeof value === "number" ? `${value}ms` : value;
}
