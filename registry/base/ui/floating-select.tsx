"use client";

import * as React from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";

import { cn } from "@/lib/utils";

type FloatingSelectOptionBase = {
  /** What renders for this option. Can be text or any node. */
  label: React.ReactNode;
  /** Optional leading node (icon, swatch, etc.) shown before the label. */
  icon?: React.ReactNode;
};

export type FloatingSelectOption = FloatingSelectOptionBase &
  (
    | {
        /** Stable value passed back in callbacks. */
        value: string;
        /** @deprecated Use `value`. Kept for compatibility with earlier versions. */
        id?: string;
      }
    | {
        /** @deprecated Use `value`. Kept for compatibility with earlier versions. */
        id: string;
        /** Stable value passed back in callbacks. */
        value?: string;
      }
  );

export interface FloatingSelectProps {
  /** The choices revealed when the button is opened. */
  options: FloatingSelectOption[];
  /** Trigger label shown before the selected value. */
  label?: React.ReactNode;
  /** Optional leading icon for the trigger. */
  icon?: React.ReactNode;
  /** Uncontrolled initial selected option value. */
  defaultValue?: string;
  /** Controlled selected option value. */
  value?: string;
  /** Fires with the selected option whenever it changes. */
  onValueChange?: (value: string, option: FloatingSelectOption) => void;
  /** @deprecated Use `onValueChange`. Kept for compatibility with earlier versions. */
  onChange?: (value: string, option: FloatingSelectOption) => void;
  /** Close the panel after selecting an option. */
  closeOnSelect?: boolean;
  /** Show the selected value next to the trigger label. */
  showSelectedValue?: boolean;
  /** Pin the select to the viewport, or render it in normal document flow. */
  placement?: "fixed" | "inline";
  /** Pin the select to the top or bottom of the viewport. */
  position?: "top" | "bottom";
  /** Horizontal alignment of the floating select. */
  align?: "start" | "center" | "end";
  /** Distance from the pinned edge, in pixels. */
  offset?: number;
  /** Play the entrance animation on mount. */
  reveal?: boolean;
  /** Classes applied to the floating shell. */
  className?: string;
  /** Classes applied to the trigger button. */
  triggerClassName?: string;
  /** Classes applied to the options panel. */
  panelClassName?: string;
}

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const SHELL_LAYOUT_DURATION = 0.26;
const PANEL_DURATION = 0.16;
const OPTION_STAGGER = 0.028;
const OPTION_DELAY = 0.04;
const OPTION_DURATION = 0.13;
const SHELL_TRANSITION = {
  layout: { type: "spring", duration: SHELL_LAYOUT_DURATION, bounce: 0 },
  opacity: { duration: PANEL_DURATION, ease: EASE_OUT },
  y: { duration: 0.22, ease: EASE_OUT },
} as const;
const PANEL_TRANSITION = { duration: PANEL_DURATION, ease: EASE_OUT };
const PANEL_EXIT_TRANSITION = { duration: 0.08, ease: EASE_OUT };
const ACTIVE_SURFACE_TRANSITION = {
  type: "spring",
  duration: 0.22,
  bounce: 0,
  opacity: { duration: 0.14, ease: EASE_OUT },
} as const;

function getCssPixels(value: string) {
  const pixels = Number.parseFloat(value);

  return Number.isFinite(pixels) ? pixels : 0;
}

function getOptionValue(option: FloatingSelectOption) {
  return (option.value ?? option.id) as string;
}

function getOpenHoverLockDelay(optionCount: number) {
  const listDuration =
    OPTION_DELAY + Math.max(optionCount - 1, 0) * OPTION_STAGGER + OPTION_DURATION;

  return Math.ceil(
    Math.max(SHELL_LAYOUT_DURATION, PANEL_DURATION, listDuration) * 1000,
  );
}

