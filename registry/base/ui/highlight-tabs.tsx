"use client";

import * as React from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export type HighlightTab = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  /** Id applied to the trigger, so a tabpanel can point back via aria-labelledby. */
  id?: string;
  /** Id of the tabpanel this trigger controls. */
  ariaControls?: string;
};

export type HighlightTabsProps = Omit<
  React.ComponentProps<"div">,
  "defaultValue" | "onChange"
> & {
  tabs: HighlightTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, tab: HighlightTab) => void;
  /**
   * Commit selection when the pointer sweeps over a tab. Defaults to true —
   * the moving highlight is this component's signature interaction. Set it to
   * false when selection drives panel content, so hovering across the list
   * doesn't churn `onValueChange` for every tab it crosses.
   */
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

      onValueChange?.(nextValue, nextTab);
    },
    [activeValue, isControlled, onValueChange, tabs],
  );

  // A controlled `value` that matches no enabled tab (e.g. stale after `tabs`
  // shrinks) must not leave every trigger at tabIndex -1, or the tablist
  // becomes unreachable by keyboard.
  const focusableValue = enabledTabs.some((tab) => tab.value === activeValue)
    ? activeValue
    : enabledTabs[0]?.value;

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
          aria-orientation="horizontal"
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
                  id={tab.id}
                  aria-controls={tab.ariaControls}
                  aria-selected={isActive}
                  disabled={tab.disabled}
                  tabIndex={tab.value === focusableValue ? 0 : -1}
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
