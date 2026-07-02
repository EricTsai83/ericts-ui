"use client";

import { ChevronUp, ListTree } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import * as React from "react";

import { cn } from "@/lib/utils";

const PANEL_TRANSITION = {
  type: "spring",
  duration: 0.24,
  bounce: 0,
} as const;
const CONTENT_TRANSITION = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1],
} as const;
const LIST_TRANSITION = {
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1],
} as const;
const ACTIONS_TRANSITION = {
  duration: 0.18,
  ease: [0.23, 1, 0.32, 1],
} as const;
const REDUCED_TRANSITION = { duration: 0 } as const;
const DEFAULT_SCROLL_ANCHOR_RATIO = 1 / 3;
const SCROLL_MIN_DURATION = 160;
const SCROLL_MAX_DURATION = 320;
const SCROLL_DISTANCE_DURATION_RATIO = 0.45;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const scrollAnimations = new WeakMap<HTMLDivElement, number>();

export type FloatingContextMapItem = {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
};

export type FloatingContextMapGroup = {
  id: string;
  label: React.ReactNode;
  items: FloatingContextMapItem[];
};

export type FloatingContextMapShortcutKey = {
  id: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  "aria-label"?: string;
};

export type FloatingContextMapShortcutGroup = {
  id: string;
  label: React.ReactNode;
  keys: FloatingContextMapShortcutKey[];
};

export type FloatingContextMapAction = {
  id: string;
  label: React.ReactNode;
  shortcut?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  href?: string;
  title?: string;
  "aria-label"?: string;
  onSelect?: () => void;
};

export type FloatingContextMapItemRenderProps = {
  item: FloatingContextMapItem;
  group: FloatingContextMapGroup;
  selected: boolean;
  className: string;
  children: React.ReactNode;
  itemProps: {
    className: string;
    onClick: React.MouseEventHandler<HTMLElement>;
    "aria-current"?: "page";
    "aria-disabled"?: true;
    "data-floating-context-map-current"?: "true";
    "data-disabled"?: "";
    tabIndex?: number;
  };
};

export type FloatingContextMapClassNames = {
  panel?: string;
  content?: string;
  tree?: string;
  group?: string;
  groupLabel?: string;
  item?: string;
  currentItem?: string;
  shortcutHint?: string;
  actions?: string;
  action?: string;
  trigger?: string;
};

export type FloatingContextMapProps = Omit<
  React.ComponentPropsWithoutRef<"aside">,
  "children" | "onSelect"
> & {
  groups: FloatingContextMapGroup[];
  currentItemId: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onItemSelect?: (
    item: FloatingContextMapItem,
    group: FloatingContextMapGroup,
  ) => void;
  closeOnSelect?: boolean;
  actions?: FloatingContextMapAction[];
  actionsExpanded?: boolean;
  defaultActionsExpanded?: boolean;
  onActionsExpandedChange?: (expanded: boolean) => void;
  shortcutGroups?: FloatingContextMapShortcutGroup[];
  renderItem?: (props: FloatingContextMapItemRenderProps) => React.ReactNode;
  triggerIcon?: React.ReactNode;
  openLabel?: string;
  closeLabel?: string;
  actionsLabel?: string;
  initialScrollTop?: number;
  onScrollTopChange?: (scrollTop: number) => void;
  scrollAnchorRatio?: number;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  classNames?: FloatingContextMapClassNames;
};

