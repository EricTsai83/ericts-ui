"use client";

import * as React from "react";
import type { Folder, Root } from "fumadocs-core/page-tree";
import { BookOpen, Check, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { buildDocsGroups } from "@/lib/docs-navigation";
import { cn } from "@/lib/utils";
import { isPathActive, NavLink } from "@/registry/base/ui/nav-link";

export function MobileDocsNavigation({ tree }: { tree: Root | Folder }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const groups = buildDocsGroups(tree);
  const currentItem = groups
    .flatMap((group) => group.items)
    .find((item) => isPathActive(pathname, item.url, "exact"));

  return (
    <div className="sticky top-14 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
      <div className="mx-auto flex h-11 w-full max-w-7xl items-center px-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-full justify-start px-2 text-left"
                aria-label="Browse documentation pages"
              />
            }
          >
            <BookOpen data-icon="inline-start" />
            <span className="shrink-0 text-muted-foreground">Docs</span>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <span className="min-w-0 flex-1 truncate">
              {currentItem?.title ?? "Browse articles"}
            </span>
            <ChevronDown
              data-icon="inline-end"
              aria-hidden="true"
              className={cn(
                "transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
                open && "rotate-180",
              )}
            />
          </PopoverTrigger>

          <PopoverContent
            align="start"
            sideOffset={6}
            collisionPadding={16}
            className="max-h-[min(70dvh,32rem)] w-[calc(100vw-2rem)] gap-0 overflow-y-auto p-2"
          >
            <PopoverHeader className="px-2 pt-1 pb-2">
              <PopoverTitle>Documentation</PopoverTitle>
            </PopoverHeader>

            <nav aria-label="Documentation pages" className="flex flex-col gap-3">
              {groups.map((group) => (
                <section key={group.title} className="flex flex-col gap-1">
                  <h2 className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {group.title}
                  </h2>
                  {group.items.map((item) => (
                    <NavLink
                      key={`${group.title}-${item.url}-${String(item.title)}`}
                      href={item.url}
                      match="exact"
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none",
                          isActive && "bg-muted font-medium",
                          item.disabled && "pointer-events-none opacity-35",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="min-w-0 flex-1 truncate">
                            {item.title}
                          </span>
                          {isActive ? (
                            <Check
                              aria-hidden="true"
                              className="size-4 shrink-0"
                            />
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  ))}
                </section>
              ))}
            </nav>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
