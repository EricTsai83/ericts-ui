"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";

import { cn } from "@/lib/utils";

export type MorphingSegmentedControlItem = {
  value: string;
  label: React.ReactNode;
  icon: React.ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
};

export type MorphingSegmentedControlProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> & {
  items: MorphingSegmentedControlItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (
    value: string,
    item: MorphingSegmentedControlItem,
  ) => void;
  onValueIntent?: (
    value: string,
    item: MorphingSegmentedControlItem,
  ) => void;
  /**
   * Preserves the last selected value across unmount/remount for this key, so
   * route-driven mode switches can still animate from the previous segment.
   */
  transitionKey?: string | null;
  listClassName?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  indicatorClassName?: string;
  "aria-label"?: string;
};

type FlexTarget = {
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
};

const MORPH_TRANSITION: Transition = {
  duration: 0.28,
  ease: [0.77, 0, 0.175, 1],
};

const ACTIVE_FLEX: FlexTarget = {
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: "0px",
};

const INACTIVE_FLEX: FlexTarget = {
  flexGrow: 0,
  flexShrink: 0,
  flexBasis: "2.25rem",
};

const selectedValueByTransitionKey = new Map<string, string>();

function getEnabledItems(items: MorphingSegmentedControlItem[]) {
  return items.filter((item) => !item.disabled);
}

function getSelectableValue(
  items: MorphingSegmentedControlItem[],
  value: string | undefined,
) {
  const enabledItems = getEnabledItems(items);

  return enabledItems.some((item) => item.value === value)
    ? value
    : enabledItems[0]?.value;
}

function getItemByValue(
  items: MorphingSegmentedControlItem[],
  value: string,
) {
  return items.find((item) => item.value === value);
}

export function MorphingSegmentedControl({
  items,
  value,
  defaultValue,
  onValueChange,
  onValueIntent,
  transitionKey,
  className,
  listClassName,
  itemClassName,
  activeItemClassName,
  iconClassName,
  labelClassName,
  indicatorClassName,
  "aria-label": ariaLabel = "Options",
  ...props
}: MorphingSegmentedControlProps) {
  const shouldReduceMotion = useReducedMotion();
  const isControlled = value !== undefined;
  const itemRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    () => getSelectableValue(items, defaultValue) ?? "",
  );

  const enabledItems = React.useMemo(() => getEnabledItems(items), [items]);
  const selectedValue =
    getSelectableValue(items, isControlled ? value : uncontrolledValue) ?? "";

  const [transitionFromValue] = React.useState<string | null>(() => {
    if (!transitionKey) return null;

    const previousValue = selectedValueByTransitionKey.get(transitionKey);

    return previousValue &&
      previousValue !== selectedValue &&
      items.some((item) => item.value === previousValue)
      ? previousValue
      : null;
  });
  const [exitIndicatorDone, setExitIndicatorDone] = React.useState(
    transitionFromValue === null,
  );

  React.useEffect(() => {
    if (!transitionKey || !selectedValue) return;

    selectedValueByTransitionKey.set(transitionKey, selectedValue);
  }, [selectedValue, transitionKey]);

  const setSelectedValue = React.useCallback(
    (nextValue: string) => {
      const nextItem = getItemByValue(items, nextValue);

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

  const handleIntent = React.useCallback(
    (item: MorphingSegmentedControlItem) => {
      if (item.disabled || item.value === selectedValue) return;

      onValueIntent?.(item.value, item);
    },
    [onValueIntent, selectedValue],
  );

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

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = currentIndex >= lastIndex ? 0 : currentIndex + 1;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
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

  const isMountTransition =
    transitionFromValue !== null && !exitIndicatorDone && !shouldReduceMotion;
  const transition = shouldReduceMotion
    ? { duration: 0 }
    : MORPH_TRANSITION;

  return (
    <div
      data-slot="morphing-segmented-control"
      className={cn("flex w-full max-w-sm", className)}
      {...props}
    >
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        data-slot="morphing-segmented-control-list"
        className={cn(
          "flex h-10 w-full items-center gap-1 rounded-xl border bg-muted/70 p-1",
          listClassName,
        )}
      >
        {items.map((item) => {
          const isActive = item.value === selectedValue;
          const isFromValue = item.value === transitionFromValue;
          const animateStyles = isActive ? ACTIVE_FLEX : INACTIVE_FLEX;
          let initialStyles: FlexTarget | false = false;

          if (isMountTransition) {
            if (isActive) {
              initialStyles = INACTIVE_FLEX;
            } else if (isFromValue) {
              initialStyles = ACTIVE_FLEX;
            }
          }

          return (
            <motion.button
              key={item.value}
              ref={(node) => {
                if (node) {
                  itemRefs.current.set(item.value, node);
                } else {
                  itemRefs.current.delete(item.value);
                }
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={item.ariaLabel}
              disabled={item.disabled}
              tabIndex={isActive ? 0 : -1}
              data-slot="morphing-segmented-control-item"
              data-active={isActive ? "" : undefined}
              initial={initialStyles}
              animate={animateStyles}
              transition={transition}
              whileTap={
                item.disabled || shouldReduceMotion
                  ? undefined
                  : { scale: 0.97, transition: { duration: 0.1 } }
              }
              onClick={() => setSelectedValue(item.value)}
              onFocus={() => handleIntent(item)}
              onPointerEnter={() => handleIntent(item)}
              onKeyDown={(event) => handleKeyDown(event, item.value)}
              className={cn(
                "relative flex h-full min-w-0 items-center justify-start overflow-hidden rounded-lg px-2.5 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 data-active:text-foreground",
                itemClassName,
                isActive && activeItemClassName,
              )}
            >
              <AnimatePresence initial={isMountTransition}>
                {isActive ? (
                  <motion.span
                    key="indicator"
                    aria-hidden="true"
                    initial={
                      shouldReduceMotion ? false : { scale: 0.96, opacity: 0 }
                    }
                    animate={{
                      scale: 1,
                      opacity: 1,
                      transition,
                    }}
                    exit={{
                      scale: shouldReduceMotion ? 1 : 0.96,
                      opacity: 0,
                      transition,
                    }}
                    className={cn(
                      "absolute inset-0 rounded-lg bg-background shadow-sm",
                      indicatorClassName,
                    )}
                  />
                ) : null}
              </AnimatePresence>

              {isMountTransition && isFromValue ? (
                <motion.span
                  aria-hidden="true"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={transition}
                  onAnimationComplete={() => setExitIndicatorDone(true)}
                  className={cn(
                    "absolute inset-0 rounded-lg bg-background shadow-sm",
                    indicatorClassName,
                  )}
                />
              ) : null}

              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 grid size-4 shrink-0 place-items-center",
                  iconClassName,
                )}
              >
                {item.icon}
              </span>
              <motion.span
                animate={
                  isActive
                    ? { opacity: 1, x: 0 }
                    : { opacity: 0, x: -4 }
                }
                transition={transition}
                className={cn(
                  "relative z-10 ml-2 whitespace-nowrap",
                  labelClassName,
                )}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
