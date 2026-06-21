"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/ui/search-input";

export type RegistryListItem = {
  name: string;
  title?: string;
  description?: string;
  category: string;
  categories?: string[];
  meta?: {
    tags?: string[];
    effects?: string[];
  };
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
};

function getDisplayName(item: RegistryListItem) {
  return item.title ?? item.name;
}

function getCountLabel(
  count: number,
  itemLabel: string,
  itemLabelPlural: string,
) {
  return `${count} ${count === 1 ? itemLabel : itemLabelPlural}`;
}

function getItemMetadata(item: RegistryListItem) {
  return uniqueStrings([
    ...(item.categories ?? []),
    ...(item.meta?.effects ?? []),
  ]).slice(0, 3);
}

function getSearchableText(item: RegistryListItem) {
  return normalizeSearchText(
    [
      item.title,
      item.name,
      item.category,
      item.description,
      ...(item.categories ?? []),
      ...(item.meta?.tags ?? []),
      ...(item.meta?.effects ?? []),
      ...(item.searchTerms ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeSearchText(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
}: RegistryItemsBrowserProps) {
  const [query, setQuery] = useState("");
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

  const resultLabel =
    filteredItems.length === items.length
      ? getCountLabel(items.length, itemLabel, itemLabelPlural)
      : `${filteredItems.length} of ${getCountLabel(
          items.length,
          itemLabel,
          itemLabelPlural,
        )}`;

  const clearSearch = () => setQuery("");

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 border-b pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-end">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            {description}
          </p>
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

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            {resultLabel}
          </h2>
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
        </div>

        {items.length > 0 ? (
          filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <RegistryItemLink key={item.name} item={item} />
              ))}
            </div>
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
      </section>
    </div>
  );
}

function RegistryItemLink({ item }: { item: RegistryListItem }) {
  const metadata = getItemMetadata(item);

  return (
    <Link
      href={item.href}
      className="group flex min-w-0 flex-col gap-1 rounded-sm underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="text-lg font-medium text-foreground transition-colors group-hover:text-muted-foreground group-hover:underline">
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
