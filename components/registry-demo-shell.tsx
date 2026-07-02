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
  label: string;
};

const navigationCues: NavigationCueConfig[] = [
  {
    direction: "previous",
    icon: ChevronLeft,
    label: "Prev item",
  },
  {
    direction: "next",
    icon: ChevronRight,
    label: "Next item",
  },
  {
    direction: "previousCategory",
    icon: ChevronUp,
    label: "Prev group",
  },
  {
    direction: "nextCategory",
    icon: ChevronDown,
    label: "Next group",
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
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

let navigationPanelOpenMemory = false;

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
    toggleNavigationPanelOpen,
  ]);

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">{item.title} fullscreen preview</h1>

      <NavigationContextPanel
        item={item}
        navigation={navigation}
        groups={navigationGroups}
        itemPageLabel={itemPageLabel}
        open={navigationPanelState.open}
        activeShortcut={navigationPanelState.activeShortcut}
        onOpenChange={setNavigationPanelOpen}
      />

      <section className="relative flex flex-1 items-center justify-center overflow-auto p-5 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:56px_56px] opacity-30 [mask-image:radial-gradient(circle_at_center,black,transparent_78%)] dark:opacity-20"
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
  navigation,
  groups,
  itemPageLabel,
  open,
  activeShortcut,
  onOpenChange,
}: {
  item: RegistryDisplayItem;
  navigation: RegistryDemoNavigation;
  groups: RegistryDemoNavigationGroup[];
  itemPageLabel: string;
  open: boolean;
  activeShortcut: NavigationShortcutDirection | null;
  onOpenChange: (open: boolean) => void;
}) {
  const panelId = useId();
  const shortcutPanelId = useId();
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const lastScrolledItemNameRef = useRef<string | null>(
    activeShortcut ? null : item.name,
  );
  const [shortcutsExpanded, setShortcutsExpanded] = useState(false);
  const currentGroup =
    groups.find((group) => group.category === item.category) ??
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

    if (activeShortcut && lastScrolledItemNameRef.current === item.name) {
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
      direction: activeShortcut,
      smooth: Boolean(activeShortcut) && !shouldReduceMotion,
    });
    lastScrolledItemNameRef.current = item.name;
  }, [activeShortcut, item.name, open, shouldReduceMotion]);

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
            "relative overflow-hidden rounded-lg border border-border/70 bg-popover/90 text-popover-foreground shadow-md shadow-black/10 backdrop-blur-xl transition-[width] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[width,height] supports-[backdrop-filter]:bg-popover/80 motion-reduce:transition-none dark:shadow-black/20",
            open
              ? "w-[min(18.25rem,calc(100vw-1.5rem))]"
              : "size-8 sm:size-8",
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
                <div
                  ref={treeScrollRef}
                  className="registry-navigation-scrollbar max-h-[min(15.5rem,calc(100dvh-8rem))] overflow-y-auto py-2.5 pl-1.5 pr-8"
                >
                  <div className="flex flex-col gap-1.5">
                    {groups.map((group, groupIndex) => (
                      <NavigationGroupTree
                        key={group.category}
                        group={group}
                        groupIndex={groupIndex}
                        currentGroupIndex={currentGroupIndex}
                        currentItemName={item.name}
                      />
                    ))}
                  </div>
                </div>
                <NavigationShortcutBar
                  expanded={shortcutsExpanded}
                  activeShortcut={activeShortcut}
                  navigation={navigation}
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
}: {
  group: RegistryDemoNavigationGroup;
  groupIndex: number;
  currentGroupIndex: number;
  currentItemName: string;
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
  activeShortcut,
  navigation,
  itemPageLabel,
  itemHref,
  panelId,
  onExpandedChange,
}: {
  expanded: boolean;
  activeShortcut: NavigationShortcutDirection | null;
  navigation: RegistryDemoNavigation;
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
        "text-xs",
        expanded
          ? "mx-1 mb-1 overflow-hidden rounded-md bg-muted/20 p-1 ring-1 ring-border/50"
          : "px-1 pb-1",
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
          "flex items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none",
          expanded
            ? "h-4 w-full bg-transparent"
            : "h-4 w-full bg-muted/30 ring-1 ring-border/40",
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
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-1 pt-1 text-xs">
              <NavigationShortcutGroup
                label="Prev/next item"
                secondaryLabel="Prev/next group"
                ariaLabel="Left and right navigate items. Up and down navigate groups."
                previousCue={navigationCues[0]}
                previousItem={navigation.previous}
                nextCue={navigationCues[1]}
                nextItem={navigation.next}
                secondaryPreviousCue={navigationCues[2]}
                secondaryPreviousItem={navigation.previousCategory}
                secondaryNextCue={navigationCues[3]}
                secondaryNextItem={navigation.nextCategory}
                activeShortcut={activeShortcut}
              />
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

function NavigationShortcutGroup({
  label,
  secondaryLabel,
  ariaLabel,
  previousCue,
  previousItem,
  nextCue,
  nextItem,
  secondaryPreviousCue,
  secondaryPreviousItem,
  secondaryNextCue,
  secondaryNextItem,
  activeShortcut,
}: {
  label: string;
  secondaryLabel?: string;
  ariaLabel: string;
  previousCue: NavigationCueConfig;
  previousItem?: RegistryDemoNavigationItem;
  nextCue: NavigationCueConfig;
  nextItem?: RegistryDemoNavigationItem;
  secondaryPreviousCue?: NavigationCueConfig;
  secondaryPreviousItem?: RegistryDemoNavigationItem;
  secondaryNextCue?: NavigationCueConfig;
  secondaryNextItem?: RegistryDemoNavigationItem;
  activeShortcut: NavigationShortcutDirection | null;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        shortcutActionSurfaceClassName,
        "col-span-2 flex-wrap justify-center gap-x-2 gap-y-1 text-center",
      )}
    >
      <span className="flex min-w-0 items-center gap-1">
        <span className="flex shrink-0 items-center gap-0.5">
          <NavigationShortcutKey
            cue={previousCue}
            item={previousItem}
            active={activeShortcut === previousCue.direction}
            dimmed={Boolean(
              activeShortcut && activeShortcut !== previousCue.direction,
            )}
          />
          <NavigationShortcutKey
            cue={nextCue}
            item={nextItem}
            active={activeShortcut === nextCue.direction}
            dimmed={Boolean(
              activeShortcut && activeShortcut !== nextCue.direction,
            )}
          />
        </span>
        <ShortcutActionLabel>{label}</ShortcutActionLabel>
      </span>

      {secondaryPreviousCue && secondaryNextCue && secondaryLabel ? (
        <span className="flex min-w-0 items-center gap-1">
          <span className="flex shrink-0 items-center gap-0.5">
            <NavigationShortcutKey
              cue={secondaryPreviousCue}
              item={secondaryPreviousItem}
              active={activeShortcut === secondaryPreviousCue.direction}
              dimmed={Boolean(
                activeShortcut &&
                  activeShortcut !== secondaryPreviousCue.direction,
              )}
            />
            <NavigationShortcutKey
              cue={secondaryNextCue}
              item={secondaryNextItem}
              active={activeShortcut === secondaryNextCue.direction}
              dimmed={Boolean(
                activeShortcut && activeShortcut !== secondaryNextCue.direction,
              )}
            />
          </span>
          <ShortcutActionLabel>{secondaryLabel}</ShortcutActionLabel>
        </span>
      ) : null}
      {secondaryPreviousCue && !secondaryNextCue && secondaryLabel ? (
        <span className="flex min-w-0 items-center gap-1">
          <NavigationShortcutKey
            cue={secondaryPreviousCue}
            item={secondaryPreviousItem}
            active={activeShortcut === secondaryPreviousCue.direction}
            dimmed={Boolean(
              activeShortcut &&
                activeShortcut !== secondaryPreviousCue.direction,
            )}
          />
          <ShortcutActionLabel>{secondaryLabel}</ShortcutActionLabel>
        </span>
      ) : null}
    </div>
  );
}

