"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type FloatingSelectOption = {
  /** Stable identifier passed back in callbacks. */
  id: string;
  /** What renders for this option. Can be text or any node. */
  label: React.ReactNode;
  /** Optional leading node (icon, swatch, etc.) shown before the label. */
  icon?: React.ReactNode;
};

export interface FloatingSelectProps {
  /** The choices revealed when the button is opened. */
  options: FloatingSelectOption[];
  /** Trigger label shown before the selected value. */
  label?: React.ReactNode;
  /** Optional leading icon for the trigger. */
  icon?: React.ReactNode;
  /** Uncontrolled initial selected option id. */
  defaultValue?: string;
  /** Controlled selected option id. */
  value?: string;
  /** Fires with the selected option whenever it changes. */
  onChange?: (optionId: string, option: FloatingSelectOption) => void;
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
const SHELL_TRANSITION = {
  layout: { duration: 0.2, ease: EASE_OUT },
  opacity: { duration: 0.12, ease: EASE_OUT },
  y: { duration: 0.2, ease: EASE_OUT },
};
const PANEL_TRANSITION = { duration: 0.12, ease: EASE_OUT };

const LIST_VARIANTS = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.028, delayChildren: 0.04 } },
};

const OPTION_VARIANTS = {
  hidden: { opacity: 0, y: -4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.14, ease: EASE_OUT },
  },
};

export function FloatingSelect({
  options,
  label = "Select",
  icon,
  defaultValue,
  value,
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
  const selectId = React.useId();
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [internalSelected, setInternalSelected] = React.useState(
    defaultValue ?? options[0]?.id ?? "",
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

  const selectedId = value ?? internalSelected ?? options[0]?.id;
  const selectedOption = options.find((option) => option.id === selectedId);
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

  const handleSelect = (option: FloatingSelectOption) => {
    if (value === undefined) {
      setInternalSelected(option.id);
    }

    onChange?.(option.id, option);

    if (closeOnSelect) {
      setOpen(false);
    }
  };

  const reduceMotionTransition = shouldReduceMotion ? { duration: 0 } : {};

  const shell = (
    <motion.div
      ref={shellRef}
      layout
      initial={
        reveal && !shouldReduceMotion
          ? { opacity: 0, y: edgeOffset }
          : false
      }
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : SHELL_TRANSITION}
      className={cn(
        "pointer-events-auto flex w-fit flex-col overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-sm",
        position === "bottom" && "justify-end",
        className,
      )}
      style={{ transformOrigin }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {open ? (
          <motion.div
            key="floating-select-options"
            id={`${selectId}-listbox`}
            role="listbox"
            aria-label={typeof label === "string" ? label : "Options"}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0 }}
            transition={{ ...PANEL_TRANSITION, ...reduceMotionTransition }}
            className={cn("w-fit", panelClassName)}
          >
            <motion.div
              className="flex flex-col gap-1.5 p-2"
              variants={shouldReduceMotion ? undefined : LIST_VARIANTS}
              initial={shouldReduceMotion ? false : "hidden"}
              animate={shouldReduceMotion ? undefined : "visible"}
            >
              {options.map((option) => {
                const active = option.id === selectedId;

                return (
                  <motion.button
                    key={option.id}
                    role="option"
                    aria-selected={active}
                    type="button"
                    variants={shouldReduceMotion ? undefined : OPTION_VARIANTS}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex h-8 w-full items-center gap-6 rounded-md px-2.5 text-left text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2.5">
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
            key="floating-select-trigger"
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
              aria-controls={`${selectId}-listbox`}
              onClick={() => setOpen(true)}
              className={cn(
                "group flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                triggerClassName,
              )}
            >
              {icon ? (
                <span className="flex shrink-0 items-center justify-center">
                  {icon}
                </span>
              ) : null}
              {label ? <span className="text-foreground">{label}</span> : null}
              {showSelectedValue && selectedOption ? (
                <span className="text-muted-foreground">
                  {selectedOption.label}
                </span>
              ) : null}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (placement === "inline") {
    return <div className="flex justify-center">{shell}</div>;
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
