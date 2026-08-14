"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import {
  motion,
  useReducedMotion,
  type MotionStyle,
  type Transition,
  type Variants,
} from "motion/react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type AdaptiveSwitchSize = "sm" | "default" | "lg";
export type AdaptiveSwitchAnimation = "elastic" | "smooth" | "none";

export type AdaptiveSwitchProps = Omit<
  SwitchPrimitive.Root.Props,
  "children"
> & {
  /** Text revealed on the left when the switch is checked. */
  checkedLabel?: ReactNode;
  /** Text revealed on the right when the switch is unchecked. */
  uncheckedLabel?: ReactNode;
  /** Controls the track and thumb dimensions. */
  size?: AdaptiveSwitchSize;
  /**
   * Controls the thumb motion. Defaults to elastic when labels are present and
   * smooth for a conventional switch.
   */
  animation?: AdaptiveSwitchAnimation;
};

const ELASTIC_SETTLE_TRANSITION: Transition = {
  duration: 0.52,
  times: [0, 0.09, 0.2, 0.31, 0.4, 0.53, 0.64, 0.74, 0.82, 0.89, 0.95, 1],
  ease: [0.65, 0, 0.35, 1],
};

const REDUCED_TRANSITION: Transition = { duration: 0 };
const SLIDE_TRANSITION: Transition = {
  duration: 0.14,
  ease: [0.22, 1, 0.36, 1],
};
const ELASTIC_SCALE_X = [
  1.16, 1.5, 1.24, 0.9, 1.06, 0.97, 1.02, 0.992, 1.012, 0.996, 1,
] as const;
const ELASTIC_SCALE_Y = ELASTIC_SCALE_X.map((scaleX) => 1 / scaleX);

function getStaticThumbStyle(
  checked: boolean,
  hasLabels: boolean,
): MotionStyle {
  return {
    x: checked ? (hasLabels ? "100%" : "calc(100% - 2px)") : "0%",
    scaleX: 1,
    scaleY: 1,
    originX: checked ? 1 : 0,
    originY: 0.5,
  };
}