export function FloatingSelect({
  options,
  label = "Select",
  icon,
  defaultValue,
  value,
  onValueChange,
  onChange,
  closeOnSelect = true,
  showSelectedValue = true,
  placement = "fixed",
  position = "bottom",
  align = "center",
  offset = 16,
  reveal = false,
  className,
  triggerClassName,
  panelClassName,
}: FloatingSelectProps) {
  const shellRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const reactId = React.useId();
  const listboxId = `${reactId}-listbox`;
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [optionHoverLocked, setOptionHoverLocked] = React.useState(false);
  const [inlineAnchorSize, setInlineAnchorSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);
  const [internalSelected, setInternalSelected] = React.useState(
    defaultValue ?? (options[0] ? getOptionValue(options[0]) : ""),
  );

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  React.useEffect(() => {
    if (!open || shouldReduceMotion === true || !optionHoverLocked) return;

    const timeout = window.setTimeout(() => {
      setOptionHoverLocked(false);
    }, getOpenHoverLockDelay(options.length));

    return () => window.clearTimeout(timeout);
  }, [open, optionHoverLocked, options.length, shouldReduceMotion]);

  const selectedValue =
    value ?? internalSelected ?? (options[0] ? getOptionValue(options[0]) : "");
  const selectedOption = options.find(
    (option) => getOptionValue(option) === selectedValue,
  );
  const alignClass =
    align === "start"
      ? "justify-start"
      : align === "end"
        ? "justify-end"
        : "justify-center";
  const transformOriginX =
    align === "start" ? "left" : align === "end" ? "right" : "center";
  const transformOrigin = `${transformOriginX} ${position}`;
  const edgeOffset = (offset + 20) * (position === "top" ? -1 : 1);
  const activeSurfaceLayoutId = shouldReduceMotion
    ? undefined
    : "floating-select-active-surface";
  const optionHoverEnabled =
    shouldReduceMotion === true || !optionHoverLocked;

  const handleSelect = (option: FloatingSelectOption) => {
    const nextValue = getOptionValue(option);

    if (value === undefined) {
      setInternalSelected(nextValue);
    }

    onValueChange?.(nextValue, option);

    if (!onValueChange) {
      onChange?.(nextValue, option);
    }

    if (closeOnSelect) {
      setOpen(false);
    }
  };

  const updateInlineAnchorSize = React.useCallback(
    (nextSize: { width: number; height: number }) => {
      setInlineAnchorSize((current) => {
        if (
          current?.width === nextSize.width &&
          current.height === nextSize.height
        ) {
          return current;
        }

        return nextSize;
      });
    },
    [],
  );

  const measureInlineAnchorSize = React.useCallback(() => {
    if (placement !== "inline") return;

    const trigger = triggerRef.current;

    if (!trigger) return;

    const { width, height } = trigger.getBoundingClientRect();
    const shell = shellRef.current;
    const shellStyles = shell ? window.getComputedStyle(shell) : null;
    const borderX = shellStyles
      ? getCssPixels(shellStyles.borderLeftWidth) +
        getCssPixels(shellStyles.borderRightWidth)
      : 0;
    const borderY = shellStyles
      ? getCssPixels(shellStyles.borderTopWidth) +
        getCssPixels(shellStyles.borderBottomWidth)
      : 0;

    updateInlineAnchorSize({
      width: width + borderX,
      height: height + borderY,
    });
  }, [placement, updateInlineAnchorSize]);

  const handleOpen = () => {
    measureInlineAnchorSize();
    setOptionHoverLocked(shouldReduceMotion !== true);
    setOpen(true);
  };

  const reduceMotionTransition = shouldReduceMotion ? { duration: 0 } : {};
  const listVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: OPTION_STAGGER,
        staggerDirection: position === "bottom" ? -1 : 1,
        delayChildren: OPTION_DELAY,
      },
    },
  };
  const optionVariants = {
    hidden: { opacity: 0, y: position === "bottom" ? 3 : -3 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: OPTION_DURATION, ease: EASE_OUT },
    },
  };

  const shell = (
    <LayoutGroup id={reactId}>
      <motion.div
        ref={shellRef}
        layout
        data-slot="floating-select"
        data-state={open ? "open" : "closed"}
        initial={
          reveal && !shouldReduceMotion
            ? { opacity: 0, y: edgeOffset }
            : false
        }
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : SHELL_TRANSITION}
        className={cn(
          "pointer-events-auto flex w-fit flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-sm",
          className,
        )}
        style={{ transformOrigin }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div
              key="floating-select-options"
              id={listboxId}
              role="listbox"
              aria-label={typeof label === "string" ? label : "Options"}
              data-slot="floating-select-listbox"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={
                shouldReduceMotion
                  ? undefined
                  : { opacity: 0, transition: PANEL_EXIT_TRANSITION }
              }
              transition={{ ...PANEL_TRANSITION, ...reduceMotionTransition }}
              className={cn("w-fit", panelClassName)}
            >
              <motion.div
                data-slot="floating-select-options"
                className="flex flex-col gap-1.5 p-2"
                variants={shouldReduceMotion ? undefined : listVariants}
                initial={shouldReduceMotion ? false : "hidden"}
                animate={shouldReduceMotion ? undefined : "visible"}
              >
                {options.map((option) => {
                  const optionValue = getOptionValue(option);
                  const active = optionValue === selectedValue;

                  return (
                    <motion.button
                      key={optionValue}
                      role="option"
                      aria-selected={active}
                      type="button"
                      data-slot="floating-select-option"
                      data-active={active ? "" : undefined}
                      variants={shouldReduceMotion ? undefined : optionVariants}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "relative flex h-8 w-full items-center gap-6 overflow-hidden rounded-md px-2.5 text-left text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                        active
                          ? "text-primary-foreground"
                          : cn(
                              "text-muted-foreground",
                              optionHoverEnabled &&
                                "hover:bg-accent hover:text-accent-foreground",
                            ),
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId={activeSurfaceLayoutId}
                          aria-hidden="true"
                          initial={
                            shouldReduceMotion
                              ? false
                              : { opacity: 0, scale: 0.98 }
                          }
                          animate={{ opacity: 1, scale: 1 }}
                          transition={ACTIVE_SURFACE_TRANSITION}
                          className="absolute inset-0 rounded-md bg-primary"
                        />
                      ) : null}
                      <span className="relative z-10 flex items-center gap-2.5">
                        {option.icon ? (
                          <span className="flex shrink-0 items-center justify-center">
                            {option.icon}
                          </span>
                        ) : null}
                        <span>{option.label}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              ref={triggerRef}
              key="floating-select-trigger"
              data-slot="floating-select-trigger-wrapper"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0 }}
              transition={{ ...PANEL_TRANSITION, ...reduceMotionTransition }}
              className="flex w-fit items-center p-1"
            >
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                data-slot="floating-select-trigger"
                onClick={handleOpen}
                className={cn(
                  "group relative flex h-8 items-center gap-2 overflow-hidden rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                  triggerClassName,
                )}
              >
                {icon ? (
                  <span className="relative z-10 flex shrink-0 items-center justify-center">
                    {icon}
                  </span>
                ) : null}
                {label ? (
                  <span className="relative z-10 text-foreground">
                    {label}
                  </span>
                ) : null}
                {showSelectedValue && selectedOption ? (
                  <span className="relative z-10 text-muted-foreground">
                    {selectedOption.label}
                  </span>
                ) : null}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );

  if (placement === "inline") {
    return (
      <div
        className="relative flex justify-center"
        style={open && inlineAnchorSize ? inlineAnchorSize : undefined}
      >
        <div
          className={cn(
            open && "absolute left-1/2 -translate-x-1/2",
            open && (position === "top" ? "top-0" : "bottom-0"),
          )}
        >
          {shell}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-50 flex translate-z-0 px-4",
        position === "top" ? "top-0" : "bottom-0",
        alignClass,
      )}
      style={
        position === "top"
          ? { paddingTop: `max(${offset}px, env(safe-area-inset-top))` }
          : { paddingBottom: `max(${offset}px, env(safe-area-inset-bottom))` }
      }
    >
      {shell}
    </div>
  );
}
