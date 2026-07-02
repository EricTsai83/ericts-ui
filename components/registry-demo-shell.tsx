"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ListTree,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useTheme } from "fumadocs-ui/provider/base";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { RegistryPreview } from "@/components/registry-preview";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { RegistryDisplayItem } from "@/lib/registry-display";
import { cn } from "@/lib/utils";

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

const navigationShortcutDirections = [
  "previous",
  "next",
  "previousCategory",
  "nextCategory",
] as const;

type NavigationShortcutDirection =
  (typeof navigationShortcutDirections)[number];

type NavigationShortcutMemory = {
  direction: NavigationShortcutDirection;
  at: number;
};

type NavigationCueConfig = {
  direction: NavigationShortcutDirection;
  icon: LucideIcon;
};

const navigationCues: NavigationCueConfig[] = [
  {
    direction: "previous",
    icon: ChevronLeft,
  },
  {
    direction: "next",
    icon: ChevronRight,
  },
  {
    direction: "previousCategory",
    icon: ChevronUp,
  },
  {
    direction: "nextCategory",
    icon: ChevronDown,
  },
];

const navigationShortcutStorageKey = "ericts-ui:registry-demo-shortcut";
const navigationPanelTransition = {
  type: "spring",
  duration: 0.24,
  bounce: 0,
} as const;
const navigationPanelContentTransition = {
  duration: 0.16,
  ease: [0.23, 1, 0.32, 1],
} as const;
const navigationShortcutFooterTransition = {
  duration: 0.18,
  ease: [0.23, 1, 0.32, 1],
} as const;
const navigationPanelReducedMotionTransition = { duration: 0 } as const;
const navigationItemScrollAnchorRatio = 1 / 3;
const navigationScrollMinDuration = 160;
const navigationScrollMaxDuration = 320;
const navigationScrollDistanceDurationRatio = 0.45;
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

let navigationPanelOpenMemory = false;
let navigationPanelScrollTopMemory = 0;
const navigationScrollAnimations = new WeakMap<HTMLDivElement, number>();

type NavigationPanelState = {
  open: boolean;
  activeShortcut: NavigationShortcutDirection | null;
  autoOpened: boolean;
  shortcutSequence: number;
};

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
  const [navigationPanelState, setNavigationPanelState] = useState(
    createInitialNavigationPanelState,
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
  const navigationSelectionName =
    navigationSelectionIntent?.sourceItemName === item.name
      ? navigationSelectionIntent.selectedItemName
      : item.name;
  const navigationSelection = useMemo(
    () =>
      findNavigationItem(navigationGroups, navigationSelectionName) ?? item,
    [item, navigationGroups, navigationSelectionName],
  );

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
    setNavigationPanelState((current) => ({
      ...current,
      open,
      activeShortcut: open ? current.activeShortcut : null,
      autoOpened: false,
    }));
  }, []);

  const toggleNavigationPanelOpen = useCallback(() => {
    setNavigationPanelState((current) => {
      const open = !current.open;

      navigationPanelOpenMemory = open;

      return {
        ...current,
        open,
        activeShortcut: open ? current.activeShortcut : null,
        autoOpened: false,
      };
    });
  }, []);

  const activateNavigationShortcut = useCallback(
    (direction: NavigationShortcutDirection) => {
      setNavigationPanelState((current) => ({
        open: true,
        activeShortcut: direction,
        autoOpened:
          !navigationPanelOpenMemory && (current.autoOpened || !current.open),
        shortcutSequence: current.shortcutSequence + 1,
      }));
    },
    [],
  );

  useIsomorphicLayoutEffect(() => {
    const shortcut = consumeRecentNavigationShortcut();

    if (!shortcut) {
      return;
    }

    setNavigationPanelState((current) => ({
      open: true,
      activeShortcut: shortcut,
      autoOpened:
        !navigationPanelOpenMemory && (current.autoOpened || !current.open),
      shortcutSequence: current.shortcutSequence + 1,
    }));
  }, [item.name]);

  useEffect(() => {
    if (!navigationPanelState.activeShortcut) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNavigationPanelState((current) => ({
        ...current,
        open: current.autoOpened ? false : current.open,
        activeShortcut: null,
        autoOpened: false,
      }));
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [
    navigationPanelState.activeShortcut,
    navigationPanelState.shortcutSequence,
  ]);

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
        router.push(item.href);
        return;
      }

      if (shouldIgnoreShortcut(event)) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        replaceNavigationItem(
          router,
          navigation.next,
          "next",
          activateNavigationShortcut,
          selectNavigationItem,
        );
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        replaceNavigationItem(
          router,
          navigation.previous,
          "previous",
          activateNavigationShortcut,
          selectNavigationItem,
        );
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        replaceNavigationItem(
          router,
          navigation.nextCategory,
          "nextCategory",
          activateNavigationShortcut,
          selectNavigationItem,
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        replaceNavigationItem(
          router,
          navigation.previousCategory,
          "previousCategory",
          activateNavigationShortcut,
          selectNavigationItem,
        );
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        toggleNavigationPanelOpen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activateNavigationShortcut,
    item.href,
    navigation.next,
    navigation.nextCategory,
    navigation.previous,
    navigation.previousCategory,
    router,
    selectNavigationItem,
    toggleNavigationPanelOpen,
  ]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">{item.title} fullscreen preview</h1>

      <NavigationContextPanel
        item={item}
        currentItemCategory={navigationSelection.category}
        currentItemName={navigationSelection.name}
        groups={navigationGroups}
        itemPageLabel={itemPageLabel}
        open={navigationPanelState.open}
        activeShortcut={navigationPanelState.activeShortcut}
        onItemSelect={selectNavigationItem}
        onOpenChange={setNavigationPanelOpen}
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
          <RegistryPreview name={item.name} variant={variant} />
        </div>
      </section>
    </main>
  );
}

