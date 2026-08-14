import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  RegistryItemsBrowser,
  type RegistryListItem,
} from "@/components/registry-items-browser";
import { getRegistryItemsByCategory } from "@/lib/registry";
import {
  getRegistryDisplayCategories,
  getRegistryDisplayCategoryDetails,
  getRegistryDisplayItems,
} from "@/lib/registry-display";
import {
  getRegistryKindFromSegment,
  getRegistryKindRegistryCategory,
  registryKindSegments,
  type RegistryKind,
} from "@/lib/registry-kind";

type PageProps = {
  params: Promise<{
    kind: string;
  }>;
};

/**
 * The copy that differs per kind. It is the only thing that ever did — these
 * three lists were once three route directories whose 72 lines matched
 * line-for-line apart from these strings, so a new field on the cards had to be
 * added three times and nothing complained when it was added twice.
 */
const registryKindPages = {
  component: {
    title: "Components",
    metaDescription: "All the components available in the registry.",
    description:
      "Here you can find the installable UI components available in the registry.",
    emptyTitle: "No components found",
    noItemsLabel: "No components yet.",
    itemLabel: "component",
    itemLabelPlural: "components",
    // Written out per kind rather than composed, so Tailwind still sees whole
    // class names and the two layouts stay exactly what they were.
    containerClassName:
      "mx-auto flex min-w-0 w-full max-w-5xl flex-col px-6 py-10 sm:px-8 lg:px-10",
    fullscreen: true,
  },
  hook: {
    title: "Hooks",
    metaDescription: "All the hooks available in the registry.",
    description: "Client-safe React hooks available in the registry.",
    emptyTitle: "No hooks found",
    noItemsLabel: "No hooks yet.",
    itemLabel: "hook",
    itemLabelPlural: "hooks",
    containerClassName:
      "mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10 xl:px-12",
    fullscreen: false,
  },
  block: {
    title: "Blocks",
    metaDescription: "Browse installable blocks in the registry.",
    description: "Installable registry blocks will appear here.",
    emptyTitle: "No blocks found",
    noItemsLabel: "No blocks yet.",
    itemLabel: "block",
    itemLabelPlural: "blocks",
    containerClassName:
      "mx-auto flex w-full max-w-7xl flex-col px-6 py-10 sm:px-8 lg:px-10 xl:px-12",
    fullscreen: false,
  },
} as const satisfies Record<RegistryKind, unknown>;

// `/[kind]` sits at the root, so without this any unknown top-level path would
// render an empty list instead of the 404 it is.
export const dynamicParams = false;

export function generateStaticParams() {
  return registryKindSegments.map((segment) => ({ kind: segment }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { kind: segment } = await params;
  const kind = getRegistryKindFromSegment(segment);

  if (!kind) {
    return {};
  }

  return {
    title: registryKindPages[kind].title,
    description: registryKindPages[kind].metaDescription,
  };
}

export default async function RegistryKindPage({ params }: PageProps) {
  const { kind: segment } = await params;
  const kind = getRegistryKindFromSegment(segment);

  if (!kind) {
    notFound();
  }

  const page = registryKindPages[kind];
  const displayItems = getRegistryDisplayItems(kind);
  const displayItemsByName = new Map(
    displayItems.map((item) => [item.name, item]),
  );
  const displayCategoryLabels = new Map(
    getRegistryDisplayCategoryDetails(kind).map((category) => [
      category.slug,
      category.label,
    ]),
  );
  const items: RegistryListItem[] = getRegistryItemsByCategory(
    getRegistryKindRegistryCategory(kind),
  )
    .sort((a, b) => (a.title ?? a.name).localeCompare(b.title ?? b.name))
    .map((item) => {
      const displayItem = displayItemsByName.get(item.name);

      return {
        name: item.name,
        title: item.title,
        description: item.description,
        category: item.category,
        categories: item.categories,
        groupCategory: displayItem?.category,
        groupLabel: displayItem
          ? displayCategoryLabels.get(displayItem.category)
          : undefined,
        meta: item.meta,
        hasCssOnly: item.hasCssOnly,
        searchTerms: item.searchTerms,
        href: item.href,
      };
    });
  const fullscreenHref = page.fullscreen
    ? displayItems.find((item) => item.browsable !== false)?.viewHref
    : undefined;

  return (
    <main className={page.containerClassName}>
      <RegistryItemsBrowser
        items={items}
        title={page.title}
        description={page.description}
        searchInputId={`${segment}-search`}
        searchLabel={`Search ${page.itemLabelPlural}`}
        searchPlaceholder="Search by name, category, or effect..."
        itemLabel={page.itemLabel}
        itemLabelPlural={page.itemLabelPlural}
        emptyTitle={page.emptyTitle}
        emptyDescription="Try a different name, category, or effect."
        noItemsLabel={page.noItemsLabel}
        enableArrangement
        arrangementStorageKey={`ericts-ui:${segment}:arrangement`}
        categoryOrder={getRegistryDisplayCategories(kind)}
        fullscreenHref={fullscreenHref}
        fullscreenLabel="Browse Full Screen"
      />
    </main>
  );
}
