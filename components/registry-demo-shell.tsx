"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useTheme } from "fumadocs-ui/provider/base";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { RegistryPreview } from "@/components/registry-preview";
import type { RegistryDisplayItem } from "@/lib/registry-display";
import { cn } from "@/lib/utils";
import {
  FloatingContextMap,
  type FloatingContextMapAction,
  type FloatingContextMapGroup,
  type FloatingContextMapShortcutGroup,
} from "@/registry/base/ui/floating-context-map";

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
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

let navigationPanelOpenMemory = false;
let navigationPanelScrollTopMemory = 0;

type NavigationPanelState = {
  open: boolean;
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
  const { resolvedTheme, setTheme } = useTheme();
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
      findNavigationItem(navigationPanelSourceGroups, navigationSelectionName) ??
      item,
    [item, navigationPanelSourceGroups, navigationSelectionName],
  );
  const contextMapGroups = useMemo(
    () => toFloatingContextMapGroups(navigationPanelSourceGroups),
    [navigationPanelSourceGroups],
  );
  const contextMapShortcutGroups = useMemo(
    () => toFloatingContextMapShortcutGroups(),
    [],
  );
  const contextMapActions = useMemo<FloatingContextMapAction[]>(
    () => [
      {
        id: "theme",
        label: "Theme",
        shortcut: "D",
        "aria-label": "Toggle theme",
        title: "Toggle theme",
        onSelect: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
      },
      {
        id: "exit",
        label: "Exit",
        shortcut: "Esc",
        "aria-label": `Exit fullscreen to ${itemPageLabel.toLowerCase()}`,
        title: "Exit fullscreen",
        onSelect: () => router.push(item.href),
      },
    ],
    [item.href, itemPageLabel, resolvedTheme, router, setTheme],
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
        autoOpened: false,
      };
    });
  }, []);

  const activateNavigationShortcut = useCallback(
    () => {
      setNavigationPanelState((current) => ({
        open: true,
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
      autoOpened:
        !navigationPanelOpenMemory && (current.autoOpened || !current.open),
      shortcutSequence: current.shortcutSequence + 1,
    }));
  }, [item.name]);

  useEffect(() => {
    if (!navigationPanelState.autoOpened) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNavigationPanelState((current) => ({
        ...current,
        open: current.autoOpened ? false : current.open,
        autoOpened: false,
      }));
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [navigationPanelState.autoOpened, navigationPanelState.shortcutSequence]);

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

      <FloatingContextMap
        className="fixed right-3 top-3 z-30 sm:right-4 sm:top-4"
        groups={contextMapGroups}
        currentItemId={navigationSelection.name}
        open={navigationPanelState.open}
        actions={contextMapActions}
        shortcutGroups={contextMapShortcutGroups}
        initialScrollTop={navigationPanelScrollTopMemory}
        closeOnEscape={false}
        openLabel="Open navigation map"
        closeLabel="Collapse navigation map"
        actionsLabel="Fullscreen preview actions"
        onOpenChange={setNavigationPanelOpen}
        onScrollTopChange={(scrollTop) => {
          navigationPanelScrollTopMemory = scrollTop;
        }}
        onItemSelect={(contextItem) => {
          const nextItem = findNavigationItem(
            navigationPanelSourceGroups,
            contextItem.id,
          );

          if (!nextItem) {
            return;
          }

          selectNavigationItem(nextItem);
        }}
        renderItem={({ item: contextItem, children, itemProps }) => {
          const nextItem = findNavigationItem(
            navigationPanelSourceGroups,
            contextItem.id,
          );

          if (!nextItem) {
            return (
              <button type="button" {...itemProps}>
                {children}
              </button>
            );
          }

          return (
            <Link
              href={nextItem.viewHref}
              replace
              scroll={false}
              {...itemProps}
            >
              {children}
            </Link>
          );
        }}
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

function toFloatingContextMapGroups(
  groups: RegistryDemoNavigationGroup[],
): FloatingContextMapGroup[] {
  return groups.map((group) => ({
    id: group.category,
    label: group.label,
    items: group.items.map((item) => ({
      id: item.name,
      label: item.title,
    })),
  }));
}

function toFloatingContextMapShortcutGroups(): FloatingContextMapShortcutGroup[] {
  return [
    {
      id: "item",
      label: "Item",
      keys: navigationCues.slice(0, 2).map(toFloatingContextMapShortcutKey),
    },
    {
      id: "group",
      label: "Group",
      keys: navigationCues.slice(2, 4).map(toFloatingContextMapShortcutKey),
    },
  ];
}

function toFloatingContextMapShortcutKey(cue: NavigationCueConfig) {
  const Icon = cue.icon;

  return {
    id: cue.direction,
    icon: <Icon aria-hidden="true" className="size-3" />,
  };
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

function createInitialNavigationPanelState(): NavigationPanelState {
  const shortcut = consumeRecentNavigationShortcut();
  const open = navigationPanelOpenMemory || Boolean(shortcut);

  return {
    open,
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