function NavigationContextPanel({
  item,
  currentItemCategory,
  currentItemName,
  groups,
  itemPageLabel,
  open,
  activeShortcut,
  onItemSelect,
  onOpenChange,
}: {
  item: RegistryDisplayItem;
  currentItemCategory: string;
  currentItemName: string;
  groups: RegistryDemoNavigationGroup[];
  itemPageLabel: string;
  open: boolean;
  activeShortcut: NavigationShortcutDirection | null;
  onItemSelect: (item: RegistryDemoNavigationItem) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const panelId = useId();
  const shortcutPanelId = useId();
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const lastScrolledItemNameRef = useRef<string | null>(
    activeShortcut ? null : currentItemName,
  );
  const [shortcutsExpanded, setShortcutsExpanded] = useState(false);
  const currentGroup =
    groups.find((group) => group.category === currentItemCategory) ??
    getFallbackNavigationGroup(item);
  const currentGroupIndex = groups.findIndex(
    (group) => group.category === currentGroup.category,
  );
  const shouldReduceMotion = useReducedMotion();
  const panelTransition = shouldReduceMotion
    ? navigationPanelReducedMotionTransition
    : navigationPanelTransition;
  const contentTransition = shouldReduceMotion
    ? navigationPanelReducedMotionTransition
    : navigationPanelContentTransition;

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      return;
    }

    const selectedItemChanged =
      lastScrolledItemNameRef.current !== currentItemName;

    if (activeShortcut && !selectedItemChanged) {
      return;
    }

    const scrollContainer = treeScrollRef.current;
    const currentItem = scrollContainer?.querySelector<HTMLElement>(
      "[data-navigation-current='true']",
    );

    if (!scrollContainer || !currentItem) {
      return;
    }

    scrollNavigationItemIntoView({
      container: scrollContainer,
      item: currentItem,
      smooth: selectedItemChanged && !shouldReduceMotion,
    });
    lastScrolledItemNameRef.current = currentItemName;

    return () => cancelNavigationScroll(scrollContainer);
  }, [activeShortcut, currentItemName, open, shouldReduceMotion]);

  return (
    <aside
      aria-label="Preview position"
      className="fixed right-3 top-3 z-30 flex max-w-[calc(100vw-1.5rem)] justify-end sm:right-4 sm:top-4"
    >
      <div className="relative flex justify-end">
        <motion.div
          initial={false}
          animate={open ? { height: "auto" } : { height: "2rem" }}
          transition={panelTransition}
          style={{ transformOrigin: "top right" }}
          className={cn(
            "relative overflow-hidden rounded-lg border border-border/70 bg-popover/90 text-popover-foreground shadow-md shadow-black/10 backdrop-blur-xl transition-[width] duration-220 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[width,height] supports-backdrop-filter:bg-popover/8 motion-reduce:transition-none dark:shadow-black/20",
            open ? "w-[min(17rem,calc(100vw-1.5rem))]" : "size-8 sm:size-8",
          )}
        >
          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                key="navigation-panel-content"
                id={panelId}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, scale: 0.985 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.985 }
                }
                transition={contentTransition}
                style={{ transformOrigin: "top right" }}
                className="will-change-[transform,opacity]"
              >
                <div className="group/navigation-list relative">
                  <div
                    ref={treeScrollRef}
                    onScroll={(event) => {
                      navigationPanelScrollTopMemory = event.currentTarget.scrollTop;
                    }}
                    className="no-scrollbar max-h-[min(15.5rem,calc(100dvh-8rem))] overflow-y-auto py-2.5 pl-1.5 pr-8"
                  >
                    <div className="flex flex-col gap-1.5">
                      {groups.map((group, groupIndex) => (
                        <NavigationGroupTree
                          key={group.category}
                          group={group}
                          groupIndex={groupIndex}
                          currentGroupIndex={currentGroupIndex}
                          currentItemName={currentItemName}
                          onItemSelect={onItemSelect}
                        />
                      ))}
                    </div>
                  </div>
                  <NavigationListShortcutHint />
                </div>
                <NavigationShortcutBar
                  expanded={shortcutsExpanded}
                  itemHref={item.href}
                  itemPageLabel={itemPageLabel}
                  panelId={shortcutPanelId}
                  onExpandedChange={setShortcutsExpanded}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <button
          type="button"
          aria-controls={panelId}
          aria-expanded={open}
          aria-label={open ? "Collapse navigation map" : "Open navigation map"}
          onClick={() => {
            if (open) {
              setShortcutsExpanded(false);
            }

            onOpenChange(!open);
          }}
          className={cn(
            "extend-touch-target absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none",
            open && "text-foreground",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-transparent text-current"
          >
            <ListTree className="size-3.5" />
          </span>
        </button>
      </div>
    </aside>
  );
}

