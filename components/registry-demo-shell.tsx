"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useTheme } from "fumadocs-ui/provider/base";
import {
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  PreviewCornerSlotProvider,
  RegistryPreview,
} from "@/components/registry-preview";
import { Button, buttonVariants } from "@/components/ui/button";
import type { RegistryDisplayItem } from "@/lib/registry-display";
import { cn } from "@/lib/utils";
import { useScrollAnchor } from "@/registry/base/hooks/use-scroll-anchor";
import { ExpandingPanel } from "@/registry/base/ui/expanding-panel";

export type RegistryDemoNavigationItem = Pick<
  RegistryDisplayItem,
  "name" | "title" | "category" | "viewHref"
>;

export type RegistryDemoNavigation = {
  previous?: RegistryDemoNavigationItem;
  next?: RegistryDemoNavigationItem;
  previousCategory?: RegistryDemoNavigationItem;
  nextCategory?: RegistryDemoNavigationItem;
};

export type RegistryDemoNavigationGroup = {
  category: string;
  label: string;
  items: RegistryDemoNavigationItem[];
};

const SWIPE_DISTANCE_THRESHOLD = 52;
const SWIPE_VELOCITY_THRESHOLD = 0.35;
const SWIPE_DIRECTION_LOCK_THRESHOLD = 8;
const SWIPE_FEEDBACK_DISTANCE = 16;

type PreviewNavigationDirection = "previous" | "next";

let navigationPanelOpenMemory = false;
let pressedNavigationDirectionMemory: PreviewNavigationDirection | null = null;

