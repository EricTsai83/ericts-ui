"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";

export type ComponentListItem = {
  name: string;
  title?: string;
  description?: string;
  category: string;
  href: string;
};

function getDisplayName(component: ComponentListItem) {
  return component.title ?? component.name;
}

export function ComponentsBrowser({
  components,
}: {
  components: ComponentListItem[];
}) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  const filteredComponents = useMemo(() => {
    if (!normalizedQuery) {
      return components;
    }

    return components.filter((component) => {
      const primarySearchableText = [
        component.title,
        component.name,
        component.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (primarySearchableText.includes(normalizedQuery)) {
        return true;
      }

      if (normalizedQuery.length < 2) {
        return false;
      }

      return (component.description ?? "")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [components, normalizedQuery]);

  const resultLabel =
    filteredComponents.length === components.length
      ? `${components.length} components`
      : `${filteredComponents.length} of ${components.length} components`;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 border-b pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-end">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
          <p className="text-base leading-7 text-muted-foreground sm:text-lg">
            Here you can find all the components available in the library. We
            are working on adding more components.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="components-search"
            className="text-sm font-medium text-foreground"
          >
            Search components
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="components-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, category, or description..."
              className="h-11 bg-background pl-10 pr-10 shadow-none hover:border-foreground/30"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Clear component search"
                title="Clear search"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
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
              onClick={() => setQuery("")}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" aria-hidden="true" />
              Clear
            </button>
          ) : null}
        </div>

        {components.length > 0 ? (
          filteredComponents.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredComponents.map((component) => (
                <Link
                  key={component.name}
                  href={component.href}
                  className="text-lg font-medium text-foreground underline-offset-4 transition-colors hover:text-muted-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {getDisplayName(component)}
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-6 py-12 text-center">
              <div className="flex max-w-sm flex-col gap-1">
                <h3 className="font-medium">No components found</h3>
                <p className="text-sm text-muted-foreground">
                  Try a different name, category, or description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" aria-hidden="true" />
                Clear search
              </button>
            </div>
          )
        ) : (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No components yet.
          </div>
        )}
      </section>
    </div>
  );
}