function NavigationShortcutKey({
  cue,
  item,
  active,
  dimmed,
}: {
  cue: NavigationCueConfig;
  item?: RegistryDemoNavigationItem;
  active: boolean;
  dimmed: boolean;
}) {
  const Icon = cue.icon;
  const content = (
    <ShortcutKey
      className={cn(
        shortcutKeyCompactClassName,
        active && "text-foreground",
      )}
    >
      <Icon aria-hidden="true" className="size-3" />
    </ShortcutKey>
  );
  const className = cn(
    "rounded-[3px] outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring",
    dimmed && "opacity-50",
    !item && "pointer-events-none opacity-35",
  );

  if (!item) {
    return (
      <span aria-disabled="true" title={cue.label} className={className}>
        {content}
      </span>
    );
  }

  return (
    <Link
      href={item.viewHref}
      replace
      aria-label={`${cue.label}: ${item.title}`}
      title={`${cue.label}: ${item.title}`}
      className={className}
    >
      {content}
    </Link>
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
      <ShortcutKey className={shortcutKeyCompactClassName}>
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
      <ShortcutKey className={shortcutKeyCompactClassName}>
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
  "flex min-w-0 items-center justify-center gap-1 bg-transparent px-1.5 py-1.5 text-muted-foreground";

const shortcutActionClassName = cn(
  shortcutActionSurfaceClassName,
  "rounded-md bg-transparent ring-1 ring-border/60 transition-colors",
  "hover:bg-transparent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
);

const shortcutKeyCompactClassName =
  "grid size-4 min-w-4 place-items-center rounded-[3px] p-0 px-0 text-center font-mono text-[0.6rem] leading-none text-muted-foreground shadow-none";

const shortcutActionButtonClassName = cn(
  shortcutActionClassName,
  "h-auto border-0 shadow-none aria-expanded:bg-transparent hover:bg-transparent dark:hover:bg-transparent",
);

function replaceNavigationItem(
  router: ReturnType<typeof useRouter>,
  item?: RegistryDemoNavigationItem,
  direction?: NavigationShortcutDirection,
  onShortcut?: (direction: NavigationShortcutDirection) => void,
) {
  if (!item) {
    return;
  }

  if (direction) {
    onShortcut?.(direction);
    rememberNavigationShortcut(direction);
  }

  router.replace(item.viewHref);
}

function scrollNavigationItemIntoView({
  container,
  item,
  direction,
  smooth,
}: {
  container: HTMLDivElement;
  item: HTMLElement;
  direction: NavigationShortcutDirection | null;
  smooth: boolean;
}) {
  if (!direction) {
    item.scrollIntoView({ block: "nearest" });
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();
  const itemCenter =
    itemRect.top - containerRect.top + container.scrollTop + itemRect.height / 2;
  const alignRatio = isPreviousNavigationDirection(direction) ? 0.35 : 0.65;
  const scrollTop = clamp(
    itemCenter - container.clientHeight * alignRatio,
    0,
    container.scrollHeight - container.clientHeight,
  );

  container.scrollTo({
    top: scrollTop,
    behavior: smooth ? "smooth" : "auto",
  });
}

function isPreviousNavigationDirection(direction: NavigationShortcutDirection) {
  return direction === "previous" || direction === "previousCategory";
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
    const rawValue = window.sessionStorage.getItem(navigationShortcutStorageKey);
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
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
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
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
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
