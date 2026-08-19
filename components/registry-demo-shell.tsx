"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useTheme } from "fumadocs-ui/provider/base";
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useFullscreenSession } from "@/components/fullscreen-session";
import styles from "@/components/registry-demo-shell.module.css";
import {
  PreviewCornerSlotProvider,
  RegistryPreview,
} from "@/components/registry-preview";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  type SwipeNavigationDirection,
  useSwipeNavigation,
} from "@/registry/base/hooks/use-swipe-navigation";
import type { RegistryDisplayItem } from "@/lib/registry-display";
import { cn } from "@/lib/utils";
import { useScrollAnchor } from "@/registry/base/hooks/use-scroll-anchor";
import { ExpandablePanel } from "@/registry/base/ui/expandable-panel";

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

type PreviewNavigationDirection = SwipeNavigationDirection;
type SwipeHintPhase = "hidden" | "shown" | "leaving";

const MOBILE_SWIPE_HINT_QUERY =
  "(max-width: 639px) and (hover: none) and (pointer: coarse)";
const SWIPE_HINT_DELAY = 600;
const SWIPE_HINT_DURATION = 4500;
// Keep in step with the hint's `duration-150` fade-out.
const SWIPE_HINT_FADE_OUT = 150;

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
  const {
    navigationPanelOpen: panelOpen,
    setNavigationPanelOpen: setPanelOpen,
    pressedNavigationDirection,
    setPressedNavigationDirection,
    pendingSwipeEntrance,
    setPendingSwipeEntrance,
  } = useFullscreenSession();
  const [previewCornerSlot, setPreviewCornerSlot] =
    useState<HTMLDivElement | null>(null);
  const visibleSwipeEntranceDirection =
    pendingSwipeEntrance?.targetItemName === item.name
      ? pendingSwipeEntrance.direction
      : null;
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
  const {
    dismiss: dismissSwipeHint,
    leaving: swipeHintLeaving,
    visible: swipeHintVisible,
  } = useMobileSwipeHint(Boolean(navigation.previous || navigation.next));

  // The preview lands offset by the direction it came from; release it on the
  // next frame so it glides to rest.
  useLayoutEffect(() => {
    // Only the preview being entered releases it; on the outgoing preview this
    // is the move that was just queued, which is not ours to clear.
    if (pendingSwipeEntrance?.targetItemName !== item.name) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setPendingSwipeEntrance(null);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [item.name, pendingSwipeEntrance, setPendingSwipeEntrance]);

  const selectNavigationItem = useCallback(
    (nextItem: RegistryDemoNavigationItem) => {
      setPendingSwipeEntrance(null);
      flushSync(() => {
        setNavigationSelectionIntent({
          sourceItemName: item.name,
          selectedItemName: nextItem.name,
        });
      });
    },
    [item.name, setPendingSwipeEntrance],
  );

  const navigatePrevious = useCallback(() => {
    replaceNavigationItem(router, navigation.previous, selectNavigationItem);
  }, [navigation.previous, router, selectNavigationItem]);

  const navigateNext = useCallback(() => {
    replaceNavigationItem(router, navigation.next, selectNavigationItem);
  }, [navigation.next, router, selectNavigationItem]);

  const navigateFromSwipe = useCallback(
    (
      direction: PreviewNavigationDirection,
      nextItem: RegistryDemoNavigationItem | undefined,
    ) => {
      if (!nextItem) {
        return;
      }

      dismissSwipeHint();
      selectNavigationItem(nextItem);
      setPendingSwipeEntrance({
        direction,
        targetItemName: nextItem.name,
      });
      router.replace(nextItem.viewHref, { scroll: false });
    },
    [dismissSwipeHint, router, selectNavigationItem, setPendingSwipeEntrance],
  );

  const navigatePreviousFromSwipe = useCallback(() => {
    navigateFromSwipe("previous", navigation.previous);
  }, [navigateFromSwipe, navigation.previous]);

  const navigateNextFromSwipe = useCallback(() => {
    navigateFromSwipe("next", navigation.next);
  }, [navigateFromSwipe, navigation.next]);

  const clearNavigationFeedback = useCallback(() => {
    setPressedNavigationDirection(null);
  }, [setPressedNavigationDirection]);

  const showNavigationFeedback = useCallback(
    (direction: PreviewNavigationDirection) => {
      setPressedNavigationDirection(direction);
    },
    [setPressedNavigationDirection],
  );

  const releaseNavigationFeedback = useCallback(
    (direction: PreviewNavigationDirection) => {
      setPressedNavigationDirection((currentDirection) =>
        currentDirection === direction ? null : currentDirection,
      );
    },
    [setPressedNavigationDirection],
  );

  const exitFullscreen = useCallback(() => {
    clearNavigationFeedback();
    router.replace(item.href, { scroll: false });
  }, [clearNavigationFeedback, item.href, router]);

  const toggleNavigationPanelOpen = useCallback(() => {
    setPanelOpen((current) => !current);
  }, [setPanelOpen]);

  const handleSwipeIntentChange = useCallback(
    (direction: PreviewNavigationDirection | null) => {
      if (direction) {
        showNavigationFeedback(direction);
      } else {
        clearNavigationFeedback();
      }
    },
    [clearNavigationFeedback, showNavigationFeedback],
  );

  const previewCanvasRef = useSwipeNavigation<HTMLElement>({
    onPrevious: navigatePreviousFromSwipe,
    onNext: navigateNextFromSwipe,
    hasPrevious: Boolean(navigation.previous),
    hasNext: Boolean(navigation.next),
    disabled: panelOpen,
    ignoreOwnedGestures: true,
    onIntentChange: handleSwipeIntentChange,
    feedback: {
      distance: 48,
      resistance: 0.5,
    },
  });

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

      <ExpandablePanel
        className="fixed right-3 top-3 z-30 sm:right-4 sm:top-4"
        open={panelOpen}
        openLabel="Open navigation map"
        closeLabel="Collapse navigation map"
        closeOnEscape={false}
        onOpenChange={setPanelOpen}
        aria-label="Component navigation"
      >
        <div className="flex min-h-0 flex-1 flex-col py-2.5">
          <div
            ref={treeScrollRef}
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto pl-1.5 pr-(--expandable-panel-trigger-inset)"
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
      </ExpandablePanel>

      <PreviewNavigationDock
        item={item}
        navigation={navigation}
        activeDirection={pressedNavigationDirection}
        swipeHintVisible={swipeHintVisible}
        swipeHintLeaving={swipeHintLeaving}
        onDismissSwipeHint={dismissSwipeHint}
        onSelect={selectNavigationItem}
        onNavigatePrevious={navigatePreviousFromSwipe}
        onNavigateNext={navigateNextFromSwipe}
      />

      <section
        ref={previewCanvasRef}
        aria-label="Fullscreen preview canvas"
        onTouchStartCapture={dismissSwipeHint}
        className="relative flex flex-1 items-center justify-center overflow-auto p-5 sm:p-8"
      >
        {/* Mount point for the preview's own corner controls, kept outside the
            transformed wrapper below so their offsets resolve against the
            viewport instead of the demo's box. `contents` keeps it out of the
            canvas layout. */}
        <div ref={setPreviewCornerSlot} className="contents" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[56px_56px] opacity-30 mask-[radial-gradient(circle_at_center,black,transparent_78%)] dark:opacity-20"
        />
        <div
          data-swipe-entrance={visibleSwipeEntranceDirection ?? undefined}
          className={cn(
            "z-10 flex w-full min-w-0 items-center justify-center transition-[transform,opacity] motion-reduce:transform-[translate3d(0,0,0)]",
            getViewportClassName(item.viewport),
            getSwipeEntranceClassName(visibleSwipeEntranceDirection),
          )}
        >
          {/* Keep replay/other preview controls clear of the fixed navigation
              toggle: stacked below it at phone widths, where the demo spans the
              canvas, and beside it from `sm` up. */}
          <PreviewCornerSlotProvider
            className="fixed right-3 top-13 sm:right-14 sm:top-4"
            leadingClassName="fixed left-3 top-3 sm:left-4 sm:top-4"
            container={previewCornerSlot}
          >
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

function PreviewNavigationDock({
  item,
  navigation,
  activeDirection,
  swipeHintVisible,
  swipeHintLeaving,
  onDismissSwipeHint,
  onSelect,
  onNavigatePrevious,
  onNavigateNext,
}: {
  item: RegistryDisplayItem;
  navigation: RegistryDemoNavigation;
  activeDirection: PreviewNavigationDirection | null;
  swipeHintVisible: boolean;
  swipeHintLeaving: boolean;
  onDismissSwipeHint: () => void;
  onSelect: (item: RegistryDemoNavigationItem) => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
}) {
  const navigationRef = useSwipeNavigation<HTMLElement>({
    onPrevious: onNavigatePrevious,
    onNext: onNavigateNext,
    hasPrevious: Boolean(navigation.previous),
    hasNext: Boolean(navigation.next),
  });

  return (
    <div
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-30 -translate-x-1/2"
      onTouchStartCapture={onDismissSwipeHint}
    >
      {swipeHintVisible ? (
        <MobileSwipeHint navigation={navigation} leaving={swipeHintLeaving} />
      ) : null}

      <nav
        ref={navigationRef}
        aria-label="Preview navigation"
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
          className="flex h-10 min-w-0 flex-1 items-center justify-center overflow-hidden px-3 sm:h-9"
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

function MobileSwipeHint({
  navigation,
  leaving,
}: {
  navigation: RegistryDemoNavigation;
  leaving: boolean;
}) {
  const hasPrevious = Boolean(navigation.previous);
  const hasNext = Boolean(navigation.next);
  const label = hasPrevious
    ? hasNext
      ? "Swipe to browse"
      : "Swipe right for previous"
    : "Swipe left for next";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-foreground/10 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-lg backdrop-saturate-150 transition-opacity duration-150 ease-out supports-backdrop-filter:bg-background/55 motion-reduce:transition-none sm:hidden",
        leaving ? "opacity-0" : "opacity-100",
      )}
    >
      {/* The arrows trace the gesture rather than the destination: each one
          points the way the finger travels, so it reads with the label. */}
      {hasNext ? <SwipeHintArrow pointing="left" /> : null}
      <span>{label}</span>
      {hasPrevious ? <SwipeHintArrow pointing="right" /> : null}
    </div>
  );
}

