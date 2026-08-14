import type { Metadata } from "next";

import {
  RegistryItemsBrowser,
  type RegistryListItem,
} from "@/components/registry-items-browser";
import { getRegistryItemsByCategory } from "@/lib/registry";
import {
  getRegistryDisplayCategoryDetails,
  getRegistryDisplayItems,
} from "@/lib/registry-display";

export const metadata: Metadata = {
  title: "Hooks",
  description: "All the hooks available in the registry.",
};

export default function HooksPage() {
  const displayItems = getRegistryDisplayItems("hook");
  const displayItemsByName = new Map(
    displayItems.map((item) => [item.name, item]),
  );
  const displayCategoryLabels = new Map(
    getRegistryDisplayCategoryDetails("hook").map((category) => [
      category.slug,
      category.label,
    ]),
  );
  const hooks: RegistryListItem[] = getRegistryItemsByCategory("hooks")
    .sort((a, b) => (a.title ?? a.name).localeCompare(b.title ?? b.name))
    .map((hook) => {
      const displayItem = displayItemsByName.get(hook.name);

      return {
        name: hook.name,
        title: hook.title,
        description: hook.description,
        category: hook.category,
        categories: hook.categories,
        groupCategory: displayItem?.category,
        groupLabel: displayItem
          ? displayCategoryLabels.get(displayItem.category)
          : undefined,
        meta: hook.meta,
        hasCssOnly: hook.hasCssOnly,
        searchTerms: hook.searchTerms,
        href: hook.href,
      };
    });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10 xl:px-12">
      <RegistryItemsBrowser
        items={hooks}
        title="Hooks"
        description="Client-safe React hooks available in the registry."
        searchInputId="hooks-search"
        searchLabel="Search hooks"
        searchPlaceholder="Search by name, category, or effect..."
        itemLabel="hook"
        itemLabelPlural="hooks"
        emptyTitle="No hooks found"
        emptyDescription="Try a different name, category, or effect."
        noItemsLabel="No hooks yet."
        enableArrangement
        arrangementStorageKey="ericts-ui:hooks:arrangement"
      />
    </main>
  );
}
