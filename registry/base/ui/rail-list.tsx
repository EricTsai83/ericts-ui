"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type RailListEdge = "top" | "bottom";

export type RailListItem = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  id?: string;
  ariaControls?: string;
};

export type RailListProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  items: RailListItem[];
  /** Controlled active value. Pass null to render without an active item. */
  value?: string | null;
  /** Initial active value. Omit or pass null to start without an active item. */
  defaultValue?: string | null;
  onValueChange?: (value: string, item: RailListItem) => void;
  /** Which edge of the active item carries the indicator bar. */
  edge?: RailListEdge;
  listClassName?: string;
  itemClassName?: string;
  labelClassName?: string;
  indicatorClassName?: string;
  onItemPointerEnter?: (item: RailListItem) => void;
  onItemFocus?: (item: RailListItem) => void;
  "aria-label"?: string;
};

function getEnabledItems(items: RailListItem[]) {
  return items.filter((item) => !item.disabled);
}

function getSelectableValue(
  items: RailListItem[],
  value: string | null | undefined,
) {
  const enabledItems = getEnabledItems(items);

  if (value == null) return null;

  return enabledItems.some((item) => item.value === value) ? value : null;
}

export function RailList({
  items,
  value,
  defaultValue,
  onValueChange,
  edge = "bottom",
  className,
  listClassName,
  itemClassName,
  labelClassName,
  indicatorClassName,
  onItemPointerEnter,
  onItemFocus,
  "aria-label": ariaLabel = "Options",
  ...props
}: RailListProps) {
  const isControlled = value !== undefined;
  const itemRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const [uncontrolledValue, setUncontrolledValue] = React.useState(() =>
    getSelectableValue(items, defaultValue),
  );

  const enabledItems = React.useMemo(() => getEnabledItems(items), [items]);
  const selectedValue = getSelectableValue(
    items,
    isControlled ? value : uncontrolledValue,
  );
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

  return (
    <div
      {...props}
      data-slot="rail-list"
      data-edge={edge}
      className={cn("flex w-full min-w-0", className)}
    >
      <ul
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        data-slot="rail-list-list"
        className={cn(
          "flex w-full min-w-0 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          listClassName,
        )}
      >
        {items.map((item) => {
          const isActive = selectedValue === item.value;

          return (
            <li
              key={item.value}
              role="presentation"
              className="flex min-w-fit flex-1"
            >
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
                data-slot="rail-list-trigger"
                data-active={isActive ? "" : undefined}
                onClick={() => setSelectedValue(item.value)}
                onKeyDown={(event) => handleKeyDown(event, item.value)}
                onPointerEnter={() => onItemPointerEnter?.(item)}
                onFocus={() => onItemFocus?.(item)}
                className={cn(
                  "group relative flex min-h-11 w-full items-center justify-center px-3 py-2 text-center text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-current motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 data-active:text-foreground",
                  itemClassName,
                )}
              >
                <span
                  aria-hidden="true"
                  data-slot="rail-list-indicator"
                  className={cn(
                    "absolute inset-x-3 h-0.5 scale-x-0 bg-current transition-transform duration-200 ease-out group-data-active:scale-x-100 motion-reduce:transition-none",
                    edge === "top" ? "top-0" : "bottom-0",
                    indicatorClassName,
                  )}
                />
                <span className={cn("truncate", labelClassName)}>
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
