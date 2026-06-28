"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import {
  useElementSizeMap,
  type ElementSize,
} from "@/hooks/use-element-size-map";
import { cn } from "@/lib/utils";

// Inlined so the registry item is self-contained. Strong custom ease — the
// defaults like `ease-out` feel weak for a morphing surface like this.
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** A single actionable row inside a tab's menu panel. */
export type ExpandableTabMenuItem = {
  id: string;
  label: string;
  /** Optional secondary line shown under the label. */
  description?: string;
  icon?: ReactNode;
  /** Hint shown on the trailing edge (e.g. a keyboard shortcut). */
  shortcut?: string;
  disabled?: boolean;
  /** Fired when this row is chosen by click, Enter, or Space. */
  onSelect?: () => void;
};

type ExpandableTabBase = {
  id: string;
  /** Shown inside the active tab and used as the trigger's accessible name. */
  label: string;
  icon: ReactNode;
  disabled?: boolean;
};

/**
 * A tab is one of three shapes:
 * - `items` — opens a panel of selectable menu rows.
 * - `content` — opens a panel of arbitrary content (form, search, …).
 * - `onSelect` — no panel; fires immediately like a toolbar button.
 */
export type ExpandableTabItem = ExpandableTabBase &
  (
    | { items: ExpandableTabMenuItem[]; content?: never; onSelect?: never }
    | { content: ReactNode; items?: never; onSelect?: never }
    | { onSelect: () => void; items?: never; content?: never }
  );

export type ExpandableTabsClassNames = {
  root?: string;
  panel?: string;
  bar?: string;
  tab?: string;
  activeTab?: string;
  icon?: string;
  label?: string;
  pill?: string;
  menu?: string;
  menuItem?: string;
};

export interface ExpandableTabsProps {
  items: ExpandableTabItem[];
  /** Open tab id, or null/undefined for the closed (bar-only) state. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string | null) => void;
  /** Fired when a menu row is chosen: (tabId, itemId). */
  onSelect?: (tabId: string, itemId: string) => void;
  /** Collapse the panel after a menu row is chosen. Default true. */
  closeOnSelect?: boolean;
  /** Accessible name for the toolbar. */
  "aria-label"?: string;
  className?: string;
  classNames?: ExpandableTabsClassNames;
}

type ButtonState = "active" | "inactive";
type DockButtonGeometry = { x: number; width: number };

// Width/height transitions use a deterministic ease instead of a spring. Even
// with bounce disabled, spring settling can read as a small horizontal wobble
// when the active label also changes the bar's measured width.
const SHELL_TRANSITION = { duration: 0.24, ease: EASE_OUT } as const;
const TAB_CHANGE_TRANSITION = { duration: 0.24, ease: EASE_OUT } as const;
const LABEL_OPEN = { duration: 0.18, ease: EASE_OUT } as const;

// Fixed bar height keeps the content panel's bottom reserve static so the open
// height is right on the first frame. p-2 (16) + h-9 button (36).
const BAR_H = 52;
const TAB_W = 32;
const BAR_X = 16;
const BAR_GAP = 4;
const ROOT_BORDER = 2;
const PANEL_DOCK_GAP = 4;

// The island grows upward from the bar, so the content emanates from the
// trigger (bottom): it rises into place and collapses back toward the bar.
// Clipped above the dock so rows never pass through the icon bar.
const CONTENT_VARIANTS: Variants = {
  enter: { y: 8, scale: 0.98, opacity: 0, filter: "blur(4px)" },
  center: { y: 0, scale: 1, opacity: 1, filter: "blur(0px)" },
  exit: {
    y: 4,
    scale: 0.98,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.1, ease: EASE_OUT },
  },
};

const REDUCED_CONTENT_VARIANTS: Variants = {
  enter: { opacity: 0, filter: "blur(0px)" },
  center: { opacity: 1, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    filter: "blur(0px)",
    transition: { duration: 0.08, ease: EASE_OUT },
  },
};