export function RegistryDemoShell({
  item,
  navigation,
  navigationGroups,
  variant,
}: {
  item: RegistryDisplayItem;
  navigation: RegistryDemoNavigation;
  navigationGroups: RegistryDemoNavigationGroup[];
  variant: string;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(() => navigationPanelOpenMemory);
  const [pressedNavigationDirection, setPressedNavigationDirection] =
    useState<PreviewNavigationDirection | null>(
      () => pressedNavigationDirectionMemory,
    );
  const [navigationSelectionIntent, setNavigationSelectionIntent] = useState<{
    sourceItemName: string;
    selectedItemName: string;
  } | null>(null);
  const itemPageLabel = getItemPageLabel(item.kind);
  const prefetchHrefs = useMemo(
    () =>
      uniqueStrings([
        navigation.previous?.viewHref,
        navigation.next?.viewHref,
        navigation.previousCategory?.viewHref,
        navigation.nextCategory?.viewHref,
      ]).filter((href) => href !== item.viewHref),
    [
      item.viewHref,
      navigation.next,
      navigation.nextCategory,
      navigation.previous,
      navigation.previousCategory,
    ],
  );
  const navigationPanelSourceGroups = useMemo(
    () => getNavigationGroupsWithFallback(navigationGroups, item),
    [item, navigationGroups],
  );
  const navigationSelectionName =
    navigationSelectionIntent?.sourceItemName === item.name
      ? navigationSelectionIntent.selectedItemName
      : item.name;
  const navigationSelection = useMemo(
    () =>
      findNavigationItem(
        navigationPanelSourceGroups,
        navigationSelectionName,
      ) ?? item,
    [item, navigationPanelSourceGroups, navigationSelectionName],
  );
  // Park the active item in the upper third of the panel — instantly on open,
  // gliding when the selection changes while it stays open.
  const { containerRef: treeScrollRef } = useScrollAnchor<HTMLDivElement>({
    activeKey: navigationSelection.name,
    enabled: panelOpen,
    getTarget: (container) =>
      container.querySelector<HTMLElement>("[aria-current='page']"),
  });

  const selectNavigationItem = useCallback(
    (nextItem: RegistryDemoNavigationItem) => {
      flushSync(() => {
        setNavigationSelectionIntent({
          sourceItemName: item.name,
          selectedItemName: nextItem.name,
        });
      });
    },
    [item.name],
  );

  const setNavigationPanelOpen = useCallback((open: boolean) => {
    navigationPanelOpenMemory = open;
    setPanelOpen(open);
  }, []);

  const navigatePrevious = useCallback(() => {
    replaceNavigationItem(router, navigation.previous, selectNavigationItem);
  }, [navigation.previous, router, selectNavigationItem]);

  const navigateNext = useCallback(() => {
    replaceNavigationItem(router, navigation.next, selectNavigationItem);
  }, [navigation.next, router, selectNavigationItem]);

  const clearNavigationFeedback = useCallback(() => {
    pressedNavigationDirectionMemory = null;
    setPressedNavigationDirection(null);
  }, []);

  const showNavigationFeedback = useCallback(
    (direction: PreviewNavigationDirection) => {
      pressedNavigationDirectionMemory = direction;
      setPressedNavigationDirection(direction);
    },
    [],
  );

  const releaseNavigationFeedback = useCallback(
    (direction: PreviewNavigationDirection) => {
      if (pressedNavigationDirectionMemory !== direction) {
        return;
      }

      pressedNavigationDirectionMemory = null;
      setPressedNavigationDirection((currentDirection) =>
        currentDirection === direction ? null : currentDirection,
      );
    },
    [],
  );

  const exitFullscreen = useCallback(() => {
    clearNavigationFeedback();
    router.replace(item.href, { scroll: false });
  }, [clearNavigationFeedback, item.href, router]);

  const toggleNavigationPanelOpen = useCallback(() => {
    setPanelOpen((current) => {
      const open = !current;

      navigationPanelOpenMemory = open;

      return open;
    });
  }, []);

  useEffect(() => {
    for (const href of prefetchHrefs) {
      prefetchRoute(router, href);
    }
  }, [prefetchHrefs, router]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (shouldIgnoreEscapeShortcut(event)) {
          return;
        }

        event.preventDefault();
        exitFullscreen();
        return;
      }

      if (shouldIgnoreShortcut(event)) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (navigation.next) {
          showNavigationFeedback("next");
        }
        if (event.repeat) {
          return;
        }
        navigateNext();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (navigation.previous) {
          showNavigationFeedback("previous");
        }
        if (event.repeat) {
          return;
        }
        navigatePrevious();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        replaceNavigationItem(
          router,
          navigation.nextCategory,
          selectNavigationItem,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        replaceNavigationItem(
          router,
          navigation.previousCategory,
          selectNavigationItem,
        );
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        toggleNavigationPanelOpen();
      }
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        releaseNavigationFeedback("next");
      } else if (event.key === "ArrowLeft") {
        releaseNavigationFeedback("previous");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", clearNavigationFeedback);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", clearNavigationFeedback);
    };
  }, [
    clearNavigationFeedback,
    exitFullscreen,
    navigateNext,
    navigatePrevious,
    navigation.next,
    navigation.nextCategory,
    navigation.previous,
    navigation.previousCategory,
    releaseNavigationFeedback,
    router,
    selectNavigationItem,
    showNavigationFeedback,
    toggleNavigationPanelOpen,
  ]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">{item.title} fullscreen preview</h1>

      <ExpandingPanel
        className="fixed right-3 top-3 z-30 sm:right-4 sm:top-4"
        open={panelOpen}
        openLabel="Open navigation map"
        closeLabel="Collapse navigation map"
        closeOnEscape={false}
        onOpenChange={setNavigationPanelOpen}
        aria-label="Component navigation"
      >
        <div className="flex min-h-0 flex-1 flex-col py-2.5">
          <div
            ref={treeScrollRef}
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto pl-1.5 pr-(--expanding-panel-trigger-inset)"
          >
            <div className="flex flex-col gap-1.5">
              {navigationPanelSourceGroups.map((group) => (
                <NavigationMapGroup
                  key={group.category}
                  group={group}
                  currentItemName={navigationSelection.name}
                  onSelect={selectNavigationItem}
                />
              ))}
            </div>
          </div>
        </div>

        <PreviewActions
          exitLabel={`Exit fullscreen to ${itemPageLabel.toLowerCase()}`}
          onToggleTheme={() =>
            setTheme(resolvedTheme === "dark" ? "light" : "dark")
          }
          onExit={exitFullscreen}
        />
      </ExpandingPanel>

      <PreviewNavigationDock
        item={item}
        navigation={navigation}
        activeDirection={pressedNavigationDirection}
        onSelect={selectNavigationItem}
        onNavigatePrevious={navigatePrevious}
        onNavigateNext={navigateNext}
      />

      <section className="relative flex flex-1 items-center justify-center overflow-auto p-5 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[56px_56px] opacity-30 mask-[radial-gradient(circle_at_center,black,transparent_78%)] dark:opacity-20"
        />
        <div
          className={cn(
            "z-10 flex w-full min-w-0 items-center justify-center",
            getViewportClassName(item.viewport),
          )}
        >
          {/* Sit replay/other preview controls to the left of the fixed
              navigation toggle so they line up side by side. */}
          <PreviewCornerSlotProvider className="right-13 top-3 sm:right-14 sm:top-4">
            <RegistryPreview
              name={item.name}
              variant={variant}
              presentation="fullscreen"
            />
          </PreviewCornerSlotProvider>
        </div>
      </section>
    </main>
  );
}

type PreviewNavigationDockSwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  axis: "pending" | "horizontal" | "vertical";
};

function PreviewNavigationDock({
  item,
  navigation,
  activeDirection,
  onSelect,
  onNavigatePrevious,
  onNavigateNext,
}: {
  item: RegistryDisplayItem;
  navigation: RegistryDemoNavigation;
  activeDirection: PreviewNavigationDirection | null;
  onSelect: (item: RegistryDemoNavigationItem) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
}) {
  const navigationRef = useRef<HTMLElement>(null);
  const swipeStateRef = useRef<PreviewNavigationDockSwipeState | null>(null);
  const suppressClickRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);

  const resetSwipePosition = useCallback(() => {
    const element = navigationRef.current;

    if (!element) {
      return;
    }

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    element.style.transition = reduceMotion
      ? "none"
      : "transform 140ms cubic-bezier(0.16, 1, 0.3, 1)";
    element.style.transform = "translate3d(0, 0, 0)";

    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = window.setTimeout(() => {
      element.style.removeProperty("transition");
      element.style.removeProperty("transform");
      element.style.removeProperty("will-change");
      resetTimeoutRef.current = null;
    }, reduceMotion ? 0 : 160);
  }, [navigationRef]);

  useEffect(
    () => () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    },
    [],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch") {
        return;
      }

      swipeStateRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: performance.now(),
        axis: "pending",
      };
      event.currentTarget.style.transition = "none";
      event.currentTarget.style.willChange = "transform";
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = swipeStateRef.current;

      if (!state || state.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;

      if (
        state.axis === "pending" &&
        Math.max(Math.abs(deltaX), Math.abs(deltaY)) >=
          SWIPE_DIRECTION_LOCK_THRESHOLD
      ) {
        const axis =
          Math.abs(deltaX) > Math.abs(deltaY) * 1.25
            ? "horizontal"
            : "vertical";

        state.axis = axis;

        if (axis === "horizontal") {
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }
      }

      if (state.axis !== "horizontal") {
        return;
      }

      event.preventDefault();
      const feedbackX = Math.max(
        -SWIPE_FEEDBACK_DISTANCE,
        Math.min(SWIPE_FEEDBACK_DISTANCE, deltaX * 0.2),
      );
      event.currentTarget.style.transform = `translate3d(${feedbackX}px, 0, 0)`;
    },
    [],
  );

  const finishPointer = useCallback(
    (event: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
      const state = swipeStateRef.current;

      if (!state || state.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - state.startX;
      const elapsed = Math.max(performance.now() - state.startedAt, 1);
      const velocity = Math.abs(deltaX) / elapsed;
      const navigates =
        !cancelled &&
        state.axis === "horizontal" &&
        (Math.abs(deltaX) >= SWIPE_DISTANCE_THRESHOLD ||
          (Math.abs(deltaX) >= SWIPE_DISTANCE_THRESHOLD / 2 &&
            velocity >= SWIPE_VELOCITY_THRESHOLD));

      suppressClickRef.current =
        state.axis === "horizontal" &&
        Math.abs(deltaX) >= SWIPE_DIRECTION_LOCK_THRESHOLD;
      swipeStateRef.current = null;

      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      resetSwipePosition();

      if (navigates) {
        if (deltaX > 0) {
          onNavigatePrevious();
        } else {
          onNavigateNext();
        }
      }

      if (suppressClickRef.current) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
    },
    [onNavigateNext, onNavigatePrevious, resetSwipePosition],
  );

  const handleClickCapture = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }, []);

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-30 -translate-x-1/2">
      <nav
        ref={navigationRef}
        aria-label="Preview navigation"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishPointer(event, false)}
        onPointerCancel={(event) => finishPointer(event, true)}
        onClickCapture={handleClickCapture}
        className="relative isolate flex w-[min(22rem,calc(100vw-1.5rem))] touch-pan-y overflow-hidden rounded-lg border border-foreground/10 bg-background/80 text-foreground shadow-sm backdrop-blur-lg backdrop-saturate-150 supports-backdrop-filter:bg-background/55"
      >
        <PreviewNavigationLink
          item={navigation.previous}
          direction="previous"
          active={activeDirection === "previous"}
          onSelect={onSelect}
        />

        <div
          aria-live="polite"
          className="flex h-10 min-w-0 flex-1 items-center justify-center px-3 sm:h-9"
        >
          <span className="truncate text-sm font-medium">{item.title}</span>
        </div>

        <PreviewNavigationLink
          item={navigation.next}
          direction="next"
          active={activeDirection === "next"}
          onSelect={onSelect}
        />
      </nav>
    </div>
  );
}

