"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

// The surface is one pill: collapsed it is an icon button, expanded it is a
// wider button that holds the track. Pill radii nest cleanly, so the trigger
// fills the surface's content box instead of carrying its own box model.
//
// The glyph, rail, and handle keep the YouTube player's volume control sizing;
// the box around them is tighter and the track is longer. The rim alone no
// longer clears the glyph, so the track carries a small leading inset to hold
// YouTube's 8px gap. The tail is wider than the lead only because our surface
// ends in a rounded cap that a player bar does not have.
const SURFACE_HEIGHT = 36;
const SURFACE_BORDER = 1;
const TRIGGER_SIZE = SURFACE_HEIGHT - SURFACE_BORDER * 2;
const ICON_SIZE = 24;
const DEFAULT_TRACK_WIDTH = 72;
const RAIL_HEIGHT = 3;
const THUMB_SIZE = 12;
const TRACK_INSET = 4;
const TRACK_END_INSET = 12;
const PAGE_STEP_MULTIPLIER = 10;
// Leaving the surface should not snap it shut: a grace period forgives a
// pointer that clips the rounded cap on its way to the thumb. 300ms is the
// hover-intent convention (Radix's close delay) and keeps the whole exit —
// grace plus the 200ms collapse — inside half a second, so a control this
// frequently used never reads as stuck open.
const DEFAULT_COLLAPSE_DELAY = 300;

type ExpandableSliderContextValue = {
  value: number;
  min: number;
  max: number;
  step: number;
  /** Position of the value in [0, 1]. */
  ratio: number;
  disabled: boolean;
  expanded: boolean;
  dragging: boolean;
  label: string;
  valueText?: string;
  trackWidth: number;
  /** Attached by the rail; every measurement is taken from it. */
  railRef: React.RefObject<HTMLDivElement | null>;
  commitValue: (next: number) => void;
  valueFromPointer: (clientX: number) => number | undefined;
  stepBy: (steps: number) => void;
  setDragging: (dragging: boolean) => void;
};

const ExpandableSliderContext =
  React.createContext<ExpandableSliderContextValue | null>(null);

function useExpandableSliderContext(component: string) {
  const context = React.useContext(ExpandableSliderContext);

  if (!context) {
    throw new Error(`${component} must be rendered inside <ExpandableSlider>.`);
  }

  return context;
}

export type ExpandableSliderProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  /** Controlled value. */
  value?: number;
  /** Initial value for uncontrolled usage. */
  defaultValue?: number;
  /** Called after the slider requests a value change. */
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Accessible name applied to the track. */
  label: string;
  /** Spoken value, e.g. `(value) => `${value}%``. */
  formatValueText?: (value: number) => string;
  /** Controlled desktop expansion; mobile viewports stay visually expanded. */
  expanded?: boolean;
  /** Called after the expanded state changes. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Grace period in ms before collapsing once the pointer leaves; 0 collapses immediately. */
  collapseDelay?: number;
  /** Expanded track width in pixels. */
  trackWidth?: number;
  disabled?: boolean;
};

/**
 * Owns the value, the expansion state, and the pill surface. Compose the
 * revealed content from `ExpandableSliderTrigger` and `ExpandableSliderTrack`;
 * the track grows toward whichever side it is written on. Below the `sm`
 * breakpoint, the surface stays expanded so touch users can reach the slider
 * without a hover-only reveal step.
 */
