"use client";

import * as React from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type HighlightTab = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type HighlightTabsProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange"
> & {
  tabs: HighlightTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  selectOnHover?: boolean;
  listClassName?: string;
  tabClassName?: string;
  indicatorClassName?: string;
  "aria-label"?: string;
};

function getEnabledTabs(tabs: HighlightTab[]) {
  return tabs.filter((tab) => !tab.disabled);
}

function getInitialValue(tabs: HighlightTab[], value?: string) {
  const enabledTabs = getEnabledTabs(tabs);

  return enabledTabs.some((tab) => tab.value === value)
    ? value
    : enabledTabs[0]?.value;
}

export function HighlightTabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  selectOnHover = true,
  className,
  listClassName,
  tabClassName,
  indicatorClassName,
  "aria-label": ariaLabel = "Tabs",
  ...props
}: HighlightTabsProps) {
  const shouldReduceMotion = useReducedMotion();
  const reactId = React.useId();
  const layoutId = `highlight-tabs-${reactId}`;
  const isControlled = value !== undefined;
  const tabRefs = React.useRef(new Map<string, HTMLButtonElement>());
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    () => getInitialValue(tabs, defaultValue) ?? "",
  );

  const enabledTabs = React.useMemo(() => getEnabledTabs(tabs), [tabs]);
  const activeValue = isControlled
    ? value
    : enabledTabs.some((tab) => tab.value === uncontrolledValue)
      ? uncontrolledValue
      : enabledTabs[0]?.value;

  const setActiveValue = React.useCallback(
    (nextValue: string) => {
      const nextTab = tabs.find((tab) => tab.value === nextValue);

      if (!nextTab || nextTab.disabled || nextValue === activeValue) return;

      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onValueChange?.(nextValue);
    },
    [activeValue, isControlled, onValueChange, tabs],
  );

  const focusTab = React.useCallback((nextValue: string) => {
    tabRefs.current.get(nextValue)?.focus();
  }, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentValue: string) => {
      if (enabledTabs.length === 0) return;

      const currentIndex = enabledTabs.findIndex(
        (tab) => tab.value === currentValue,
      );
      const lastIndex = enabledTabs.length - 1;
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

      const nextValue = enabledTabs[nextIndex]?.value;

      if (!nextValue) return;

      setActiveValue(nextValue);
      focusTab(nextValue);
    },
    [enabledTabs, focusTab, setActiveValue],
  );

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : ({ type: "spring", duration: 0.24, bounce: 0 } as const);

  return (
    <div
      data-slot="highlight-tabs"
      className={cn("inline-flex", className)}
      {...props}
    >
      <LayoutGroup id={layoutId}>
        <ul
          role="tablist"
          aria-label={ariaLabel}
          data-slot="highlight-tabs-list"
          className={cn(
            "inline-flex items-center gap-1 rounded-lg bg-muted/70 p-1",
            listClassName,
          )}
        >
          {tabs.map((tab) => {
            const isActive = activeValue === tab.value;

            return (
              <li key={tab.value} role="presentation" className="relative">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  disabled={tab.disabled}
                  tabIndex={isActive ? 0 : -1}
                  ref={(element) => {
                    if (element) {
                      tabRefs.current.set(tab.value, element);
                    } else {
                      tabRefs.current.delete(tab.value);
                    }
                  }}
                  data-slot="highlight-tabs-trigger"
                  data-active={isActive ? "" : undefined}
                  onClick={() => setActiveValue(tab.value)}
                  onFocus={() => setActiveValue(tab.value)}
                  onPointerEnter={() => {
                    if (selectOnHover) {
                      setActiveValue(tab.value);
                    }
                  }}
                  onKeyDown={(event) => handleKeyDown(event, tab.value)}
                  className={cn(
                    "relative inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-active:text-foreground",
                    tabClassName,
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="highlight-tabs-indicator"
                      aria-hidden="true"
                      transition={transition}
                      className={cn(
                        "absolute inset-0 rounded-md bg-background shadow-sm",
                        indicatorClassName,
                      )}
                    />
                  ) : null}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </div>
  );
}