const CONTENT_SPRING = { type: "spring", duration: 0.38, bounce: 0 } as const;

function isMenuTab(
  item: ExpandableTabItem,
): item is ExpandableTabBase & { items: ExpandableTabMenuItem[] } {
  return Array.isArray((item as { items?: unknown }).items);
}

function isActionTab(
  item: ExpandableTabItem,
): item is ExpandableTabBase & { onSelect: () => void } {
  return typeof (item as { onSelect?: unknown }).onSelect === "function";
}

/** A tab opens a panel only when it carries menu rows or custom content. */
function hasPanel(item: ExpandableTabItem) {
  return isMenuTab(item) || "content" in item;
}

function buttonSizeId(tabId: string, state: ButtonState) {
  return `${tabId}:${state}`;
}

function getButtonState(tabId: string, activeId: string | null): ButtonState {
  return tabId === activeId ? "active" : "inactive";
}

function useDockGeometry(
  items: ExpandableTabItem[],
  activeId: string | null,
  buttonSizes: Record<string, ElementSize>,
) {
  return useMemo(() => {
    const buttonsById: Record<string, DockButtonGeometry> = {};
    let x = BAR_X / 2;
    let buttonsWidth = 0;

    for (const item of items) {
      const state = getButtonState(item.id, activeId);
      const measured = buttonSizes[buttonSizeId(item.id, state)];
      const width = measured?.width ?? TAB_W;

      buttonsById[item.id] = { x, width };
      buttonsWidth += width;
      x += width + BAR_GAP;
    }

    return {
      buttonsById,
      width:
        buttonsWidth + Math.max(0, items.length - 1) * BAR_GAP + BAR_X,
    };
  }, [activeId, buttonSizes, items]);
}

/**
 * Renders a tab's panel body. The same markup feeds the hidden sizer (so the
 * shell can reserve the right size before opening) and the live panel; only the
 * live copy wires up refs and handlers.
 */
