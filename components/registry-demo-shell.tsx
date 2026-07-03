"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useTheme } from "fumadocs-ui/provider/base";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  PreviewCornerSlotProvider,
  RegistryPreview,
} from "@/components/registry-preview";
import type { RegistryDisplayItem } from "@/lib/registry-display";
import { cn } from "@/lib/utils";
import { useScrollAnchor } from "@/registry/base/hooks/use-scroll-anchor";
import { ExpandingButton } from "@/registry/base/ui/expanding-button";

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

  const exitFullscreen = useCallback(() => {
    router.replace(item.href, { scroll: false });
  }, [item.href, router]);

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
    exitFullscreen,
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

      <ExpandingButton
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
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto pl-1.5 pr-[var(--expanding-button-trigger-inset)]"
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
      </ExpandingButton>

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
            <RegistryPreview name={item.name} variant={variant} />
          </PreviewCornerSlotProvider>
        </div>
      </section>
    </main>
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
      overlay && !overlay.closest("[data-slot='expanding-button']"),
    );
  }

  const activeElement = document.activeElement;

  if (!(activeElement instanceof Element)) {
    return false;
  }

  const overlay = activeElement.closest(
    "[data-slot='popover-content'], [role='dialog']",
  );

  return Boolean(overlay && !overlay.closest("[data-slot='expanding-button']"));
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
