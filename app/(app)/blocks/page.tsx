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
  title: "Blocks",
  description: "Browse installable blocks in the registry.",
};

export default function BlocksPage() {
  const displayItems = getRegistryDisplayItems("block");
  const displayItemsByName = new Map(
    displayItems.map((item) => [item.name, item]),
  );
  const displayCategoryLabels = new Map(
    getRegistryDisplayCategoryDetails("block").map((category) => [
      category.slug,
      category.label,
    ]),
  );
  const blocks: RegistryListItem[] = getRegistryItemsByCategory("blocks")
    .sort((a, b) => (a.title ?? a.name).localeCompare(b.title ?? b.name))
    .map((block) => {
      const displayItem = displayItemsByName.get(block.name);

      return {
        name: block.name,
        title: block.title,
        description: block.description,
        category: block.category,
        categories: block.categories,
        groupCategory: displayItem?.category,
        groupLabel: displayItem
          ? displayCategoryLabels.get(displayItem.category)
          : undefined,
        meta: block.meta,
        hasCssOnly: block.hasCssOnly,
        searchTerms: block.searchTerms,
        href: block.href,
      };
    });

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10 xl:px-12">
      <RegistryItemsBrowser
        items={blocks}
        title="Blocks"
        description="Installable registry blocks will appear here."
        searchInputId="blocks-search"
        searchLabel="Search blocks"
        searchPlaceholder="Search by name, category, or effect..."
        itemLabel="block"
        itemLabelPlural="blocks"
        emptyTitle="No blocks found"
        emptyDescription="Try a different name, category, or effect."
        noItemsLabel="No blocks yet."
        enableArrangement
        arrangementStorageKey="ericts-ui:blocks:arrangement"
      />
    </main>
  );
}