export function ExpandableSlider({
  value,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  formatValueText,
  expanded,
  onExpandedChange,
  collapseDelay = DEFAULT_COLLAPSE_DELAY,
  trackWidth = DEFAULT_TRACK_WIDTH,
  disabled = false,
  className,
  style,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ...props
}: ExpandableSliderProps) {
  const [internalValue, setInternalValue] = React.useState(() =>
    clampToStep(defaultValue, min, max, step),
  );
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const railRef = React.useRef<HTMLDivElement | null>(null);
  // The countdown is stored as the moment the pointer left rather than as a
  // running timer, so a `collapseDelay` change re-arms it against the time
  // already elapsed instead of waiting out the old value.
  const [collapsePendingSince, setCollapsePendingSince] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    if (collapsePendingSince === null) return;

    const remaining = Math.max(
      0,
      collapseDelay - (Date.now() - collapsePendingSince),
    );
    const timeout = setTimeout(() => {
      setCollapsePendingSince(null);
      setHovered(false);
    }, remaining);

    return () => clearTimeout(timeout);
  }, [collapseDelay, collapsePendingSince]);

  const controlled = value !== undefined;
  const currentValue = clampToStep(
    controlled ? value : internalValue,
    min,
    max,
    step,
  );
  const isExpanded =
    expanded ?? (disabled ? false : hovered || focused || dragging);

  const previousExpandedRef = React.useRef(isExpanded);

  React.useEffect(() => {
    if (previousExpandedRef.current === isExpanded) return;

    previousExpandedRef.current = isExpanded;
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  const commitValue = React.useCallback(
    (next: number) => {
      if (!controlled) {
        setInternalValue(next);
      }

      if (next !== currentValue) {
        onValueChange?.(next);
      }
    },
    [controlled, currentValue, onValueChange],
  );

  const valueFromPointer = React.useCallback(
    (clientX: number) => {
      const rail = railRef.current;

      if (!rail) return undefined;

      const rect = rail.getBoundingClientRect();
      const usable = rect.width - THUMB_SIZE;

      if (usable <= 0) return undefined;

      const rawRatio = clamp(
        (clientX - rect.left - THUMB_SIZE / 2) / usable,
        0,
        1,
      );
      // Pointer coordinates are always physical; in an RTL context the track
      // runs right-to-left, so the ratio has to be mirrored to stay on the
      // same side of the rail as the fill.
      const ratio = isRtl(rail) ? 1 - rawRatio : rawRatio;

      return clampToStep(min + ratio * (max - min), min, max, step);
    },
    [max, min, step],
  );

  const stepBy = React.useCallback(
    (steps: number) => {
      commitValue(clampToStep(currentValue + steps * step, min, max, step));
    },
    [commitValue, currentValue, max, min, step],
  );

  const context = React.useMemo<ExpandableSliderContextValue>(
    () => ({
      value: currentValue,
      min,
      max,
      step,
      ratio: max > min ? (currentValue - min) / (max - min) : 0,
      disabled,
      expanded: isExpanded,
      dragging,
      label,
      valueText: formatValueText?.(currentValue),
      trackWidth,
      railRef,
      commitValue,
      valueFromPointer,
      stepBy,
      setDragging,
    }),
    [
      commitValue,
      currentValue,
      disabled,
      dragging,
      formatValueText,
      isExpanded,
      label,
      max,
      min,
      step,
      stepBy,
      trackWidth,
      valueFromPointer,
    ],
  );

  return (
    <ExpandableSliderContext.Provider value={context}>
      <div
        data-slot="expandable-slider"
        data-expanded={isExpanded}
        data-disabled={disabled || undefined}
        className={cn(
          // Mobile is expanded from first paint; desktop starts as a ghost icon
          // button and materialises on interaction. Keeping this responsive
          // branch in CSS avoids a matchMedia hydration flash.
          "group/expandable-slider inline-flex w-fit items-center rounded-full border border-border bg-background bg-clip-padding shadow-xs",
          "transition-[background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0,0,0.2,1)] motion-reduce:transition-none",
          "sm:border-transparent sm:bg-transparent sm:shadow-none sm:data-[expanded=true]:border-border sm:data-[expanded=true]:bg-background sm:data-[expanded=true]:shadow-xs",
          "dark:border-input dark:bg-input/30 sm:dark:border-transparent sm:dark:bg-transparent sm:dark:data-[expanded=true]:border-input sm:dark:data-[expanded=true]:bg-input/30",
          // Focus lives on the children, but the ring belongs to the surface:
          // the panel clips its own content, so a child ring would be cut off.
          "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
          disabled && "opacity-50",
          className,
        )}
        style={{ height: SURFACE_HEIGHT, ...style }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          setCollapsePendingSince(null);
          setHovered(true);
        }}
        onPointerLeave={(event) => {
          onPointerLeave?.(event);

          if (collapseDelay <= 0) {
            setCollapsePendingSince(null);
            setHovered(false);
            return;
          }

          setCollapsePendingSince(Date.now());
        }}
        onFocus={(event) => {
          onFocus?.(event);
          setFocused(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);

          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(false);
          }
        }}
        {...props}
      >
        {children}
      </div>
    </ExpandableSliderContext.Provider>
  );
}

