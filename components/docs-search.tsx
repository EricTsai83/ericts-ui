"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useDocsSearch } from "fumadocs-core/search/client";
import { fetchClient } from "fumadocs-core/search/client/fetch";
import type { SearchLink, SharedProps } from "fumadocs-ui/contexts/search";
import {
  SearchDialog,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  type SearchItemType,
  useSearchList,
} from "fumadocs-ui/components/dialog/search";
import {
  AlignLeft,
  Component,
  CornerDownLeft,
  FileText,
  Hash,
  Loader2,
  Search,
} from "lucide-react";

import { getDefaultComponentSearchItems } from "@/lib/component-search";
import { cn } from "@/lib/utils";

type DocsSearchDialogProps = SharedProps & {
  api?: string;
  delayMs?: number;
  links?: SearchLink[];
};

export function DocsSearchDialog({
  api = "/api/search",
  delayMs,
  links = [],
  ...props
}: DocsSearchDialogProps) {
  const { locale } = useI18n();
  const { search, setSearch, query } = useDocsSearch({
    client: fetchClient({
      api,
      locale,
    }),
    delayMs,
  });

  const defaultItems = useMemo<SearchItemType[] | null>(() => {
    const componentItems = getDefaultComponentSearchItems();
    const linkItems: SearchItemType[] = links.map(([name, href], index) => ({
      type: "page",
      id: `link-${index}-${href}`,
      content: name,
      url: href,
    }));
    const items = [...componentItems, ...linkItems];

    if (items.length === 0) {
      return null;
    }

    return items;
  }, [links]);

  const items = query.data !== "empty" ? query.data : defaultItems;
  const resultGroups = useMemo(() => getResultGroups(items, search), [
    items,
    search,
  ]);

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay className="bg-black/20 backdrop-blur-[2px] dark:bg-black/45" />
      <SearchDialogContent className="fixed top-4 max-w-[640px] rounded-xl border-none bg-background bg-clip-padding p-2 pb-11 shadow-2xl shadow-black/20 ring-4 ring-neutral-200/80 dark:bg-neutral-900 dark:shadow-black/50 dark:ring-neutral-800 md:top-[calc(50%-250px)]">
        <SearchDialogHeader className="relative mb-0 h-9 rounded-md border border-input bg-input/50 p-0 px-3">
          <Search
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <SearchDialogInput
            autoFocus
            placeholder="Search docs, components, and hooks..."
            className="h-9 w-0 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none"
          />
          {query.isLoading ? (
            <Loader2
              className="size-4 shrink-0 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </SearchDialogHeader>
        <SearchDialogList
          items={items}
          className="min-h-80 [&>div]:max-h-[min(460px,calc(100dvh-8rem))] [&>div]:overflow-y-auto"
          Empty={() => (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {query.isLoading ? "Searching..." : "No results found."}
            </div>
          )}
          Item={(itemProps) => (
            <DocsSearchResultItem
              {...itemProps}
              heading={resultGroups.headings.get(itemProps.item.id)}
              variant={
                resultGroups.componentIds.has(itemProps.item.id)
                  ? "component"
                  : "result"
              }
            />
          )}
        />
        <div className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center gap-2 rounded-b-xl border-t border-neutral-100 bg-neutral-50 px-4 text-xs font-medium text-muted-foreground dark:border-neutral-700 dark:bg-neutral-800">
          <kbd className="inline-flex size-5 items-center justify-center rounded border bg-background font-mono text-[0.7rem] shadow-sm">
            <CornerDownLeft className="size-3.5" aria-hidden="true" />
          </kbd>
          Go to Page
        </div>
      </SearchDialogContent>
    </SearchDialog>
  );
}

function DocsSearchResultItem({
  item,
  onClick,
  heading,
  variant = "result",
}: {
  item: SearchItemType;
  onClick: () => void;
  heading?: string;
  variant?: "component" | "result";
}) {
  const { active, setActive } = useSearchList();
  const selected = active === item.id;

  if (item.type === "action") {
    return (
      <button
        type="button"
        data-selected={selected}
        className={resultItemClassName(selected)}
        onClick={onClick}
        onPointerMove={() => setActive(item.id)}
      >
        {item.node}
      </button>
    );
  }

  const isComponent = variant === "component";

  return (
    <>
      {heading ? <SearchResultHeading>{heading}</SearchResultHeading> : null}
      <button
        type="button"
        data-selected={selected}
        data-variant={variant}
        className={resultItemClassName(selected, variant)}
        onClick={onClick}
        onPointerMove={() => setActive(item.id)}
      >
        {isComponent ? (
          <Component
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
            {item.type === "page" ? (
              <FileText className="size-4" aria-hidden="true" />
            ) : item.type === "heading" ? (
              <Hash className="size-4" aria-hidden="true" />
            ) : (
              <AlignLeft className="size-4" aria-hidden="true" />
            )}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {!isComponent && item.breadcrumbs?.length ? (
            <span className="flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
              {item.breadcrumbs.map((breadcrumb, index) => (
                <span key={index} className="min-w-0 truncate">
                  {breadcrumb}
                </span>
              ))}
            </span>
          ) : null}
          <span
            className={cn(
              "text-foreground [&_mark]:rounded-sm [&_mark]:bg-transparent [&_mark]:font-medium [&_mark]:text-foreground",
              isComponent
                ? "truncate text-sm font-medium leading-5"
                : "line-clamp-2 text-sm leading-5",
            )}
          >
            {renderContent(item.content)}
          </span>
        </span>
      </button>
    </>
  );
}

function SearchResultHeading({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-3 text-xs font-medium text-muted-foreground first:pt-2">
      {children}
    </div>
  );
}

function getResultGroups(
  items: SearchItemType[] | null | undefined,
  search: string,
) {
  const headings = new Map<string, string>();
  const componentIds = new Set<string>();

  if (!items) {
    return { headings, componentIds };
  }

  const hasSearch = search.trim().length > 0;

  for (const item of items) {
    if (isComponentSearchItem(item)) {
      componentIds.add(item.id);
    }
  }

  const firstComponent = items.find(isComponentSearchItem);
  const firstSearchResult = items.find(
    (item) => item.type !== "action" && !isComponentSearchItem(item),
  );

  if (firstComponent) {
    headings.set(firstComponent.id, "Registry");
  }

  if (firstSearchResult) {
    headings.set(firstSearchResult.id, hasSearch ? "Search Results" : "Pages");
  }

  return { headings, componentIds };
}

function isComponentSearchItem(item: SearchItemType) {
  return item.type !== "action" && item.id.startsWith("component-");
}

function resultItemClassName(
  selected: boolean,
  variant: "component" | "result" = "result",
) {
  return cn(
    "flex w-full select-none items-start rounded-lg px-2.5 py-2 text-left transition-colors",
    variant === "component" ? "h-9 items-center gap-2.5" : "gap-3",
    selected && "bg-accent text-accent-foreground",
    !selected && "text-foreground hover:bg-accent/60",
  );
}

function renderContent(content: ReactNode) {
  if (typeof content === "string") {
    return <span dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return content;
}
