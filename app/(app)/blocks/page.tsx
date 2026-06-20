import type { Metadata } from "next";

import {
  RegistryItemsBrowser,
  type RegistryListItem,
} from "@/components/registry-items-browser";
import { getRegistryItemsByCategory } from "@/lib/registry";

export const metadata: Metadata = {
  title: "Blocks",
  description: "Browse installable blocks in the registry.",
};

export default function BlocksPage() {
  const blocks: RegistryListItem[] = getRegistryItemsByCategory("blocks")
    .sort((a, b) => (a.title ?? a.name).localeCompare(b.title ?? b.name))
    .map((block) => ({
      name: block.name,
      title: block.title,
      description: block.description,
      category: block.category,
      categories: block.categories,
      meta: block.meta,
      searchTerms: block.searchTerms,
      href: block.href,
    }));

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10 xl:px-12">
      <RegistryItemsBrowser
        items={blocks}
        title="Blocks"
        description="Installable registry blocks will appear here."
        searchInputId="blocks-search"
        searchLabel="Search blocks"
        searchPlaceholder="Search by name, category, effect, or description..."
        itemLabel="block"
        itemLabelPlural="blocks"
        emptyTitle="No blocks found"
        emptyDescription="Try a different name, category, effect, or description."
        noItemsLabel="No blocks yet."
      />
    </main>
  );
}
