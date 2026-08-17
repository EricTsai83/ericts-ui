"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  RegistryArrangementToggle,
  type RegistryArrangement,
} from "@/components/registry-arrangement-toggle";
import { SearchInput } from "@/components/ui/search-input";
import { cn } from "@/lib/utils";

export type RegistryListItem = {
  name: string;
  title?: string;
  description?: string;
  category: string;
  categories?: string[];
  groupCategory?: string;
  groupLabel?: string;
  meta?: {
    tags?: string[];
    effects?: string[];
    cssOnly?: boolean;
  };
  hasCssOnly?: boolean;
  searchTerms?: string[];
  href: string;
};

type RegistryItemsBrowserProps = {
  items: RegistryListItem[];
  title: string;
  description: string;
  searchInputId: string;
  searchLabel: string;
  searchPlaceholder: string;
  itemLabel: string;
  itemLabelPlural: string;
  emptyTitle: string;
  emptyDescription: string;
  noItemsLabel: string;
  enableArrangement?: boolean;
  arrangementStorageKey?: string;
  /**
   * Category slugs in the order their groups should render. This browser used
   * to order groups by label instead, which quietly gave the same taxonomy two
   * orders — the homepage rendered Actions → Form → Tabs & Navigation, this
   * list rendered Actions → Containers → Display. Ordering lives with the
   * category declarations; this component only follows it.
   */
  categoryOrder?: readonly string[];
  fullscreenHref?: string;
  fullscreenLabel?: string;
};

type RegistryItemGroup = {
  category: string;
  label: string;
  items: RegistryListItem[];
};

const noCategoryOrder: readonly string[] = [];

function getDisplayName(item: RegistryListItem) {
  return item.title ?? item.name;
}

function compareItems(a: RegistryListItem, b: RegistryListItem) {
  return getDisplayName(a).localeCompare(getDisplayName(b));
}

