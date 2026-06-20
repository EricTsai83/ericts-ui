"use client";

import type { ComponentProps, ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { ReactSortedResult } from "fumadocs-core/search";
import { useI18n } from "fumadocs-ui/contexts/i18n";
import { useDocsSearch } from "fumadocs-core/search/client";
import { fetchClient } from "fumadocs-core/search/client/fetch";
import type { SearchLink, SharedProps } from "fumadocs-ui/contexts/search";
import { useRouter } from "next/navigation";
import {
  AlignLeft,
  Braces,
  Component,
  CornerDownLeft,
  FileText,
  Hash,
  Loader2,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getDefaultRegistrySearchItems,
  getRegistrySearchKindFromId,
  type RegistrySearchKind,
} from "@/lib/component-search";
import { cn } from "@/lib/utils";

type SearchItemType =
  | (ReactSortedResult & {
      external?: boolean;
    })
  | {
      id: string;
      type: "action";
      node: ReactNode;
      onSelect: () => void;
    };

type DocsSearchDialogProps = SharedProps & {
  api?: string;
  delayMs?: number;
  links?: SearchLink[];
};

export function DocsSearchDialog({
  open,
  onOpenChange,
  api = "/api/search",
  delayMs,
  links = [],
}: DocsSearchDialogProps) {
  const router = useRouter();
  const { locale } = useI18n();
  const { search, setSearch, query } = useDocsSearch({
    client: fetchClient({
      api,
      locale,
    }),
    delayMs,
  });

  const defaultItems = useMemo<SearchItemType[] | null>(() => {
    const registryItems = getDefaultRegistrySearchItems();
    const linkItems: SearchItemType[] = links.map(([name, href], index) => ({
      type: "page",
      id: `link-${index}-${href}`,
      content: name,
      url: href,
    }));
    const items = [...registryItems, ...linkItems];

    if (items.length === 0) {
      return null;
    }

    return items;
  }, [links]);

  const items = query.data !== "empty" ? query.data : defaultItems;
  const groupedItems = useMemo(() => getCommandGroups(items, search), [
    items,
    search,
  ]);

  const selectItem = useCallback(
    (item: SearchItemType) => {
      if (item.type === "action") {
        item.onSelect();
      } else if (item.external) {
        window.open(item.url, "_blank", "noopener,noreferrer")?.focus();
      } else {
        router.push(item.url);
      }

      onOpenChange(false);
    },
    [onOpenChange, router],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/20 backdrop-blur-[2px] dark:bg-black/45" />
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className="fixed left-1/2 top-4 z-50 w-[calc(100%-1rem)] max-w-[640px] -translate-x-1/2 overflow-hidden rounded-xl border-none bg-background bg-clip-padding p-2 pb-11 text-sm text-foreground opacity-100 shadow-2xl shadow-black/20 ring-4 ring-neutral-200/80 outline-none transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-neutral-900 dark:shadow-black/50 dark:ring-neutral-800 md:top-[calc(50%-250px)]"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search documentation</DialogTitle>
            <DialogDescription>
              Search docs, components, and hooks.
            </DialogDescription>
          </DialogHeader>
          <Command
            shouldFilter={false}
            className="rounded-none bg-transparent p-0 **:data-[slot=command-input]:h-9! **:data-[slot=command-input]:py-0 **:data-[slot=command-input-wrapper]:p-0 **:data-[slot=command-input-wrapper]:pb-0 **:data-[slot=input-group]:mb-0 **:data-[slot=input-group]:h-9! **:data-[slot=input-group]:rounded-md! **:data-[slot=input-group]:border-input **:data-[slot=input-group]:bg-input/50"
          >
            <div className="relative mb-1">
              <CommandInput
                autoFocus
                value={search}
                onValueChange={setSearch}
                placeholder="Search docs, components, and hooks..."
                className="pr-8 placeholder:text-muted-foreground"
              />
              {query.isLoading ? (
                <div className="pointer-events-none absolute right-3 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center">
                  <Loader2
                    className="size-4 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
              ) : null}
            </div>
            <CommandList className="min-h-80 max-h-[min(460px,calc(100dvh-8rem))] scroll-pb-1.5 scroll-pt-2">
              <CommandEmpty className="py-12 text-center text-sm text-muted-foreground">
                {query.isLoading ? "Searching..." : "No results found."}
              </CommandEmpty>
              {groupedItems.map((group) => (
                <CommandGroup
                  key={group.heading}
                  heading={group.heading}
                  className="p-0! **:[[cmdk-group-heading]]:px-3! **:[[cmdk-group-heading]]:pb-1! **:[[cmdk-group-heading]]:pt-3! first:**:[[cmdk-group-heading]]:pt-2!"
                >
                  {group.items.map((item) => (
                    <DocsSearchResultItem
                      key={item.id}
                      item={item}
                      onSelect={() => selectItem(item)}
                    />
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
          <div className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center gap-2 rounded-b-xl border-t border-neutral-100 bg-neutral-50 px-4 text-xs font-medium text-muted-foreground dark:border-neutral-700 dark:bg-neutral-800">
            <CommandMenuKbd>
              <CornerDownLeft aria-hidden="true" />
            </CommandMenuKbd>
            Go to Page
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}

function DocsSearchResultItem({
  item,
  onSelect,
}: {
  item: SearchItemType;
  onSelect: () => void;
}) {
  if (item.type === "action") {
    return (
      <CommandItem
        value={item.id}
        className={resultItemClassName()}
        onSelect={onSelect}
      >
        {item.node}
      </CommandItem>
    );
  }

  const registryKind = getRegistrySearchKindFromId(item.id);
  const isRegistryItem = Boolean(registryKind);

  return (
    <CommandItem
      value={item.id}
      className={resultItemClassName(isRegistryItem ? "registry" : "result")}
      onSelect={onSelect}
    >
      {isRegistryItem ? (
        <RegistryResultIcon kind={registryKind ?? undefined} />
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
        {!isRegistryItem && item.breadcrumbs?.length ? (
          <span className="flex min-w-0 items-center gap-1 truncate text-xs font-normal text-muted-foreground">
            {item.breadcrumbs.map((breadcrumb, index) => (
              <span key={index} className="min-w-0 truncate">
                {breadcrumb}
              </span>
            ))}
          </span>
        ) : null}
        <span
          className={cn(
            "min-w-0 text-foreground [&_mark]:rounded-sm [&_mark]:bg-transparent [&_mark]:font-medium [&_mark]:text-foreground",
            isRegistryItem
              ? "truncate text-sm font-medium leading-5"
              : "line-clamp-2 text-sm font-medium leading-5",
          )}
        >
          {renderContent(item.content)}
        </span>
      </span>
    </CommandItem>
  );
}

function RegistryResultIcon({ kind }: { kind?: RegistrySearchKind }) {
  if (kind === "hook") {
    return (
      <Braces
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    );
  }

  return (
    <Component
      className="size-4 shrink-0 text-muted-foreground"
      aria-hidden="true"
    />
  );
}

function CommandMenuKbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "pointer-events-none flex h-5 min-w-5 items-center justify-center gap-1 rounded border bg-background px-1 font-sans text-[0.7rem] font-medium text-muted-foreground shadow-sm select-none [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

type SearchCommandGroup = {
  heading: string;
  items: SearchItemType[];
};

function getCommandGroups(
  items: SearchItemType[] | null | undefined,
  search: string,
) {
  const groups = new Map<string, SearchCommandGroup>();

  if (!items) {
    return [];
  }

  const hasSearch = search.trim().length > 0;

  for (const item of items) {
    const heading = getCommandGroupHeading(item, hasSearch);
    const group = groups.get(heading);

    if (group) {
      group.items.push(item);
    } else {
      groups.set(heading, { heading, items: [item] });
    }
  }

  return Array.from(groups.values());
}

function getCommandGroupHeading(item: SearchItemType, hasSearch: boolean) {
  if (item.type === "action") {
    return "Actions";
  }

  const registryKind = getRegistrySearchKindFromId(item.id);

  if (registryKind === "component") {
    return "Components";
  }

  if (registryKind === "hook") {
    return "Hooks";
  }

  return hasSearch ? "Search Results" : "Pages";
}

function resultItemClassName(variant: "registry" | "result" = "result") {
  return cn(
    "w-full border-0 bg-transparent px-2.5! text-left font-medium transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground hover:bg-accent/60 [&>svg:last-child]:hidden",
    variant === "registry"
      ? "h-9 items-center gap-2.5 py-0!"
      : "min-h-9 items-start gap-3 py-2!",
  );
}

function renderContent(content: ReactNode) {
  if (typeof content === "string") {
    return <span dangerouslySetInnerHTML={{ __html: content }} />;
  }

  return content;
}
