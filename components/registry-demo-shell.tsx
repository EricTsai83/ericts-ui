"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ListTree,
  type LucideIcon,
} from "lucide-react";
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
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const currentGroup =
    groups.find((group) => group.category === item.category) ??
    getFallbackNavigationGroup(item);
  const currentGroupIndex = groups.findIndex(
    (group) => group.category === currentGroup.category,
  );

  useIsomorphicLayoutEffect(() => {
    if (!open) {
      return;
    }

    const currentItem = treeScrollRef.current?.querySelector(
      "[data-navigation-current='true']",
    );

    currentItem?.scrollIntoView({ block: "nearest" });
  }, [item.name, open]);

  return (
    <aside
      aria-label="Preview position"
      className="fixed right-3 top-3 z-30 flex max-w-[calc(100vw-1.5rem)] justify-end sm:right-4 sm:top-4"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-lg border bg-popover/95 text-popover-foreground shadow-sm backdrop-blur-md transition-[width] duration-150 ease-out supports-[backdrop-filter]:bg-popover/85",
          open
            ? "w-[min(19rem,calc(100vw-1.5rem))]"
            : "size-8 sm:size-8",
        )}
      >
        <button
          type="button"
          aria-controls={panelId}
          aria-expanded={open}
          aria-label={open ? "Collapse navigation map" : "Open navigation map"}
          onClick={() => onOpenChange(!open)}
          className={cn(
            "extend-touch-target flex size-8 items-center justify-center outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            open && "absolute right-0 top-0 z-10 bg-popover/95",
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-transparent text-muted-foreground"
          >
            <ListTree className="size-3.5" />
          </span>
        </button>

        {open ? (
          <div id={panelId}>
            <div
              ref={treeScrollRef}
              className="max-h-[min(26rem,calc(100dvh-8rem))] overflow-y-auto py-1.5 pl-1.5 pr-9"
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
              activeShortcut={activeShortcut}
              navigation={navigation}
              itemHref={item.href}
              itemPageLabel={itemPageLabel}
            />
          </div>
        ) : null}
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
          "flex min-w-0 items-center gap-2 px-2 py-1 text-xs font-medium leading-4",
          isCurrentGroup ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            isCurrentGroup ? "bg-primary" : "bg-border",
          )}
        />
        <span className="truncate">{group.label}</span>
        <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
          {group.items.length}
        </span>
      </div>
      <div className="flex min-w-0 flex-col">
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
                "group/navigation-map-item grid h-7 min-w-0 grid-cols-[1rem_minmax(0,1fr)] items-center gap-1.5 rounded-md px-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isCurrentItem
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mx-auto size-1 rounded-full transition-colors",
                  isCurrentItem
                    ? "bg-primary"
                    : "bg-border group-hover/navigation-map-item:bg-muted-foreground/40",
                )}
              />
              <span className="truncate">{groupItem.title}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function NavigationShortcutBar({
  activeShortcut,
  navigation,
  itemPageLabel,
  itemHref,
}: {
  activeShortcut: NavigationShortcutDirection | null;
  navigation: RegistryDemoNavigation;
  itemPageLabel: string;
  itemHref: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-px border-t bg-border text-xs">
      <NavigationShortcutGroup
        label="Prev / Next item"
        previousCue={navigationCues[0]}
        previousItem={navigation.previous}
        nextCue={navigationCues[1]}
        nextItem={navigation.next}
        activeShortcut={activeShortcut}
      />
      <NavigationShortcutGroup
        label="Prev / Next group"
        previousCue={navigationCues[2]}
        previousItem={navigation.previousCategory}
        nextCue={navigationCues[3]}
        nextItem={navigation.nextCategory}
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
  );
}

function NavigationShortcutGroup({
  label,
  previousCue,
  previousItem,
  nextCue,
  nextItem,
  activeShortcut,
}: {
  label: string;
  previousCue: NavigationCueConfig;
  previousItem?: RegistryDemoNavigationItem;
  nextCue: NavigationCueConfig;
  nextItem?: RegistryDemoNavigationItem;
  activeShortcut: NavigationShortcutDirection | null;
}) {
  return (
    <div
      aria-label={label}
      className={cn(shortcutActionSurfaceClassName, "justify-start gap-1.5")}
    >
      <div className="flex shrink-0 items-center gap-0.5">
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
          dimmed={Boolean(activeShortcut && activeShortcut !== nextCue.direction)}
        />
      </div>
      <ShortcutActionLabel>{label}</ShortcutActionLabel>
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
    <span className="whitespace-nowrap text-xs leading-none text-muted-foreground">
      {children}
    </span>
  );
}

const shortcutActionSurfaceClassName =
  "flex min-w-0 items-center justify-center gap-1 bg-popover px-1.5 py-1.5";

const shortcutActionClassName = cn(
  shortcutActionSurfaceClassName,
  "transition-colors",
  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
);

const shortcutKeyCompactClassName =
  "grid size-4 min-w-4 place-items-center rounded-[3px] p-0 px-0 text-center font-mono text-[0.6rem] leading-none text-muted-foreground shadow-none";

const shortcutActionButtonClassName = cn(
  shortcutActionClassName,
  "h-auto rounded-none border-0 text-popover-foreground shadow-none hover:text-popover-foreground",
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
