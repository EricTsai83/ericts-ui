"use client";

import * as React from "react";
import { motion, useReducedMotion, type Transition } from "motion/react";

import { cn } from "@/lib/utils";

export type SlidingListAlignment = "left" | "right";
export type SlidingListIndicator = "dot" | "dash" | React.ReactElement;

export type SlidingListItem = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  id?: string;
  ariaControls?: string;
};

export type SlidingListProps = Omit<
  React.ComponentProps<"div">,
  "align" | "defaultValue" | "onChange"
> & {
  items: SlidingListItem[];
  /** Controlled active value. Pass null to render without an active item. */
  value?: string | null;
  /** Initial active value. Omit or pass null to start without an active item. */
  defaultValue?: string | null;
  onValueChange?: (value: string, item: SlidingListItem) => void;
  align?: SlidingListAlignment;
  /** A built-in dot or dash, or any custom React node such as an icon. */
  indicator?: SlidingListIndicator;
  listClassName?: string;
  itemClassName?: string;
  labelClassName?: string;
  indicatorClassName?: string;
  onItemPointerEnter?: (item: SlidingListItem) => void;
  onItemFocus?: (item: SlidingListItem) => void;
  "aria-label"?: string;
};

const SLIDE_TRANSITION: Transition = {
  duration: 0.22,
  ease: [0.65, 0, 0.35, 1],
};

function getEnabledItems(items: SlidingListItem[]) {
  return items.filter((item) => !item.disabled);
}

function getSelectableValue(
  items: SlidingListItem[],
  value: string | null | undefined,
) {
  const enabledItems = getEnabledItems(items);

  if (value == null) return null;

  return enabledItems.some((item) => item.value === value)
    ? value
    : null;
}

export function SlidingList({
  items,
  value,
  defaultValue,
  onValueChange,
  align = "left",
  indicator = "dot",
  className,
  listClassName,
  itemClassName,
  labelClassName,
  indicatorClassName,
  onItemPointerEnter,
  onItemFocus,
  "aria-label": ariaLabel = "Options",
  ...props
}: SlidingListProps) {
  const shouldReduceMotion = useReducedMotion();
  const isControlled = value !== undefined;
  const itemRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    () => getSelectableValue(items, defaultValue),
  );

  const enabledItems = React.useMemo(() => getEnabledItems(items), [items]);
  const selectedValue =
    getSelectableValue(items, isControlled ? value : uncontrolledValue);
  const focusableValue = selectedValue ?? enabledItems[0]?.value ?? null;

  const setSelectedValue = React.useCallback(
    (nextValue: string) => {
      const nextItem = items.find((item) => item.value === nextValue);

      if (!nextItem || nextItem.disabled || nextValue === selectedValue) {
        return;
      }

      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onValueChange?.(nextValue, nextItem);
    },
    [isControlled, items, onValueChange, selectedValue],
  );

  const focusItem = React.useCallback((nextValue: string) => {
    itemRefs.current.get(nextValue)?.focus();
  }, []);

  const handleKeyDown = React.useCallback(
    (
      event: React.KeyboardEvent<HTMLButtonElement>,
      currentValue: string,
    ) => {
      if (enabledItems.length === 0) return;

      const currentIndex = Math.max(
        enabledItems.findIndex((item) => item.value === currentValue),
        0,
      );
      const lastIndex = enabledItems.length - 1;
      let nextIndex = currentIndex;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        nextIndex = currentIndex >= lastIndex ? 0 : currentIndex + 1;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = lastIndex;
      } else {
        return;
      }

      event.preventDefault();

      const nextItem = enabledItems[nextIndex];

      if (!nextItem) return;

      setSelectedValue(nextItem.value);
      focusItem(nextItem.value);
    },
    [enabledItems, focusItem, setSelectedValue],
  );

  const transition = shouldReduceMotion
    ? ({ duration: 0 } as const)
    : SLIDE_TRANSITION;
  const isCustomIndicator = indicator !== "dot" && indicator !== "dash";
  const activeOffsetDistance = isCustomIndicator ? 20 : 16;
  const activeOffset =
    align === "left" ? activeOffsetDistance : -activeOffsetDistance;

  return (
    <div
      {...props}
      data-slot="sliding-list"
      data-align={align}
      className={cn("flex w-full", className)}
    >
      <ul
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        data-slot="sliding-list-list"
        data-align={align}
        className={cn("flex w-full flex-col gap-1", listClassName)}
      >
        {items.map((item) => {
          const isActive = selectedValue === item.value;

          return (
            <li key={item.value} role="presentation" className="w-full">
              <button
                id={item.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={item.ariaControls}
                disabled={item.disabled}
                tabIndex={item.value === focusableValue ? 0 : -1}
                ref={(element) => {
                  if (element) {
                    itemRefs.current.set(item.value, element);
                  } else {
                    itemRefs.current.delete(item.value);
                  }
                }}
                data-slot="sliding-list-trigger"
                data-active={isActive ? "" : undefined}
                onClick={() => setSelectedValue(item.value)}
                onKeyDown={(event) => handleKeyDown(event, item.value)}
                onPointerEnter={() => onItemPointerEnter?.(item)}
                onFocus={() => onItemFocus?.(item)}
                className={cn(
                  "flex min-h-9 w-full items-center rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 data-active:text-foreground",
                  align === "left"
                    ? "justify-start text-left"
                    : "justify-end text-right",
                  itemClassName,
                )}
              >
                <motion.span
                  initial={false}
                  // Independent transform values (not a composed `transform`
                  // string), so Motion can use its hardware-accelerated path
                  // instead of interpolating a string on the main thread.
                  animate={{ x: isActive ? activeOffset : 0 }}
                  transition={transition}
                  className="relative inline-flex items-center will-change-transform"
                >
                  <motion.span
                    aria-hidden="true"
                    data-slot="sliding-list-indicator"
                    data-indicator={
                      indicator === "dot" || indicator === "dash"
                        ? indicator
                        : "custom"
                    }
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      y: "-50%",
                      scale: isActive ? 1 : 0.5,
                    }}
                    transition={transition}
                    className={cn(
                      "absolute top-1/2 inline-flex size-3.5 items-center justify-center [&_svg]:size-3.5",
                      align === "left"
                        ? isCustomIndicator
                          ? "-left-5"
                          : "-left-4"
                        : isCustomIndicator
                          ? "-right-5"
                          : "-right-4",
                      indicatorClassName,
                    )}
                  >
                    {indicator === "dot" ? (
                      <span className="size-1 rounded-full bg-current" />
                    ) : indicator === "dash" ? (
                      <span className="h-px w-2.5 bg-current" />
                    ) : (
                      indicator
                    )}
                  </motion.span>
                  <span className={cn("relative", labelClassName)}>
                    {item.label}
                  </span>
                </motion.span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