/** A tapered motion trail — a chevron head pulled out of a fading tail. */
function SwipeHintArrow({ pointing }: { pointing: "left" | "right" }) {
  const trailId = useId();

  return (
    <span
      className={cn(
        "flex shrink-0",
        styles.arrow,
        pointing === "left" ? styles.pointsLeft : styles.pointsRight,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 12"
        fill="none"
        className={cn("h-3 w-6", pointing === "left" && "-scale-x-100")}
      >
        <path
          d="M3 6h10.5"
          stroke={`url(#${trailId})`}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M14 1.5 19.5 6 14 10.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient
            id={trailId}
            x1="1.5"
            y1="6"
            x2="15"
            y2="6"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.6" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="1" stopColor="currentColor" />
          </linearGradient>
        </defs>
      </svg>
    </span>
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

function useMobileSwipeHint(enabled: boolean) {
  const { swipeHintSpent, spendSwipeHint } = useFullscreenSession();
  // "leaving" keeps the hint mounted for its fade-out.
  const [phase, setPhase] = useState<SwipeHintPhase>("hidden");
  // Mirrors the session flag so the timers below can read it without the effect
  // restarting on the very update it makes.
  const spentRef = useRef(swipeHintSpent);

  const spend = useCallback(() => {
    spentRef.current = true;
    spendSwipeHint();
  }, [spendSwipeHint]);

  const startLeaving = useCallback(() => {
    setPhase((current) => (current === "shown" ? "leaving" : current));
  }, []);

  const dismiss = useCallback(() => {
    spend();
    startLeaving();
  }, [spend, startLeaving]);

  useEffect(() => {
    if (phase !== "leaving") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setPhase("hidden");
    }, SWIPE_HINT_FADE_OUT);

    return () => window.clearTimeout(timeout);
  }, [phase]);

  useEffect(() => {
    if (!enabled || spentRef.current) {
      return;
    }

    const mediaQuery = window.matchMedia?.(MOBILE_SWIPE_HINT_QUERY);

    if (!mediaQuery) {
      return;
    }

    let showTimeout: number | null = null;
    let hideTimeout: number | null = null;

    function clearTimers() {
      if (showTimeout !== null) {
        window.clearTimeout(showTimeout);
        showTimeout = null;
      }
      if (hideTimeout !== null) {
        window.clearTimeout(hideTimeout);
        hideTimeout = null;
      }
    }

    function syncHint() {
      clearTimers();

      if (!mediaQuery.matches || spentRef.current) {
        startLeaving();
        return;
      }

      showTimeout = window.setTimeout(() => {
        if (spentRef.current) {
          return;
        }

        setPhase("shown");
        spend();
        hideTimeout = window.setTimeout(startLeaving, SWIPE_HINT_DURATION);
      }, SWIPE_HINT_DELAY);
    }

    syncHint();
    mediaQuery.addEventListener?.("change", syncHint);

    return () => {
      clearTimers();
      mediaQuery.removeEventListener?.("change", syncHint);
    };
  }, [enabled, spend, startLeaving]);

  return { dismiss, leaving: phase === "leaving", visible: phase !== "hidden" };
}

function getSwipeEntranceClassName(
  direction: PreviewNavigationDirection | null,
) {
  if (!direction) {
    return "opacity-100 duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] [transform:translate3d(0,0,0)]";
  }

  return cn(
    "opacity-90 duration-0",
    direction === "next"
      ? "[transform:translate3d(12px,0,0)]"
      : "[transform:translate3d(-12px,0,0)]",
  );
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

function shouldIgnoreModifiedClick(event: ReactMouseEvent<HTMLElement>) {
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
      overlay && !overlay.closest("[data-slot='expandable-panel']"),
    );
  }

  const activeElement = document.activeElement;

  if (!(activeElement instanceof Element)) {
    return false;
  }

  const overlay = activeElement.closest(
    "[data-slot='popover-content'], [role='dialog']",
  );

  return Boolean(overlay && !overlay.closest("[data-slot='expandable-panel']"));
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