function PreviewNavigationLink({
  item,
  direction,
  active,
  onSelect,
}: {
  item: RegistryDemoNavigationItem | undefined;
  direction: PreviewNavigationDirection;
  active: boolean;
  onSelect: (item: RegistryDemoNavigationItem) => void;
}) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "Previous preview" : "Next preview";
  const shortcut = isPrevious ? "ArrowLeft" : "ArrowRight";
  const shortcutLabel = isPrevious ? "←" : "→";
  const Icon = isPrevious ? ArrowLeft : ArrowRight;
  const controlClassName = cn(
    "relative h-10 w-11 rounded-none border-0 transition-colors duration-[130ms] ease-out active:bg-muted active:text-foreground active:duration-0 motion-reduce:transition-none motion-reduce:active:translate-y-0 data-[active]:bg-muted data-[active]:text-foreground data-[active]:duration-0 sm:h-9",
    isPrevious
      ? "after:pointer-events-none after:absolute after:right-0 after:top-1/2 after:h-5 after:w-px after:-translate-y-1/2 after:rounded-full after:bg-foreground/15"
      : "before:pointer-events-none before:absolute before:left-0 before:top-1/2 before:h-5 before:w-px before:-translate-y-1/2 before:rounded-full before:bg-foreground/15",
  );
  const iconClassName = cn(
    "transition-transform ease-out motion-reduce:transition-none",
    active
      ? cn("duration-0", isPrevious ? "-translate-x-px" : "translate-x-px")
      : "duration-[130ms]",
  );

  if (!item) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        aria-label={`${label} unavailable`}
        data-direction={direction}
        data-active={active || undefined}
        className={controlClassName}
      >
        <Icon aria-hidden="true" className={iconClassName} />
      </Button>
    );
  }

  return (
    <Link
      href={item.viewHref}
      replace
      scroll={false}
      title={`${label}: ${item.title} (${shortcutLabel} key)`}
      aria-label={`${label}: ${item.title}`}
      aria-keyshortcuts={shortcut}
      data-direction={direction}
      data-active={active || undefined}
      className={buttonVariants({
        variant: "ghost",
        size: "icon",
        className: controlClassName,
      })}
      onClick={(event) => {
        if (shouldIgnoreModifiedClick(event)) {
          return;
        }

        onSelect(item);
      }}
    >
      <Icon aria-hidden="true" className={iconClassName} />
    </Link>
  );
}

