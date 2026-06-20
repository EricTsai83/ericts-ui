import type { Metadata } from "next";

import {
  RegistryItemsBrowser,
  type RegistryListItem,
} from "@/components/registry-items-browser";
import { getRegistryItemsByCategory } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Components",
  description: "All the components available in the registry.",
};

export default function ComponentsPage() {
  const components: RegistryListItem[] = getRegistryItemsByCategory("ui")
    .sort((a, b) => (a.title ?? a.name).localeCompare(b.title ?? b.name))
    .map((component) => ({
      name: component.name,
      title: component.title,
      description: component.description,
      category: component.category,
      href: component.href,
    }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10 xl:px-12">
      <RegistryItemsBrowser
        items={components}
        title="Components"
        description="Here you can find the installable UI components available in the registry."
        searchInputId="components-search"
        searchLabel="Search components"
        searchPlaceholder="Search by name, category, or description..."
        itemLabel="component"
        itemLabelPlural="components"
        emptyTitle="No components found"
        emptyDescription="Try a different name, category, or description."
        noItemsLabel="No components yet."
      />
    </main>
  );
}