export type ExpandableSliderTriggerProps = React.ComponentProps<"button">;

/** The always-visible control. Pass any icon as `children`. */
export function ExpandableSliderTrigger({
  className,
  style,
  disabled,
  type = "button",
  ...props
}: ExpandableSliderTriggerProps) {
  const context = useExpandableSliderContext("ExpandableSliderTrigger");
  const isDisabled = disabled ?? context.disabled;

  return (
    <button
      type={type}
      disabled={isDisabled}
      data-slot="expandable-slider-trigger"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full text-foreground outline-none transition-colors",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--expandable-slider-icon-size)",
        isDisabled ? "cursor-not-allowed" : "hover:bg-muted",
        className,
      )}
      style={
        {
          width: TRIGGER_SIZE,
          height: TRIGGER_SIZE,
          "--expandable-slider-icon-size": `${ICON_SIZE}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export type ExpandableSliderTrackProps = React.ComponentProps<"div"> & {
  /** Edge the track is anchored to while the panel grows. Use `end` when the track is written before the trigger. */
  align?: "start" | "end";
};

/**
 * The revealed, full-height slider region — the pointer target is the whole
 * region, not the hairline rail, so a 3px bar never has to be hit. Defaults to
 * a rail with a range and a thumb; pass `children` to replace them.
 */
export function ExpandableSliderTrack({
  align = "start",
  className,
  style,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
  ...props
}: ExpandableSliderTrackProps) {
  const context = useExpandableSliderContext("ExpandableSliderTrack");
  const {
    commitValue,
    disabled,
    dragging,
    label,
    max,
    min,
    setDragging,
    stepBy,
    trackWidth,
    value,
    valueFromPointer,
    valueText,
  } = context;

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    setDragging(false);

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const leadInset = align === "start" ? TRACK_INSET : TRACK_END_INSET;
  const tailInset = align === "start" ? TRACK_END_INSET : TRACK_INSET;

  return (
    <div
      data-slot="expandable-slider-panel"
      className={cn(
        "flex h-full w-(--expandable-slider-panel-width) items-center overflow-hidden transition-[width] duration-200 ease-[cubic-bezier(0,0,0.2,1)] will-change-[width] motion-reduce:transition-none",
        "sm:w-0 sm:group-data-[expanded=true]/expandable-slider:w-(--expandable-slider-panel-width)",
        align === "start" ? "justify-start" : "justify-end",
      )}
      style={
        {
          "--expandable-slider-panel-width": `${trackWidth + leadInset + tailInset}px`,
        } as React.CSSProperties
      }
    >
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-orientation="horizontal"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={valueText}
        aria-disabled={disabled || undefined}
        data-slot="expandable-slider-track"
        className={cn(
          "flex h-full shrink-0 touch-none items-center outline-none",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
          className,
        )}
        style={{
          width: trackWidth,
          marginLeft: leadInset,
          marginRight: tailInset,
          ...style,
        }}
        onPointerDown={(event) => {
          onPointerDown?.(event);

          if (event.defaultPrevented || disabled || event.button !== 0) return;

          // Keep the press from selecting surrounding text mid-drag.
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setDragging(true);

          const next = valueFromPointer(event.clientX);

          if (next !== undefined) {
            commitValue(next);
          }
        }}
        onPointerMove={(event) => {
          onPointerMove?.(event);

          if (event.defaultPrevented || !dragging) return;

          const next = valueFromPointer(event.clientX);

          if (next !== undefined) {
            commitValue(next);
          }
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          endDrag(event);
        }}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          endDrag(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);

          if (event.defaultPrevented || disabled) return;

          const steps = KEY_STEPS[event.key];

          if (steps !== undefined) {
            event.preventDefault();
            // Horizontal arrows follow the writing direction (ArrowLeft
            // increases in RTL); the vertical pair and PageUp/Down keep their
            // absolute meaning.
            const directional =
              HORIZONTAL_KEYS.includes(event.key) && isRtl(event.currentTarget)
                ? -steps
                : steps;

            stepBy(directional);
            return;
          }

          if (event.key === "Home") {
            event.preventDefault();
            commitValue(min);
          } else if (event.key === "End") {
            event.preventDefault();
            commitValue(max);
          }
        }}
        {...props}
      >
        {children ?? (
          <ExpandableSliderRail>
            <ExpandableSliderRange />
            <ExpandableSliderThumb />
          </ExpandableSliderRail>
        )}
      </div>
    </div>
  );
}

export type ExpandableSliderRailProps = React.ComponentProps<"div">;

/**
 * The hairline the value is measured against. It publishes the resolved
 * geometry as CSS variables so a replacement range or thumb can read it.
 */
export function ExpandableSliderRail({
  className,
  style,
  ...props
}: ExpandableSliderRailProps) {
  const { railRef, ratio, trackWidth } = useExpandableSliderContext(
    "ExpandableSliderRail",
  );
  const thumbOffset = ratio * Math.max(0, trackWidth - THUMB_SIZE);

  return (
    <div
      ref={railRef}
      aria-hidden="true"
      data-slot="expandable-slider-rail"
      className={cn("relative w-full rounded-full bg-primary/20", className)}
      style={
        {
          height: RAIL_HEIGHT,
          "--expandable-slider-thumb-size": `${THUMB_SIZE}px`,
          "--expandable-slider-thumb-offset": `${thumbOffset}px`,
          // The fill stops at the thumb's centre, not its leading edge.
          "--expandable-slider-fill": `${thumbOffset + THUMB_SIZE / 2}px`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export type ExpandableSliderRangeProps = React.ComponentProps<"div">;

/** The filled portion of the rail. */
export function ExpandableSliderRange({
  className,
  ...props
}: ExpandableSliderRangeProps) {
  return (
    <div
      data-slot="expandable-slider-range"
      className={cn(
        "absolute inset-y-0 start-0 w-(--expandable-slider-fill) rounded-full bg-primary",
        className,
      )}
      {...props}
    />
  );
}

export type ExpandableSliderThumbProps = React.ComponentProps<"div">;

/** The handle. On desktop, it collapses with the surface to avoid clipping. */
export function ExpandableSliderThumb({
  className,
  ...props
}: ExpandableSliderThumbProps) {
  return (
    <div
      data-slot="expandable-slider-thumb"
      className={cn(
        "absolute top-1/2 start-(--expandable-slider-thumb-offset) size-(--expandable-slider-thumb-size) -translate-y-1/2 scale-100 rounded-full bg-primary shadow-sm",
        "transition-transform duration-200 ease-[cubic-bezier(0,0,0.2,1)] motion-reduce:transition-none",
        "sm:group-data-[expanded=false]/expandable-slider:scale-0",
        className,
      )}
      {...props}
    />
  );
}

const KEY_STEPS: Record<string, number | undefined> = {
  ArrowRight: 1,
  ArrowUp: 1,
  ArrowLeft: -1,
  ArrowDown: -1,
  PageUp: PAGE_STEP_MULTIPLIER,
  PageDown: -PAGE_STEP_MULTIPLIER,
};

const HORIZONTAL_KEYS = ["ArrowLeft", "ArrowRight"];

/** Reads the resolved writing direction, so `dir` anywhere up the tree counts. */
function isRtl(element: Element) {
  return window.getComputedStyle(element).direction === "rtl";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clampToStep(value: number, min: number, max: number, step: number) {
  const clamped = clamp(value, min, max);

  if (!(step > 0)) {
    return clamped;
  }

  const snapped = min + Math.round((clamped - min) / step) * step;

  return roundToStepPrecision(clamp(snapped, min, max), step);
}

function roundToStepPrecision(value: number, step: number) {
  const decimals = getDecimalCount(step);

  return decimals === 0 ? Math.round(value) : Number(value.toFixed(decimals));
}

function getDecimalCount(step: number) {
  const text = String(step);

  if (text.includes("e") || text.includes("E")) {
    return 0;
  }

  const separatorIndex = text.indexOf(".");

  return separatorIndex === -1 ? 0 : text.length - separatorIndex - 1;
}
