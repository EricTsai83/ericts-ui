import * as React from "react";

import { cn } from "@/lib/utils";

import "./projected-shadow-animation.css";

type ProjectedShadowTimingValue = number | string;
type ProjectedShadowLengthValue = number | string;
type CssVariableStyle = React.CSSProperties & Record<`--${string}`, string>;

export type ProjectedShadowOffset = {
  /** Horizontal offset. Numeric values are converted to px. */
  x?: ProjectedShadowLengthValue;
  /** Vertical offset. Numeric values are converted to px. */
  y?: ProjectedShadowLengthValue;
};

export type ProjectedShadowProps = React.ComponentProps<"span"> & {
  /** Keep the gathered state active without requiring hover. */
  active?: boolean;
  /** Animation duration for release. Numeric values are converted to ms. */
  duration?: ProjectedShadowTimingValue;
  /** Animation duration for gather. Numeric values are converted to ms. */
  activeDuration?: ProjectedShadowTimingValue;
  /** CSS easing used by the transform and opacity transitions. */
  ease?: string;
  /** Blur radius for the far projected shadow. Numeric values are converted to px. */
  projectedShadowBlur?: ProjectedShadowLengthValue;
  /** Resting offset for the far projected shadow. */
  projectedShadowOffset?: ProjectedShadowOffset;
  /** Optional decorative content for the shadow layers. Defaults to children. */
  shadow?: React.ReactNode;
  /** Classes applied to the visible animated child wrapper. */
  targetClassName?: string;
  /** Classes applied to the far projected shadow layer. */
  projectedShadowClassName?: string;
  /** Classes applied to the close contact shadow layer. */
  contactShadowClassName?: string;
  /** Render the far projected shadow layer. Defaults to true. */
  showProjectedShadow?: boolean;
  /** Render the close contact shadow layer. Defaults to true. */
  showContactShadow?: boolean;
};

export function ProjectedShadow({
  active,
  activeDuration,
  children,
  className,
  contactShadowClassName,
  duration,
  ease,
  projectedShadowClassName,
  projectedShadowBlur,
  projectedShadowOffset,
  shadow,
  showContactShadow = true,
  showProjectedShadow = true,
  style,
  targetClassName,
  ...props
}: ProjectedShadowProps) {
  const shadowContent = shadow ?? children;

  return (
    <span
      data-slot="projected-shadow"
      data-active={active ? "" : undefined}
      className={cn(
        "projected-shadow relative inline-flex items-center justify-center",
        className,
      )}
      style={getProjectedShadowStyle(
        {
          activeDuration,
          duration,
          ease,
          projectedShadowBlur,
          projectedShadowOffset,
        },
        style,
      )}
      {...props}
    >
      {showProjectedShadow ? (
        <span
          aria-hidden="true"
          data-slot="projected-shadow-projected"
          className={cn(
            "projected-shadow-layer projected-shadow-projected pointer-events-none absolute inset-0 z-0 inline-flex text-current",
            projectedShadowClassName,
          )}
        >
          {shadowContent}
        </span>
      ) : null}

      {showContactShadow ? (
        <span
          aria-hidden="true"
          data-slot="projected-shadow-contact"
          className={cn(
            "projected-shadow-layer projected-shadow-contact pointer-events-none absolute inset-0 z-0 inline-flex text-current",
            contactShadowClassName,
          )}
        >
          {shadowContent}
        </span>
      ) : null}

      <span
        data-slot="projected-shadow-target"
        className={cn(
          "projected-shadow-layer projected-shadow-target relative z-10 inline-flex text-current",
          targetClassName,
        )}
      >
        {children}
      </span>
    </span>
  );
}

function getProjectedShadowStyle(
  {
    activeDuration,
    duration,
    ease,
    projectedShadowBlur,
    projectedShadowOffset,
  }: Pick<
    ProjectedShadowProps,
    | "activeDuration"
    | "duration"
    | "ease"
    | "projectedShadowBlur"
    | "projectedShadowOffset"
  >,
  style: React.CSSProperties | undefined,
) {
  if (
    activeDuration === undefined &&
    duration === undefined &&
    ease === undefined &&
    projectedShadowBlur === undefined &&
    projectedShadowOffset?.x === undefined &&
    projectedShadowOffset?.y === undefined
  ) {
    return style;
  }

  return {
    ...style,
    ...(activeDuration !== undefined
      ? { "--projected-shadow-active-duration": toCssTime(activeDuration) }
      : {}),
    ...(duration !== undefined
      ? { "--projected-shadow-duration": toCssTime(duration) }
      : {}),
    ...(ease !== undefined ? { "--projected-shadow-ease": ease } : {}),
    ...(projectedShadowBlur !== undefined
      ? { "--projected-shadow-blur": toCssLength(projectedShadowBlur) }
      : {}),
    ...(projectedShadowOffset?.x !== undefined
      ? {
          "--projected-shadow-projected-x": toCssLength(
            projectedShadowOffset.x,
          ),
        }
      : {}),
    ...(projectedShadowOffset?.y !== undefined
      ? {
          "--projected-shadow-projected-y": toCssLength(
            projectedShadowOffset.y,
          ),
        }
      : {}),
  } as CssVariableStyle;
}

function toCssTime(value: ProjectedShadowTimingValue) {
  return typeof value === "number" ? `${value}ms` : value;
}

function toCssLength(value: ProjectedShadowLengthValue) {
  return typeof value === "number" ? `${value}px` : value;
}