function NavigationGroupTree({
  group,
  groupIndex,
  currentGroupIndex,
  currentItemName,
  onItemSelect,
}: {
  group: RegistryDemoNavigationGroup;
  groupIndex: number;
  currentGroupIndex: number;
  currentItemName: string;
  onItemSelect: (item: RegistryDemoNavigationItem) => void;
}) {
  const isCurrentGroup = groupIndex === currentGroupIndex;

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
          const isCurrentItem = groupItem.name === currentItemName;

          return (
            <Link
              key={groupItem.name}
              href={groupItem.viewHref}
              replace
              scroll={false}
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.altKey ||
                  event.shiftKey ||
                  event.button !== 0
                ) {
                  return;
                }

                onItemSelect(groupItem);
              }}
              aria-current={isCurrentItem ? "page" : undefined}
              data-navigation-current={isCurrentItem ? "true" : undefined}
              className={cn(
                "flex h-6 min-w-0 items-center rounded-md px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isCurrentItem
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

function NavigationShortcutBar({
  expanded,
  itemPageLabel,
  itemHref,
  panelId,
  onExpandedChange,
}: {
  expanded: boolean;
  itemPageLabel: string;
  itemHref: string;
  panelId: string;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const transition = shouldReduceMotion
    ? navigationPanelReducedMotionTransition
    : navigationShortcutFooterTransition;

  return (
    <div
      className={cn(
        "overflow-hidden border-t border-border/55 bg-popover/80 text-xs",
        expanded && "bg-muted/20",
      )}
    >
      <button
        type="button"
        aria-controls={panelId}
        aria-expanded={expanded}
        aria-label={
          expanded ? "Collapse keyboard shortcuts" : "Expand keyboard shortcuts"
        }
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
            key="shortcut-footer-controls"
            id={panelId}
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            className="overflow-hidden border-t border-border/55"
          >
            <div
              role="group"
              aria-label="Fullscreen preview actions"
              className="grid grid-cols-2 divide-x divide-border/55 text-xs"
            >
              <ThemeShortcutAction />
              <ShortcutActionLink
                href={itemHref}
                ariaLabel={`Exit fullscreen to ${itemPageLabel.toLowerCase()}`}
                title="Exit fullscreen"
                shortcut="Esc"
                label="Exit"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function NavigationListShortcutHint() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-2 right-2 z-10 flex translate-y-1 items-center gap-1 rounded-md bg-popover/95 px-1.5 py-1 text-[0.65rem] leading-none text-muted-foreground opacity-0 shadow-sm ring-1 ring-border/60 backdrop-blur-md transition-[opacity,transform] duration-150 ease-out group-hover/navigation-list:translate-y-0 group-hover/navigation-list:opacity-100 group-focus-within/navigation-list:translate-y-0 group-focus-within/navigation-list:opacity-100 motion-reduce:transition-none"
    >
      <NavigationListShortcutHintGroup
        cues={[navigationCues[0], navigationCues[1]]}
        label="Item"
      />
      <span className="h-3 w-px bg-border/70" />
      <NavigationListShortcutHintGroup
        cues={[navigationCues[2], navigationCues[3]]}
        label="Group"
      />
    </div>
  );
}

function NavigationListShortcutHintGroup({
  cues,
  label,
}: {
  cues: [NavigationCueConfig, NavigationCueConfig];
  label: string;
}) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex items-center gap-0.5">
        {cues.map((cue) => (
          <NavigationHintKey key={cue.direction} cue={cue} />
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}

function NavigationHintKey({ cue }: { cue: NavigationCueConfig }) {
  const Icon = cue.icon;

  return (
    <ShortcutKey className={shortcutIconKeyCompactClassName}>
      <Icon aria-hidden="true" className="size-3" />
    </ShortcutKey>
  );
}

function ThemeShortcutAction() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ShortcutActionButton
      ariaLabel="Toggle theme"
      title="Toggle theme"
      shortcut="D"
      label="Theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    />
  );
}

function ShortcutActionLink({
  href,
  ariaLabel,
  title,
  shortcut,
  label,
}: {
  href: string;
  ariaLabel: string;
  title: string;
  shortcut: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={title}
      className={shortcutActionClassName}
    >
      <ShortcutKey className={shortcutTextKeyCompactClassName}>
        {shortcut}
      </ShortcutKey>
      <ShortcutActionLabel>{label}</ShortcutActionLabel>
    </Link>
  );
}

function ShortcutActionButton({
  ariaLabel,
  title,
  shortcut,
  label,
  onClick,
}: {
  ariaLabel: string;
  title: string;
  shortcut: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={shortcutActionButtonClassName}
    >
      <ShortcutKey className={shortcutTextKeyCompactClassName}>
        {shortcut}
      </ShortcutKey>
      <ShortcutActionLabel>{label}</ShortcutActionLabel>
    </Button>
  );
}

function ShortcutKey({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Kbd
      className={cn(
        "shrink-0 rounded-md font-mono text-[0.68rem] leading-none text-foreground shadow-[inset_0_-1px_0_var(--border)]",
        className,
      )}
    >
      {children}
    </Kbd>
  );
}

function ShortcutActionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap text-xs leading-none">{children}</span>
  );
}

const shortcutActionSurfaceClassName =
  "flex min-w-0 items-center justify-center gap-1 bg-popover/80 px-1.5 py-1.5 text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

const shortcutActionClassName = cn(
  shortcutActionSurfaceClassName,
  "rounded-none",
);

const shortcutIconKeyCompactClassName =
  "grid size-4 min-w-4 place-items-center rounded-[3px] p-0 px-0 text-center font-mono text-[0.6rem] leading-none text-muted-foreground shadow-none";

const shortcutTextKeyCompactClassName =
  "h-4 min-w-4 rounded-[3px] px-1 py-0 text-center font-mono text-[0.6rem] leading-none text-muted-foreground shadow-none";

const shortcutActionButtonClassName = cn(
  shortcutActionClassName,
  "h-auto border-0 shadow-none aria-expanded:bg-muted/35 dark:hover:bg-muted/35",
);

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

function replaceNavigationItem(
  router: ReturnType<typeof useRouter>,
  item?: RegistryDemoNavigationItem,
  direction?: NavigationShortcutDirection,
  onShortcut?: (direction: NavigationShortcutDirection) => void,
  onItemSelect?: (item: RegistryDemoNavigationItem) => void,
) {
  if (!item) {
    return;
  }

  onItemSelect?.(item);

  if (direction) {
    onShortcut?.(direction);
    rememberNavigationShortcut(direction);
  }

  router.replace(item.viewHref, { scroll: false });
}

function scrollNavigationItemIntoView({
  container,
  item,
  smooth,
}: {
  container: HTMLDivElement;
  item: HTMLElement;
  smooth: boolean;
}) {
  const maxScrollTop = Math.max(
    container.scrollHeight - container.clientHeight,
    0,
  );

  if (smooth) {
    const rememberedScrollTop = clamp(
      navigationPanelScrollTopMemory,
      0,
      maxScrollTop,
    );

    if (Math.abs(container.scrollTop - rememberedScrollTop) > 1) {
      setNavigationContainerScrollTop(container, rememberedScrollTop);
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
    itemCenter - container.clientHeight * navigationItemScrollAnchorRatio,
    0,
    maxScrollTop,
  );
  const distance = scrollTop - container.scrollTop;

  cancelNavigationScroll(container);

  if (!smooth || Math.abs(distance) < 1) {
    setNavigationContainerScrollTop(container, scrollTop);
    return;
  }

  animateNavigationScroll(container, scrollTop);
}

function animateNavigationScroll(
  container: HTMLDivElement,
  targetScrollTop: number,
) {
  const startScrollTop = container.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  const duration = clamp(
    navigationScrollMinDuration +
      Math.abs(distance) * navigationScrollDistanceDurationRatio,
    navigationScrollMinDuration,
    navigationScrollMaxDuration,
  );
  const startedAt = performance.now();

  function frame(now: number) {
    const progress = clamp((now - startedAt) / duration, 0, 1);
    const easedProgress = easeOutQuart(progress);

    setNavigationContainerScrollTop(
      container,
      startScrollTop + distance * easedProgress,
    );

    if (progress < 1) {
      navigationScrollAnimations.set(
        container,
        window.requestAnimationFrame(frame),
      );
      return;
    }

    setNavigationContainerScrollTop(container, targetScrollTop);
    navigationScrollAnimations.delete(container);
  }

  navigationScrollAnimations.set(container, window.requestAnimationFrame(frame));
}

function setNavigationContainerScrollTop(
  container: HTMLDivElement,
  scrollTop: number,
) {
  container.scrollTop = scrollTop;
  navigationPanelScrollTopMemory = scrollTop;
}

function cancelNavigationScroll(container: HTMLDivElement) {
  const frame = navigationScrollAnimations.get(container);

  if (frame === undefined) {
    return;
  }

  window.cancelAnimationFrame(frame);
  navigationScrollAnimations.delete(container);
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

function createInitialNavigationPanelState(): NavigationPanelState {
  const shortcut = consumeRecentNavigationShortcut();
  const open = navigationPanelOpenMemory || Boolean(shortcut);

  return {
    open,
    activeShortcut: shortcut,
    autoOpened: Boolean(shortcut) && !navigationPanelOpenMemory,
    shortcutSequence: shortcut ? 1 : 0,
  };
}

function rememberNavigationShortcut(direction: NavigationShortcutDirection) {
  try {
    window.sessionStorage.setItem(
      navigationShortcutStorageKey,
      JSON.stringify({
        direction,
        at: Date.now(),
      } satisfies NavigationShortcutMemory),
    );
  } catch {
    // The navigation works even when storage is unavailable.
  }
}

function consumeRecentNavigationShortcut(): NavigationShortcutDirection | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      navigationShortcutStorageKey,
    );
    window.sessionStorage.removeItem(navigationShortcutStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isNavigationShortcutMemory(parsedValue)) {
      return null;
    }

    if (Date.now() - parsedValue.at > 1500) {
      return null;
    }

    return parsedValue.direction;
  } catch {
    return null;
  }
}

function isNavigationShortcutMemory(
  value: unknown,
): value is NavigationShortcutMemory {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isNavigationShortcutDirection(record.direction) &&
    typeof record.at === "number"
  );
}

function isNavigationShortcutDirection(
  value: unknown,
): value is NavigationShortcutDirection {
  return (
    typeof value === "string" &&
    navigationShortcutDirections.includes(value as NavigationShortcutDirection)
  );
}

function prefetchRoute(router: ReturnType<typeof useRouter>, href: string) {
  try {
    router.prefetch(href);
  } catch {
    // Prefetch is opportunistic; navigation still works without it.
  }
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

  if (targetIsInsideOpenOverlay()) {
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

  if (targetIsInsideOpenOverlay()) {
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

function targetIsInsideOpenOverlay() {
  const activeElement = document.activeElement;

  if (!(activeElement instanceof Element)) {
    return false;
  }

  return Boolean(
    activeElement.closest("[data-slot='popover-content'], [role='dialog']"),
  );
}

function getViewportClassName(viewport = "centered") {
  if (viewport === "full") {
    return "max-w-none";
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
