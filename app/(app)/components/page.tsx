import type { Metadata } from "next";

import {
  RegistryItemsBrowser,
  type RegistryListItem,
} from "@/components/registry-items-browser";
import { getRegistryItemsByCategory } from "@/lib/registry";
import { getRegistryDisplayItems } from "@/lib/registry-display";

export const metadata: Metadata = {
  title: "Components",
  description: "All the components available in the registry.",
};

export default function ComponentsPage() {
  const registryComponents = getRegistryItemsByCategory("ui").sort((a, b) =>
    (a.title ?? a.name).localeCompare(b.title ?? b.name),
  );
  const components: RegistryListItem[] = registryComponents.map((component) => ({
    name: component.name,
    title: component.title,
    description: component.description,
    category: component.category,
    categories: component.categories,
    meta: component.meta,
    hasCssOnly: component.hasCssOnly,
    searchTerms: component.searchTerms,
    href: component.href,
  }));
  const firstFullscreenHref = getRegistryDisplayItems("component").find(
    (component) => component.browsable !== false,
  )?.viewHref;

  return (
    <main className="mx-auto flex min-w-0 w-full max-w-5xl flex-col px-6 py-10 sm:px-8 lg:px-10">
      <RegistryItemsBrowser
        items={components}
        title="Components"
        description="Here you can find the installable UI components available in the registry."
        searchInputId="components-search"
        searchLabel="Search components"
        searchPlaceholder="Search by name, category, or effect..."
        itemLabel="component"
        itemLabelPlural="components"
        emptyTitle="No components found"
        emptyDescription="Try a different name, category, or effect."
        noItemsLabel="No components yet."
        fullscreenHref={firstFullscreenHref}
        fullscreenLabel="Browse Full Screen"
      />
    </main>
  );
}