function NavigationMapGroup({
  group,
  currentItemName,
  onSelect,
}: {
  group: RegistryDemoNavigationGroup;
  currentItemName: string;
  onSelect: (item: RegistryDemoNavigationItem) => void;
}) {
  const isCurrentGroup = group.items.some(
    (groupItem) => groupItem.name === currentItemName,
  );

  return (
    <section className="flex min-w-0 flex-col gap-0.5">
      <div
        className={cn(
          "flex min-w-0 items-center gap-2 px-2 py-1 text-xs font-semibold leading-4",
          isCurrentGroup ? "text-primary" : "text-foreground/70",
        )}
      >
        <span className="truncate">{group.label}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        {group.items.map((groupItem) => {
          const selected = groupItem.name === currentItemName;

          return (
            <Link
              key={groupItem.name}
              href={groupItem.viewHref}
              replace
              scroll={false}
              aria-current={selected ? "page" : undefined}
              onClick={(event) => {
                if (shouldIgnoreModifiedClick(event)) {
                  return;
                }

                onSelect(groupItem);
              }}
              className={cn(
                "flex h-6 min-w-0 items-center rounded-md px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-muted/55 font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="truncate">{groupItem.title}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PreviewActions({
  exitLabel,
  onToggleTheme,
  onExit,
}: {
  exitLabel: string;
  onToggleTheme: () => void;
  onExit: () => void;
}) {
  return (
    <div className="grid shrink-0 grid-cols-2 divide-x divide-border/55 border-t border-border/55 bg-popover/80 text-xs">
      <PreviewActionButton
        shortcut="D"
        label="Theme"
        title="Toggle theme"
        ariaLabel="Toggle theme"
        onClick={onToggleTheme}
      />
      <PreviewActionButton
        shortcut="Esc"
        label="Exit"
        title="Exit fullscreen"
        ariaLabel={exitLabel}
        onClick={onExit}
      />
    </div>
  );
}

function PreviewActionButton({
  shortcut,
  label,
  title,
  ariaLabel,
  onClick,
}: {
  shortcut: string;
  label: string;
  title: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex min-w-0 items-center justify-center gap-1.5 bg-popover/80 px-1.5 py-2 text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none"
    >
      <kbd className="shrink-0 rounded-[3px] bg-muted px-1 font-mono text-[0.6rem] leading-none text-muted-foreground shadow-[inset_0_-1px_0_var(--border)]">
        {shortcut}
      </kbd>
      <span className="whitespace-nowrap leading-none">{label}</span>
    </button>
  );
}

function findNavigationItem(
  groups: RegistryDemoNavigationGroup[],
  itemName: string,
) {
  for (const group of groups) {
    const item = group.items.find((groupItem) => groupItem.name === itemName);

    if (item) {
      return item;
    }
  }

  return null;
}

function getNavigationGroupsWithFallback(
  groups: RegistryDemoNavigationGroup[],
  item: RegistryDisplayItem,
) {
  if (findNavigationItem(groups, item.name)) {
    return groups;
  }

  return [...groups, getFallbackNavigationGroup(item)];
}

function replaceNavigationItem(
  router: ReturnType<typeof useRouter>,
  item: RegistryDemoNavigationItem | undefined,
  onItemSelect: (item: RegistryDemoNavigationItem) => void,
) {
  if (!item) {
    return;
  }

  onItemSelect(item);

  router.replace(item.viewHref, { scroll: false });
}

function prefetchRoute(router: ReturnType<typeof useRouter>, href: string) {
  try {
    router.prefetch(href);
  } catch {
    // Prefetch is opportunistic; navigation still works without it.
  }
}

function shouldIgnoreModifiedClick(event: MouseEvent<HTMLElement>) {
  return (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey ||
    event.button !== 0
  );
}

function shouldIgnoreShortcut(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  ) {
    return true;
  }

  if (targetIsInsideOpenOverlay(event.target)) {
    return true;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "input",
        "select",
        "textarea",
        "[contenteditable='']",
        "[contenteditable='true']",
        "[role='textbox']",
      ].join(","),
    ),
  );
}

function shouldIgnoreEscapeShortcut(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  ) {
    return true;
  }

  if (targetIsInsideOpenOverlay(event.target)) {
    return true;
  }

  const target = event.target;

  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "input",
        "select",
        "textarea",
        "[contenteditable='']",
        "[contenteditable='true']",
        "[role='textbox']",
      ].join(","),
    ),
  );
}

function targetIsInsideOpenOverlay(target: EventTarget | null) {
  if (target instanceof Element) {
    const overlay = target.closest(
      "[data-slot='popover-content'], [role='dialog']",
    );

    return Boolean(
      overlay && !overlay.closest("[data-slot='expanding-panel']"),
    );
  }

  const activeElement = document.activeElement;

  if (!(activeElement instanceof Element)) {
    return false;
  }

  const overlay = activeElement.closest(
    "[data-slot='popover-content'], [role='dialog']",
  );

  return Boolean(overlay && !overlay.closest("[data-slot='expanding-panel']"));
}

function getViewportClassName(viewport = "centered") {
  if (viewport === "full") {
    return "h-[calc(100dvh-2.5rem)] max-w-none self-stretch sm:h-[calc(100dvh-4rem)]";
  }

  if (viewport === "wide") {
    return "max-w-6xl";
  }

  return "max-w-3xl";
}

function getItemPageLabel(kind: RegistryDisplayItem["kind"]) {
  if (kind === "hook") {
    return "Hook page";
  }

  if (kind === "block") {
    return "Block page";
  }

  return "Component page";
}

function getFallbackNavigationGroup(
  item: RegistryDisplayItem,
): RegistryDemoNavigationGroup {
  return {
    category: item.category,
    label: formatCategoryLabel(item.category),
    items: [
      {
        name: item.name,
        title: item.title,
        category: item.category,
        viewHref: item.viewHref,
      },
    ],
  };
}

function formatCategoryLabel(category: string) {
  return category
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
}