function PanelBody({
  item,
  classNames,
  registerItemRef,
  onItemKeyDown,
  onItemSelect,
}: {
  item: ExpandableTabItem;
  classNames?: ExpandableTabsClassNames;
  registerItemRef?: (index: number, node: HTMLButtonElement | null) => void;
  onItemKeyDown?: (event: KeyboardEvent<HTMLButtonElement>, index: number) => void;
  onItemSelect?: (menuItem: ExpandableTabMenuItem) => void;
}) {
  if (isMenuTab(item)) {
    return (
      <ul
        role="menu"
        aria-label={item.label}
        className={cn("flex w-56 flex-col gap-0.5", classNames?.menu)}
      >
        {item.items.map((menuItem, index) => (
          <li key={menuItem.id} role="none">
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={menuItem.disabled}
              ref={(node) => registerItemRef?.(index, node)}
              onClick={() => onItemSelect?.(menuItem)}
              onKeyDown={(event) => onItemKeyDown?.(event, index)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors",
                "text-foreground hover:bg-foreground/5 focus-visible:bg-foreground/5 active:bg-foreground/10",
                "disabled:pointer-events-none disabled:opacity-40",
                classNames?.menuItem,
              )}
            >
              {menuItem.icon ? (
                <span className="grid size-4 shrink-0 place-items-center text-muted-foreground">
                  {menuItem.icon}
                </span>
              ) : null}
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium leading-tight">
                  {menuItem.label}
                </span>
                {menuItem.description ? (
                  <span className="truncate text-xs leading-tight text-muted-foreground">
                    {menuItem.description}
                  </span>
                ) : null}
              </span>
              {menuItem.shortcut ? (
                <kbd className="ml-auto shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground">
                  {menuItem.shortcut}
                </kbd>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  // Custom-content tab: a labeled region, not a menu.
  return (
    <div role="group" aria-label={item.label} className="w-max">
      {"content" in item ? item.content : null}
    </div>
  );
}

function DockButtonContent({
  item,
  showLabel,
  animatedLabel = false,
  reduce,
  classNames,
}: {
  item: ExpandableTabItem;
  showLabel: boolean;
  animatedLabel?: boolean;
  reduce?: boolean | null;
  classNames?: ExpandableTabsClassNames;
}) {
  const labelClassName = cn(
    "ml-1.5 inline-block whitespace-nowrap",
    classNames?.label,
  );

  return (
    <>
      <span
        className={cn("grid shrink-0 place-items-center", classNames?.icon)}
      >
        {item.icon}
      </span>
      {showLabel ? (
        animatedLabel ? (
          <motion.span
            key={item.id}
            aria-hidden
            initial={
              reduce
                ? { opacity: 1, filter: "blur(0px)" }
                : { opacity: 0, filter: "blur(3px)" }
            }
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={reduce ? { duration: 0 } : LABEL_OPEN}
            className={labelClassName}
          >
            {item.label}
          </motion.span>
        ) : (
          <span className={labelClassName}>{item.label}</span>
        )
      ) : null}
    </>
  );
}

function DockMeasurers({
  items,
  classNames,
  setButtonMeasureRef,
}: {
  items: ExpandableTabItem[];
  classNames?: ExpandableTabsClassNames;
  setButtonMeasureRef: (
    id: string,
  ) => (node: HTMLButtonElement | null) => void;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none invisible absolute left-0 top-0 flex"
    >
      {items.map((item) => (
        <div key={item.id} className="flex">
          {(["inactive", "active"] as const).map((state) => {
            const isActive = state === "active";

            return (
              <button
                key={state}
                ref={setButtonMeasureRef(buttonSizeId(item.id, state))}
                type="button"
                tabIndex={-1}
                className={cn(
                  "relative isolate flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-xl px-2 text-sm font-medium outline-none",
                  isActive && "justify-start pl-2.5 pr-4",
                  classNames?.tab,
                  isActive && classNames?.activeTab,
                )}
              >
                <DockButtonContent
                  item={item}
                  showLabel={isActive}
                  classNames={classNames}
                />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function PanelMeasurers({
  items,
  classNames,
  setPanelMeasureRef,
}: {
  items: ExpandableTabItem[];
  classNames?: ExpandableTabsClassNames;
  setPanelMeasureRef: (id: string) => (node: HTMLDivElement | null) => void;
}) {
  return (
    <>
      {items.filter(hasPanel).map((item) => (
        <div
          key={item.id}
          ref={setPanelMeasureRef(item.id)}
          aria-hidden
          className={cn(
            "pointer-events-none invisible absolute left-0 top-0 w-max px-2 pt-2",
            classNames?.panel,
          )}
          style={{ paddingBottom: BAR_H + PANEL_DOCK_GAP }}
        >
          <div className="w-max">
            <PanelBody item={item} classNames={classNames} />
          </div>
        </div>
      ))}
    </>
  );
}

function DockToolbar({
  items,
  activeId,
  baseId,
  width,
  buttonsById,
  enabledTabIds,
  openingFromClosed,
  reduce,
  ariaLabel,
  classNames,
  registerTabRef,
  onActivate,
  onKeyDown,
}: {
  items: ExpandableTabItem[];
  activeId: string | null;
  baseId: string;
  width: number;
  buttonsById: Record<string, DockButtonGeometry>;
  enabledTabIds: string[];
  openingFromClosed: boolean;
  reduce: boolean | null;
  ariaLabel: string;
  classNames?: ExpandableTabsClassNames;
  registerTabRef: (id: string, node: HTMLButtonElement | null) => void;
  onActivate: (item: ExpandableTabItem) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    item: ExpandableTabItem,
  ) => void;
}) {
  return (
    <motion.div
      role="toolbar"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      initial={false}
      animate={{ width }}
      transition={
        reduce || openingFromClosed ? { duration: 0 } : SHELL_TRANSITION
      }
      className={cn(
        "absolute bottom-0 left-1/2 z-20 -translate-x-1/2",
        classNames?.bar,
      )}
      style={{ height: BAR_H }}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        const geometry = buttonsById[item.id] ?? { x: BAR_X / 2, width: TAB_W };
        const isTabbable =
          item.id === (activeId ?? enabledTabIds[0]) && !item.disabled;
        const popup = isMenuTab(item)
          ? "menu"
          : "content" in item
            ? "dialog"
            : undefined;

        return (
          <motion.button
            key={item.id}
            type="button"
            disabled={item.disabled}
            aria-haspopup={popup}
            aria-expanded={hasPanel(item) ? isActive : undefined}
            aria-controls={isActive ? `${baseId}-panel-${item.id}` : undefined}
            aria-label={item.label}
            tabIndex={isTabbable ? 0 : -1}
            ref={(node) => registerTabRef(item.id, node)}
            onClick={() => onActivate(item)}
            onKeyDown={(event) => onKeyDown(event, item)}
            initial={false}
            animate={{ x: geometry.x, width: geometry.width }}
            transition={
              reduce || openingFromClosed
                ? { duration: 0 }
                : TAB_CHANGE_TRANSITION
            }
            className={cn(
              "absolute left-0 top-2 isolate flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-xl px-2 text-sm font-medium outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:pointer-events-none disabled:opacity-40",
              isActive && "justify-start pl-2.5 pr-4",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
              classNames?.tab,
              isActive && classNames?.activeTab,
            )}
          >
            {isActive ? (
              <span
                className={cn(
                  "absolute inset-0 -z-10 rounded-xl bg-foreground/10",
                  classNames?.pill,
                )}
              />
            ) : null}
            <DockButtonContent
              item={item}
              showLabel={isActive}
              animatedLabel
              reduce={reduce}
              classNames={classNames}
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export function ExpandableTabs({
  items,
  value,
  defaultValue = null,
  onValueChange,
  onSelect,
  closeOnSelect = true,
  "aria-label": ariaLabel = "Quick actions",
  className,
  classNames,
}: ExpandableTabsProps) {
  const reduce = useReducedMotion();
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { setMeasureRef: setPanelMeasureRef, sizes: panelSizes } =
    useElementSizeMap<HTMLDivElement>();
  const { setMeasureRef: setButtonMeasureRef, sizes: buttonSizes } =
    useElementSizeMap<HTMLButtonElement>();

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // When a panel is opened via keyboard we move focus into the first row.
  const focusMenuOnOpen = useRef<"first" | "last" | null>(null);

  const controlled = value !== undefined;
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const activeId = controlled ? value : internal;
  const active = items.find((item) => item.id === activeId) ?? null;
  // An action tab (or a disabled one) never counts as visually open.
  const visualActiveId = active && hasPanel(active) ? active.id : null;
  const visualActive = visualActiveId ? active : null;
  const [openingFromClosed, setOpeningFromClosed] = useState(false);

  const setActive = useCallback(
    (next: string | null) => {
      const nextItem = items.find((item) => item.id === next) ?? null;
      const nextVisualActiveId = nextItem && hasPanel(nextItem) ? next : null;
      setOpeningFromClosed(
        visualActiveId === null && nextVisualActiveId !== null,
      );
      if (!controlled) setInternal(next);
      onValueChange?.(next);
    },
    [controlled, items, onValueChange, visualActiveId],
  );

  const enabledTabIds = items
    .filter((item) => !item.disabled)
    .map((item) => item.id);

  const focusTab = useCallback((id: string) => {
    tabRefs.current[id]?.focus();
  }, []);

  const enabledMenuIndexes = useCallback(
    (item: ExpandableTabItem | null) =>
      item && isMenuTab(item)
        ? item.items
            .map((menuItem, index) => (menuItem.disabled ? -1 : index))
            .filter((index) => index >= 0)
        : [],
    [],
  );

  const focusMenuItem = useCallback((index: number) => {
    menuItemRefs.current[index]?.focus();
  }, []);

  // Move focus into the menu once the panel for a keyboard-opened tab mounts.
  useEffect(() => {
    if (!visualActive || !isMenuTab(visualActive)) {
      menuItemRefs.current = [];
      return;
    }

    const intent = focusMenuOnOpen.current;
    focusMenuOnOpen.current = null;

    if (!intent) return;

    const enabled = enabledMenuIndexes(visualActive);
    if (enabled.length === 0) return;

    const target = intent === "first" ? enabled[0] : enabled[enabled.length - 1];
    focusMenuItem(target);
  }, [enabledMenuIndexes, focusMenuItem, visualActive, visualActiveId]);

  // Outside click / Escape closes — it behaves like an open menu.
  useEffect(() => {
    if (!visualActiveId) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setActive(null);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [setActive, visualActiveId]);

  const activateTab = useCallback(
    (item: ExpandableTabItem) => {
      if (item.disabled) return;

      if (isActionTab(item)) {
        item.onSelect();
        setActive(null);
        return;
      }

      setActive(item.id === visualActiveId ? null : item.id);
    },
    [setActive, visualActiveId],
  );

  const selectMenuItem = useCallback(
    (tab: ExpandableTabItem, menuItem: ExpandableTabMenuItem) => {
      if (menuItem.disabled) return;
      menuItem.onSelect?.();
      onSelect?.(tab.id, menuItem.id);
      if (closeOnSelect) {
        setActive(null);
        focusTab(tab.id);
      }
    },
    [closeOnSelect, focusTab, onSelect, setActive],
  );

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, item: ExpandableTabItem) => {
      const key = event.key;
      const currentIndex = enabledTabIds.indexOf(item.id);
      const lastIndex = enabledTabIds.length - 1;

      if (key === "ArrowRight") {
        event.preventDefault();
        const next = currentIndex >= lastIndex ? 0 : currentIndex + 1;
        focusTab(enabledTabIds[next]);
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        const next = currentIndex <= 0 ? lastIndex : currentIndex - 1;
        focusTab(enabledTabIds[next]);
      } else if (key === "Home") {
        event.preventDefault();
        focusTab(enabledTabIds[0]);
      } else if (key === "End") {
        event.preventDefault();
        focusTab(enabledTabIds[lastIndex]);
      } else if (
        (key === "ArrowDown" || key === "ArrowUp") &&
        isMenuTab(item)
      ) {
        // Open (if needed) and dive into the menu.
        event.preventDefault();
        focusMenuOnOpen.current = key === "ArrowDown" ? "first" : "last";
        if (item.id !== visualActiveId) {
          setActive(item.id);
        } else {
          const enabled = enabledMenuIndexes(item);
          if (enabled.length > 0) {
            focusMenuItem(
              key === "ArrowDown" ? enabled[0] : enabled[enabled.length - 1],
            );
          }
        }
      }
    },
    [
      enabledMenuIndexes,
      enabledTabIds,
      focusMenuItem,
      focusTab,
      setActive,
      visualActiveId,
    ],
  );

  const handleMenuKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (!visualActive || !isMenuTab(visualActive)) return;
      const enabled = enabledMenuIndexes(visualActive);
      if (enabled.length === 0) return;

      const pos = enabled.indexOf(index);
      const key = event.key;

      if (key === "ArrowDown") {
        event.preventDefault();
        focusMenuItem(enabled[(pos + 1) % enabled.length]);
      } else if (key === "ArrowUp") {
        event.preventDefault();
        focusMenuItem(enabled[(pos - 1 + enabled.length) % enabled.length]);
      } else if (key === "Home") {
        event.preventDefault();
        focusMenuItem(enabled[0]);
      } else if (key === "End") {
        event.preventDefault();
        focusMenuItem(enabled[enabled.length - 1]);
      } else if (key === "Tab") {
        // Let focus leave naturally, but collapse the panel behind it.
        setActive(null);
      }
    },
    [enabledMenuIndexes, focusMenuItem, setActive, visualActive],
  );

  // Escape collapses any open panel (menu or custom content) and returns
  // focus to the trigger that opened it.
  const handleRootKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape" && visualActiveId) {
        event.preventDefault();
        const openId = visualActiveId;
        setActive(null);
        focusTab(openId);
      }
    },
    [focusTab, setActive, visualActiveId],
  );

  const dock = useDockGeometry(items, visualActiveId, buttonSizes);
  const registerTabRef = useCallback(
    (id: string, node: HTMLButtonElement | null) => {
      tabRefs.current[id] = node;
    },
    [],
  );
  const closedSize = {
    width: dock.width + ROOT_BORDER,
    height: BAR_H + ROOT_BORDER,
  };

  // The active panel drives the shell, while the dock width is derived from the
  // measured target width of each button state. That keeps the geometry explicit:
  // shell, dock, and buttons all animate toward the same stable numbers.
  const activePanelSize = visualActive ? panelSizes[visualActive.id] : undefined;
  const openSize = activePanelSize
    ? {
        width: Math.max(activePanelSize.width + ROOT_BORDER, closedSize.width),
        height: Math.max(activePanelSize.height + ROOT_BORDER, closedSize.height),
      }
    : closedSize;
  const targetSize = visualActive ? openSize : closedSize;

  return (
    <>
      <div
        ref={rootRef}
        onKeyDown={handleRootKeyDown}
        style={{
          width: targetSize.width,
          height: targetSize.height,
          transformOrigin: "bottom center",
        }}
        className={cn("relative", className)}
      >
        <PanelMeasurers
          items={items}
          classNames={classNames}
          setPanelMeasureRef={setPanelMeasureRef}
        />
        <DockMeasurers
          items={items}
          classNames={classNames}
          setButtonMeasureRef={setButtonMeasureRef}
        />

        <motion.div
          initial={false}
          animate={{ width: targetSize.width, height: targetSize.height }}
          transition={
            reduce
              ? { duration: 0 }
              : openingFromClosed
                ? { width: { duration: 0 }, height: SHELL_TRANSITION }
                : SHELL_TRANSITION
          }
          onAnimationComplete={() => setOpeningFromClosed(false)}
          style={{ transformOrigin: "bottom center" }}
          className={cn(
            "absolute bottom-0 left-1/2 -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card",
            classNames?.root,
          )}
        >
          <div
            className={cn(
              "absolute left-0 right-0 top-0 z-10 overflow-hidden px-2 pt-2",
              classNames?.panel,
            )}
            style={{ bottom: BAR_H + PANEL_DOCK_GAP }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {visualActive ? (
                <motion.div
                  key={visualActive.id}
                  id={`${baseId}-panel-${visualActive.id}`}
                  variants={
                    reduce ? REDUCED_CONTENT_VARIANTS : CONTENT_VARIANTS
                  }
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={
                    reduce
                      ? { duration: 0.15, ease: EASE_OUT }
                      : openingFromClosed
                        ? { ...CONTENT_SPRING, delay: 0.04 }
                        : CONTENT_SPRING
                  }
                  className="w-max"
                  style={{
                    transformOrigin: "bottom center",
                    willChange: "transform, opacity, filter",
                  }}
                >
                  <PanelBody
                    item={visualActive}
                    classNames={classNames}
                    registerItemRef={(index, node) => {
                      menuItemRefs.current[index] = node;
                    }}
                    onItemKeyDown={handleMenuKeyDown}
                    onItemSelect={(menuItem) =>
                      selectMenuItem(visualActive, menuItem)
                    }
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>

        <DockToolbar
          items={items}
          activeId={visualActiveId}
          baseId={baseId}
          width={dock.width}
          buttonsById={dock.buttonsById}
          enabledTabIds={enabledTabIds}
          openingFromClosed={openingFromClosed}
          reduce={reduce}
          ariaLabel={ariaLabel}
          classNames={classNames}
          registerTabRef={registerTabRef}
          onActivate={activateTab}
          onKeyDown={handleTabKeyDown}
        />
      </div>
    </>
  );
}
