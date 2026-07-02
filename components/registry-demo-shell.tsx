"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useTheme } from "fumadocs-ui/provider/base";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RegistryPreview } from "@/components/registry-preview";
import type { RegistryDisplayItem } from "@/lib/registry-display";
import { cn } from "@/lib/utils";
import {
  FloatingContextMap,
  type FloatingContextMapAction,
  type FloatingContextMapGroup,
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

let navigationPanelOpenMemory = false;
let navigationPanelScrollTopMemory = 0;

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
    setPanelOpen(open);
  }, []);

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
        router.push(item.href);
        return;
      }

      if (shouldIgnoreShortcut(event)) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        replaceNavigationItem(router, navigation.next, selectNavigationItem);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        replaceNavigationItem(
          router,
          navigation.previous,
          selectNavigationItem,
        );
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

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
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
        open={panelOpen}
        actions={contextMapActions}
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