export function FloatingContextMap({
  groups,
  currentItemId,
  open,
  defaultOpen = false,
  onOpenChange,
  onItemSelect,
  closeOnSelect = false,
  actions = [],
  actionsExpanded,
  defaultActionsExpanded = false,
  onActionsExpandedChange,
  shortcutGroups = [],
  renderItem,
  triggerIcon,
  openLabel = "Open context map",
  closeLabel = "Collapse context map",
  actionsLabel = "Context map actions",
  initialScrollTop = 0,
  onScrollTopChange,
  scrollAnchorRatio = DEFAULT_SCROLL_ANCHOR_RATIO,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  className,
  classNames,
  "aria-label": ariaLabel = "Context map",
  onKeyDown,
  ...props
}: FloatingContextMapProps) {
  const generatedId = React.useId();
  const panelId = `${generatedId}-panel`;
  const actionsId = `${generatedId}-actions`;
  const rootRef = React.useRef<HTMLElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const treeScrollRef = React.useRef<HTMLDivElement>(null);
  const rememberedScrollTopRef = React.useRef(initialScrollTop);
  const lastScrolledItemIdRef = React.useRef(currentItemId);
  const shouldReduceMotion = useReducedMotion();
  const openControlled = open !== undefined;
  const actionsControlled = actionsExpanded !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [uncontrolledActionsExpanded, setUncontrolledActionsExpanded] =
    React.useState(defaultActionsExpanded);
  const isOpen = openControlled ? open : uncontrolledOpen;
  const areActionsExpanded = actionsControlled
    ? actionsExpanded
    : uncontrolledActionsExpanded;
  const hasActions = actions.length > 0;
  const hasShortcutGroups = shortcutGroups.length > 0;
  const currentGroupIndex = React.useMemo(
    () =>
      groups.findIndex((group) =>
        group.items.some((item) => item.id === currentItemId),
      ),
    [currentItemId, groups],
  );
  const panelTransition = shouldReduceMotion
    ? REDUCED_TRANSITION
    : PANEL_TRANSITION;
  const contentTransition = shouldReduceMotion
    ? REDUCED_TRANSITION
    : CONTENT_TRANSITION;
  const listTransition = shouldReduceMotion
    ? REDUCED_TRANSITION
    : LIST_TRANSITION;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!openControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [onOpenChange, openControlled],
  );

  const setActionsExpanded = React.useCallback(
    (nextExpanded: boolean) => {
      if (!actionsControlled) {
        setUncontrolledActionsExpanded(nextExpanded);
      }

      onActionsExpandedChange?.(nextExpanded);
    },
    [actionsControlled, onActionsExpandedChange],
  );

  const updateScrollTop = React.useCallback(
    (scrollTop: number) => {
      rememberedScrollTopRef.current = scrollTop;
      onScrollTopChange?.(scrollTop);
    },
    [onScrollTopChange],
  );

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const selectedItemChanged =
      lastScrolledItemIdRef.current !== currentItemId;
    const scrollContainer = treeScrollRef.current;
    const currentItem = scrollContainer?.querySelector<HTMLElement>(
      "[data-floating-context-map-current='true']",
    );

    if (!scrollContainer || !currentItem) {
      return;
    }

    scrollFloatingContextMapItemIntoView({
      container: scrollContainer,
      item: currentItem,
      rememberedScrollTop: rememberedScrollTopRef.current,
      smooth: selectedItemChanged && !shouldReduceMotion,
      scrollAnchorRatio,
      onScrollTopChange: updateScrollTop,
    });
    lastScrolledItemIdRef.current = currentItemId;
  }, [
    currentItemId,
    isOpen,
    scrollAnchorRatio,
    shouldReduceMotion,
    updateScrollTop,
  ]);

  React.useEffect(() => {
    if (!isOpen || !closeOnOutsideClick) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;

      if (
        !root ||
        !(event.target instanceof Node) ||
        root.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [closeOnOutsideClick, isOpen, setOpen]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      onKeyDown?.(event);

      if (
        event.defaultPrevented ||
        !closeOnEscape ||
        !isOpen ||
        event.key !== "Escape"
      ) {
        return;
      }

      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    },
    [closeOnEscape, isOpen, onKeyDown, setOpen],
  );

  return (
    <aside
      ref={rootRef}
      aria-label={ariaLabel}
      data-slot="floating-context-map"
      data-state={isOpen ? "open" : "closed"}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative inline-flex max-w-[calc(100vw-1.5rem)] justify-end",
        className,
      )}
      {...props}
    >
      <div className="relative flex justify-end">
        <motion.div
          id={panelId}
          initial={false}
          animate={isOpen ? { height: "auto" } : { height: "2rem" }}
          transition={panelTransition}
          style={{ transformOrigin: "top right" }}
          className={cn(
            "relative overflow-hidden rounded-lg border border-border/70 bg-popover/90 text-popover-foreground shadow-md shadow-black/10 backdrop-blur-xl transition-[width] duration-220 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[width,height] motion-reduce:transition-none dark:shadow-black/20",
            isOpen
              ? "w-[min(var(--floating-context-map-width,17rem),calc(100vw-1.5rem))]"
              : "size-8",
            classNames?.panel,
          )}
        >
          <AnimatePresence initial={false}>
            {isOpen ? (
              <motion.div
                key="floating-context-map-content"
                initial={
                  shouldReduceMotion
                    ? false
                    : { opacity: 0, scale: 0.99, filter: "blur(1.5px)" }
                }
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0.82, scale: 0.992, filter: "blur(1.25px)" }
                }
                transition={contentTransition}
                style={{ transformOrigin: "top right" }}
                className={cn(
                  "will-change-[filter,transform,opacity]",
                  classNames?.content,
                )}
              >
                <motion.div
                  data-slot="floating-context-map-tree-wrapper"
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0.94, filter: "blur(1.5px)", y: -1 }
                  }
                  animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 1, filter: "blur(2.5px)", y: -1.5 }
                  }
                  transition={listTransition}
                  className="group/floating-context-map-tree relative will-change-[filter,transform,opacity]"
                >
                  <div
                    ref={treeScrollRef}
                    onScroll={(event) =>
                      updateScrollTop(event.currentTarget.scrollTop)
                    }
                    className={cn(
                      "no-scrollbar max-h-[var(--floating-context-map-max-height,min(15.5rem,calc(100dvh-8rem)))] overflow-y-auto py-2.5 pl-1.5 pr-8",
                      classNames?.tree,
                    )}
                  >
                    <div className="flex flex-col gap-1.5">
                      {groups.map((group, groupIndex) => (
                        <FloatingContextMapGroupTree
                          key={group.id}
                          group={group}
                          groupIndex={groupIndex}
                          currentGroupIndex={currentGroupIndex}
                          currentItemId={currentItemId}
                          closeOnSelect={closeOnSelect}
                          renderItem={renderItem}
                          classNames={classNames}
                          onItemSelect={onItemSelect}
                          onOpenChange={setOpen}
                        />
                      ))}
                    </div>
                  </div>

                  {hasShortcutGroups ? (
                    <FloatingContextMapShortcutHint
                      shortcutGroups={shortcutGroups}
                      className={classNames?.shortcutHint}
                    />
                  ) : null}
                </motion.div>

                {hasActions ? (
                  <FloatingContextMapActions
                    actions={actions}
                    expanded={areActionsExpanded}
                    panelId={actionsId}
                    label={actionsLabel}
                    classNames={classNames}
                    onExpandedChange={setActionsExpanded}
                  />
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <button
          ref={triggerRef}
          type="button"
          aria-controls={panelId}
          aria-expanded={isOpen}
          aria-label={isOpen ? closeLabel : openLabel}
          onClick={() => {
            if (isOpen && areActionsExpanded) {
              setActionsExpanded(false);
            }

            setOpen(!isOpen);
          }}
          className={cn(
            "extend-touch-target absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none",
            isOpen && "text-foreground",
            classNames?.trigger,
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-transparent text-current"
          >
            {triggerIcon ?? <ListTree className="size-3.5" />}
          </span>
        </button>
      </div>
    </aside>
  );
}

function FloatingContextMapGroupTree({
  group,
  groupIndex,
  currentGroupIndex,
  currentItemId,
  closeOnSelect,
  renderItem,
  classNames,
  onItemSelect,
  onOpenChange,
}: {
  group: FloatingContextMapGroup;
  groupIndex: number;
  currentGroupIndex: number;
  currentItemId: string;
  closeOnSelect: boolean;
  renderItem?: (props: FloatingContextMapItemRenderProps) => React.ReactNode;
  classNames?: FloatingContextMapClassNames;
  onItemSelect?: (
    item: FloatingContextMapItem,
    group: FloatingContextMapGroup,
  ) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const isCurrentGroup = groupIndex === currentGroupIndex;

  return (
    <section
      data-slot="floating-context-map-group"
      className={cn("flex min-w-0 flex-col gap-0.5", classNames?.group)}
    >
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 px-2 py-1 text-xs font-semibold leading-4",
          isCurrentGroup ? "text-primary" : "text-foreground/70",
          classNames?.groupLabel,
        )}
      >
        <span className="truncate">{group.label}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        {group.items.map((item) => {
          const selected = item.id === currentItemId;
          const className = cn(
            "flex h-6 min-w-0 items-center rounded-md px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected
              ? "bg-muted/55 font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground",
            item.disabled && "pointer-events-none opacity-50",
            classNames?.item,
            selected && classNames?.currentItem,
          );
          const children = (
            <>
              <span className="truncate">{item.label}</span>
              {item.description ? (
                <span className="sr-only">, {item.description}</span>
              ) : null}
            </>
          );
          const itemProps = {
            className,
            onClick: (event) => {
              if (shouldIgnoreModifiedClick(event)) {
                return;
              }

              if (item.disabled) {
                event.preventDefault();
                return;
              }

              onItemSelect?.(item, group);

              if (closeOnSelect) {
                onOpenChange(false);
              }
            },
            "aria-current": selected ? "page" : undefined,
            "aria-disabled": item.disabled ? true : undefined,
            "data-floating-context-map-current": selected ? "true" : undefined,
            "data-disabled": item.disabled ? "" : undefined,
            tabIndex: item.disabled ? -1 : undefined,
          } satisfies FloatingContextMapItemRenderProps["itemProps"];

          return (
            <React.Fragment key={item.id}>
              {renderItem ? (
                renderItem({
                  item,
                  group,
                  selected,
                  className,
                  children,
                  itemProps,
                })
              ) : (
                <button type="button" disabled={item.disabled} {...itemProps}>
                  {children}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

function FloatingContextMapActions({
  actions,
  expanded,
  panelId,
  label,
  classNames,
  onExpandedChange,
}: {
  actions: FloatingContextMapAction[];
  expanded: boolean;
  panelId: string;
  label: string;
  classNames?: FloatingContextMapClassNames;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion ? REDUCED_TRANSITION : ACTIONS_TRANSITION;

  return (
    <div
      data-slot="floating-context-map-actions"
      className={cn(
        "overflow-hidden border-t border-border/55 bg-popover/80 text-xs",
        expanded && "bg-muted/20",
        classNames?.actions,
      )}
    >
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
        onClick={() => onExpandedChange(!expanded)}
        className={cn(
          "flex h-4 w-full items-center justify-center rounded-none text-muted-foreground outline-none transition-colors hover:bg-muted/35 hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none",
          expanded ? "bg-transparent" : "bg-muted/20",
        )}
      >
        <ChevronUp
          aria-hidden="true"
          className={cn(
            "size-3 transition-transform duration-150 ease-out motion-reduce:transition-none",
            expanded && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="floating-context-map-actions-panel"
            id={panelId}
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            className="overflow-hidden border-t border-border/55"
          >
            <div
              role="group"
              aria-label={label}
              className="grid divide-x divide-border/55 text-xs"
              style={{
                gridTemplateColumns: `repeat(${Math.max(
                  1,
                  Math.min(actions.length, 3),
                )}, minmax(0, 1fr))`,
              }}
            >
              {actions.map((action) => (
                <FloatingContextMapActionControl
                  key={action.id}
                  action={action}
                  className={classNames?.action}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function FloatingContextMapActionControl({
  action,
  className,
}: {
  action: FloatingContextMapAction;
  className?: string;
}) {
  const sharedClassName = cn(
    "flex min-w-0 items-center justify-center gap-1 bg-popover/80 px-1.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
    className,
  );
  const content = (
    <>
      {action.shortcut ? (
        <FloatingContextMapKey className="h-4 min-w-4 rounded-[3px] px-1 py-0 text-center font-mono text-[0.6rem] leading-none text-muted-foreground shadow-none">
          {action.shortcut}
        </FloatingContextMapKey>
      ) : null}
      {action.icon ? (
        <span className="grid size-4 shrink-0 place-items-center">
          {action.icon}
        </span>
      ) : null}
      <span className="whitespace-nowrap text-xs leading-none">
        {action.label}
      </span>
    </>
  );

  if (action.href && !action.disabled) {
    return (
      <a
        href={action.href}
        aria-label={action["aria-label"]}
        title={action.title}
        onClick={() => action.onSelect?.()}
        className={sharedClassName}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={action.disabled}
      aria-label={action["aria-label"]}
      title={action.title}
      onClick={() => action.onSelect?.()}
      className={sharedClassName}
    >
      {content}
    </button>
  );
}

function FloatingContextMapShortcutHint({
  shortcutGroups,
  className,
}: {
  shortcutGroups: FloatingContextMapShortcutGroup[];
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-slot="floating-context-map-shortcut-hint"
      className={cn(
        "pointer-events-none absolute bottom-2 right-2 z-10 flex translate-y-1 items-center gap-1 rounded-md bg-popover/95 px-1.5 py-1 text-[0.65rem] leading-none text-muted-foreground opacity-0 shadow-sm ring-1 ring-border/60 backdrop-blur-md transition-[opacity,transform] duration-150 ease-out group-hover/floating-context-map-tree:translate-y-0 group-hover/floating-context-map-tree:opacity-100 group-focus-within/floating-context-map-tree:translate-y-0 group-focus-within/floating-context-map-tree:opacity-100 motion-reduce:transition-none",
        className,
      )}
    >
      {shortcutGroups.map((group, index) => (
        <React.Fragment key={group.id}>
          {index > 0 ? <span className="h-3 w-px bg-border/70" /> : null}
          <span className="flex items-center gap-1">
            <span className="flex items-center gap-0.5">
              {group.keys.map((key) => (
                <FloatingContextMapKey
                  key={key.id}
                  className="grid size-4 min-w-4 place-items-center rounded-[3px] p-0 px-0 text-center font-mono text-[0.6rem] leading-none text-muted-foreground shadow-none"
                >
                  {key.icon ?? key.label}
                </FloatingContextMapKey>
              ))}
            </span>
            <span>{group.label}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function FloatingContextMapKey({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "shrink-0 rounded-md bg-muted px-1 font-mono text-[0.68rem] leading-none text-foreground shadow-[inset_0_-1px_0_var(--border)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}

function scrollFloatingContextMapItemIntoView({
  container,
  item,
  rememberedScrollTop,
  smooth,
  scrollAnchorRatio,
  onScrollTopChange,
}: {
  container: HTMLDivElement;
  item: HTMLElement;
  rememberedScrollTop: number;
  smooth: boolean;
  scrollAnchorRatio: number;
  onScrollTopChange: (scrollTop: number) => void;
}) {
  const maxScrollTop = Math.max(
    container.scrollHeight - container.clientHeight,
    0,
  );

  if (smooth) {
    const clampedScrollTop = clamp(rememberedScrollTop, 0, maxScrollTop);

    if (Math.abs(container.scrollTop - clampedScrollTop) > 1) {
      setFloatingContextMapScrollTop(
        container,
        clampedScrollTop,
        onScrollTopChange,
      );
    }
  }

  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const itemCenter =
    itemRect.top -
    containerRect.top +
    container.scrollTop +
    itemRect.height / 2;
  const scrollTop = clamp(
    itemCenter - container.clientHeight * scrollAnchorRatio,
    0,
    maxScrollTop,
  );
  const distance = scrollTop - container.scrollTop;

  cancelFloatingContextMapScroll(container);

  if (!smooth || Math.abs(distance) < 1) {
    setFloatingContextMapScrollTop(container, scrollTop, onScrollTopChange);
    return;
  }

  animateFloatingContextMapScroll(container, scrollTop, onScrollTopChange);
}

function animateFloatingContextMapScroll(
  container: HTMLDivElement,
  targetScrollTop: number,
  onScrollTopChange: (scrollTop: number) => void,
) {
  const startScrollTop = container.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  const duration = clamp(
    SCROLL_MIN_DURATION + Math.abs(distance) * SCROLL_DISTANCE_DURATION_RATIO,
    SCROLL_MIN_DURATION,
    SCROLL_MAX_DURATION,
  );
  const startedAt = performance.now();

  function frame(now: number) {
    const progress = clamp((now - startedAt) / duration, 0, 1);
    const easedProgress = easeOutQuart(progress);

    setFloatingContextMapScrollTop(
      container,
      startScrollTop + distance * easedProgress,
      onScrollTopChange,
    );

    if (progress < 1) {
      scrollAnimations.set(container, window.requestAnimationFrame(frame));
      return;
    }

    setFloatingContextMapScrollTop(
      container,
      targetScrollTop,
      onScrollTopChange,
    );
    scrollAnimations.delete(container);
  }

  scrollAnimations.set(container, window.requestAnimationFrame(frame));
}

function setFloatingContextMapScrollTop(
  container: HTMLDivElement,
  scrollTop: number,
  onScrollTopChange: (scrollTop: number) => void,
) {
  container.scrollTop = scrollTop;
  onScrollTopChange(scrollTop);
}

function cancelFloatingContextMapScroll(container: HTMLDivElement) {
  const frame = scrollAnimations.get(container);

  if (frame === undefined) {
    return;
  }

  window.cancelAnimationFrame(frame);
  scrollAnimations.delete(container);
}

function shouldIgnoreModifiedClick(event: React.MouseEvent<HTMLElement>) {
  return (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey ||
    event.button !== 0
  );
}

function easeOutQuart(progress: number) {
  return 1 - (1 - progress) ** 4;
}

function clamp(value: number, min: number, max: number) {
  if (max <= min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}