function createThumbVariants(
  hasLabels: boolean,
  animation: AdaptiveSwitchAnimation,
  shouldReduceMotion: boolean,
): Variants {
  const checkedX = hasLabels ? "100%" : "calc(100% - 2px)";
  const checkedWarmupX = hasLabels ? "24%" : "calc(24% - 2px)";
  const checkedStretchX = hasLabels ? "50%" : "calc(50% - 2px)";
  const checkedSettleX = hasLabels ? "76%" : "calc(76% - 2px)";

  if (shouldReduceMotion || animation !== "elastic") {
    const transition =
      shouldReduceMotion || animation === "none"
        ? REDUCED_TRANSITION
        : SLIDE_TRANSITION;

    return {
      checked: {
        x: checkedX,
        scaleX: 1,
        scaleY: 1,
        originX: 1,
        originY: 0.5,
        transition,
      },
      unchecked: {
        x: "0%",
        scaleX: 1,
        scaleY: 1,
        originX: 0,
        originY: 0.5,
        transition,
      },
    };
  }

  return {
    checked: {
      x: [
        null,
        checkedWarmupX,
        checkedStretchX,
        checkedSettleX,
        checkedX,
        checkedX,
        checkedX,
        checkedX,
        checkedX,
        checkedX,
        checkedX,
        checkedX,
      ],
      scaleX: [null, ...ELASTIC_SCALE_X],
      scaleY: [null, ...ELASTIC_SCALE_Y],
      originX: [null, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
      originY: 0.5,
      transition: ELASTIC_SETTLE_TRANSITION,
    },
    unchecked: {
      x: [
        null,
        "76%",
        "50%",
        "24%",
        "0%",
        "0%",
        "0%",
        "0%",
        "0%",
        "0%",
        "0%",
        "0%",
      ],
      scaleX: [null, ...ELASTIC_SCALE_X],
      scaleY: [null, ...ELASTIC_SCALE_Y],
      originX: [null, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      originY: 0.5,
      transition: ELASTIC_SETTLE_TRANSITION,
    },
  };
}

export function AdaptiveSwitch({
  checkedLabel,
  uncheckedLabel,
  size = "default",
  animation,
  className,
  onCheckedChange,
  ...props
}: AdaptiveSwitchProps) {
  const hasLabels = checkedLabel != null || uncheckedLabel != null;
  const animationMode = animation ?? (hasLabels ? "elastic" : "smooth");
  const shouldReduceMotion = useReducedMotion() ?? false;
  const [hasChanged, setHasChanged] = useState(false);
  const thumbVariants = createThumbVariants(
    hasLabels,
    animationMode,
    shouldReduceMotion,
  );

  return (
    <SwitchPrimitive.Root
      data-slot="adaptive-switch"
      data-size={size}
      data-with-labels={hasLabels ? "true" : "false"}
      data-animation={animationMode}
      data-animated={hasChanged ? "true" : "false"}
      className={cn(
        "group/adaptive-switch relative inline-flex shrink-0 cursor-pointer select-none items-center overflow-visible rounded-full border border-transparent outline-none",
        "data-[animated=true]:transition-[background-color,border-color,box-shadow] data-[animated=true]:duration-150 data-[animated=true]:ease-[ease]",
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "data-checked:bg-primary data-unchecked:bg-input",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50 data-readonly:cursor-default",
        "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:data-unchecked:bg-input/80",
        "data-[animation=none]:transition-none motion-reduce:transition-none",
        hasLabels
          ? "inline-grid min-w-16 grid-cols-2 p-0.5"
          : "data-[size=default]:h-[18.4px] data-[size=default]:w-8 data-[size=lg]:h-7 data-[size=lg]:w-12 data-[size=sm]:h-[17px] data-[size=sm]:w-[30px]",
        hasLabels && size === "default" ? "h-6" : null,
        hasLabels && size === "sm" ? "h-5" : null,
        hasLabels && size === "lg" ? "h-7" : null,
        className,
      )}
      onCheckedChange={(checked, eventDetails) => {
        setHasChanged(true);
        onCheckedChange?.(checked, eventDetails);
      }}
      {...props}
    >
      {hasLabels ? (
        <>
          <span
            aria-hidden="true"
            data-slot="adaptive-switch-checked-label"
            className={cn(
              "col-start-1 row-start-1 inline-flex min-w-max items-center justify-center px-2.5 font-medium text-primary-foreground opacity-0",
              "group-data-[animated=true]/adaptive-switch:transition-opacity group-data-[animated=true]/adaptive-switch:duration-200 group-data-[animated=true]/adaptive-switch:ease-[cubic-bezier(0.65,0,0.35,1)]",
              "group-data-checked/adaptive-switch:opacity-100 group-data-[animation=none]/adaptive-switch:transition-none motion-reduce:transition-none",
              size === "sm"
                ? "px-2 text-[11px]"
                : size === "lg"
                  ? "px-2.5 text-xs"
                  : "text-xs",
            )}
          >
            {checkedLabel}
          </span>
          <span
            aria-hidden="true"
            data-slot="adaptive-switch-unchecked-label"
            className={cn(
              "col-start-2 row-start-1 inline-flex min-w-max items-center justify-center px-2.5 font-medium text-foreground opacity-0",
              "group-data-[animated=true]/adaptive-switch:transition-opacity group-data-[animated=true]/adaptive-switch:duration-200 group-data-[animated=true]/adaptive-switch:ease-[cubic-bezier(0.65,0,0.35,1)]",
              "group-data-unchecked/adaptive-switch:opacity-100 group-data-[animation=none]/adaptive-switch:transition-none motion-reduce:transition-none",
              size === "sm"
                ? "px-2 text-[11px]"
                : size === "lg"
                  ? "px-2.5 text-xs"
                  : "text-xs",
            )}
          >
            {uncheckedLabel}
          </span>
        </>
      ) : null}

      <SwitchPrimitive.Thumb
        data-slot="adaptive-switch-thumb"
        className={cn(
          "group/adaptive-switch-thumb pointer-events-none relative block ring-0",
          hasLabels
            ? "absolute inset-y-0.5 left-0.5 w-[calc(50%-0.125rem)]"
            : "group-data-[size=default]/adaptive-switch:size-4 group-data-[size=lg]/adaptive-switch:size-6 group-data-[size=sm]/adaptive-switch:size-[15px]",
        )}
        render={(thumbProps, state) => (
          <span {...thumbProps}>
            <motion.span
              aria-hidden="true"
              data-slot="adaptive-switch-thumb-visual"
              initial={false}
              animate={
                hasChanged
                  ? state.checked
                    ? "checked"
                    : "unchecked"
                  : undefined
              }
              variants={thumbVariants}
              style={
                hasChanged
                  ? undefined
                  : getStaticThumbStyle(state.checked, hasLabels)
              }
              className={cn(
                "absolute inset-0 rounded-full bg-background ring-0 group-data-checked/adaptive-switch-thumb:dark:bg-primary-foreground group-data-unchecked/adaptive-switch-thumb:dark:bg-foreground",
                hasChanged && animationMode !== "none"
                  ? "will-change-transform"
                  : null,
                hasLabels ? "shadow-sm" : null,
              )}
            />
          </span>
        )}
      />
    </SwitchPrimitive.Root>
  );
}