function formatCategoryLabel(category: string) {
  return category
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function groupItemsByPrimaryCategory(
  items: RegistryListItem[],
  categoryOrder: readonly string[],
): RegistryItemGroup[] {
  const groups = new Map<
    string,
    { label: string; items: RegistryListItem[] }
  >();
  const categoryRank = new Map(
    categoryOrder.map((category, index) => [category, index]),
  );

  for (const item of items) {
    const category =
      item.groupCategory?.trim() || item.categories?.[0]?.trim() || "other";
    const group = groups.get(category) ?? {
      label: item.groupLabel?.trim() || formatCategoryLabel(category),
      items: [],
    };

    group.items.push(item);
    groups.set(category, group);
  }

  return Array.from(groups, ([category, group]) => ({
    category,
    label: group.label,
    items: group.items.sort(compareItems),
  })).sort((a, b) => {
    // A category with no declared rank sorts last rather than first, so an item
    // that predates its category declaration cannot displace the curated order.
    const rankA = categoryRank.get(a.category) ?? Number.POSITIVE_INFINITY;
    const rankB = categoryRank.get(b.category) ?? Number.POSITIVE_INFINITY;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return a.label.localeCompare(b.label);
  });
}

function getItemMetadata(
  item: RegistryListItem,
  { includeCategory }: { includeCategory: boolean },
) {
  return uniqueStrings([
    // `groupLabel` is the same taxonomy the group headings use; the raw
    // `categories` slug is only a fallback for an item with no display config.
    // Reading the slug here instead is what let a card labelled "drawer" sit
    // under an "Overlays" heading.
    includeCategory ? (item.groupLabel ?? item.categories?.[0]) : undefined,
    item.meta?.tags?.includes("nextjs-only") ? "Next.js only" : undefined,
    item.meta?.effects?.[0],
    item.hasCssOnly || item.meta?.cssOnly
      ? "CSS-only alternative"
      : undefined,
  ]);
}

function getSearchableText(item: RegistryListItem) {
  return normalizeSearchText(
    [
      item.title,
      item.name,
      item.category,
      ...(item.categories ?? []),
      ...(item.meta?.effects ?? []),
      ...(item.hasCssOnly || item.meta?.cssOnly
        ? ["css-only alternative", "css alternative", "css-only", "css version"]
        : []),
      ...(item.searchTerms ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
}

function normalizeSearchText(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function subscribeToStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

type ArrangementSnapshot = RegistryArrangement | "pending";

function getServerArrangement(): ArrangementSnapshot {
  return "pending";
}

function getStoredArrangement(
  storageKey: string | undefined,
): RegistryArrangement {
  if (!storageKey) {
    return "alphabetical";
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    return storedValue === "category" ? "category" : "alphabetical";
  } catch {
    return "alphabetical";
  }
}

export function RegistryItemsBrowser({
  items,
  title,
  description,
  searchInputId,
  searchLabel,
  searchPlaceholder,
  itemLabel,
  itemLabelPlural,
  emptyTitle,
  emptyDescription,
  noItemsLabel,
  enableArrangement = false,
  arrangementStorageKey,
  categoryOrder = noCategoryOrder,
  fullscreenHref,
  fullscreenLabel = `Browse ${itemLabelPlural} fullscreen`,
}: RegistryItemsBrowserProps) {
  const [query, setQuery] = useState("");
  const [browseModeOverride, setBrowseModeOverride] =
    useState<RegistryArrangement | null>(null);
  const storedBrowseMode = useSyncExternalStore(
    subscribeToStorage,
    () => getStoredArrangement(arrangementStorageKey),
    getServerArrangement,
  );
  const arrangementReady = storedBrowseMode !== "pending";
  const browseMode =
    browseModeOverride ??
    (storedBrowseMode === "pending" ? "alphabetical" : storedBrowseMode);
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeSearchText(trimmedQuery);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }

      return getSearchableText(item).includes(normalizedQuery);
    });
  }, [items, normalizedQuery]);

  const groupedItems = useMemo(
    () => groupItemsByPrimaryCategory(filteredItems, categoryOrder),
    [filteredItems, categoryOrder],
  );

  const clearSearch = () => setQuery("");

  const handleBrowseModeChange = (nextMode: RegistryArrangement) => {
    setBrowseModeOverride(nextMode);

    if (arrangementStorageKey) {
      try {
        window.localStorage.setItem(arrangementStorageKey, nextMode);
      } catch {
        // The view still works when storage is unavailable.
      }
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 border-b pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-end">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>
          {fullscreenHref ? (
            <Link
              href={fullscreenHref}
              className="self-start rounded-sm text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-muted-foreground hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {fullscreenLabel}
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor={searchInputId}
            className="text-sm font-medium text-foreground"
          >
            {searchLabel}
          </label>
          <div>
            <SearchInput
              id={searchInputId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={clearSearch}
              placeholder={searchPlaceholder}
              clearLabel={`Clear ${itemLabel} search`}
              className="h-11 bg-background shadow-none hover:border-foreground/30"
            />
          </div>
        </div>
      </section>

      <section
        className="flex flex-col gap-4"
        aria-busy={enableArrangement && !arrangementReady}
      >
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-2">
            {trimmedQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
                Clear
              </button>
            ) : null}
            {enableArrangement && items.length > 0 ? (
              <div
                className={cn(!arrangementReady && "invisible")}
                aria-hidden={arrangementReady ? undefined : true}
              >
                <RegistryArrangementToggle
                  value={browseMode}
                  onValueChange={handleBrowseModeChange}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className={cn(enableArrangement && !arrangementReady && "invisible")}>
          {items.length > 0 ? (
            filteredItems.length > 0 ? (
              browseMode === "category" ? (
                <div className="flex flex-col gap-10">
                  {groupedItems.map((group) => (
                    <section
                      key={group.category}
                      className="flex flex-col gap-5"
                    >
                      {/*
                       * A step *above* the item titles it collects. At
                       * `text-base` against `text-lg` items the heading was the
                       * smallest type in its own section, so a category read as
                       * a caption on the first row rather than as the rank above
                       * every row under it. Sits one step below the page title,
                       * which keeps the page → category → item order legible by
                       * size alone.
                       */}
                      <h3 className="border-b pb-2 text-xl font-semibold tracking-tight">
                        {group.label}
                      </h3>
                      <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((item) => (
                          <RegistryItemLink
                            key={item.name}
                            item={item}
                            showCategory={false}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => (
                    <RegistryItemLink key={item.name} item={item} showCategory />
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-12 text-center">
                <div className="flex max-w-sm flex-col gap-1">
                  <h3 className="font-medium">{emptyTitle}</h3>
                  <p className="text-sm text-muted-foreground">
                    {emptyDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3.5" aria-hidden="true" />
                  Clear search
                </button>
              </div>
            )
          ) : (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              {noItemsLabel}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RegistryItemLink({
  item,
  showCategory,
}: {
  item: RegistryListItem;
  showCategory: boolean;
}) {
  const metadata = getItemMetadata(item, { includeCategory: showCategory });

  return (
    <Link
      href={item.href}
      className="group flex min-w-0 flex-col gap-1 rounded-sm underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/*
       * `text-base`, not `text-lg`. An item is the leaf of the list, so it
       * should be the smallest heading on the page — sized above its own
       * metadata line and below the category heading it sits under. It is one
       * size in both arrangements deliberately: toggling Alphabetical against
       * Category regroups the same items and must not also resize them.
       */}
      <span className="text-base font-medium text-foreground transition-colors group-hover:text-muted-foreground group-hover:underline">
        {getDisplayName(item)}
      </span>
      {metadata.length > 0 ? (
        <span className="line-clamp-1 text-xs text-muted-foreground">
          {metadata.join(" / ")}
        </span>
      ) : null}
    </Link>
  );
}
