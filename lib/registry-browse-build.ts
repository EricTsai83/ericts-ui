import "server-only";

import type {
  RegistryBrowseNavigationPlans,
  RegistryListBrowsePlan,
} from "@/lib/registry-browse-model";
import { compareRegistryNames } from "@/lib/registry-browse-order";

/** `browsable: false` keeps an item in the list but out of the fullscreen tour. */
export type BrowseBuildItem = {
  name: string;
  title?: string;
  browsable?: boolean;
};
export type BrowseBuildGroup<T> = {
  category: string;
  label: string;
  description?: string;
  items: T[];
};

const isBrowsable = (item: BrowseBuildItem) => item.browsable !== false;

/**
 * Build-time compiler for one registry kind. The list shows every item and the
 * fullscreen tour walks the browsable subset; both are filtered from the same
 * sorted sequences, so they cannot disagree about order.
 */
export function buildRegistryBrowseModel<
  G extends BrowseBuildGroup<BrowseBuildItem>,
  T extends BrowseBuildItem = G["items"][number],
>(sourceGroups: G[], expectedNames: readonly string[]) {
  const categories = new Set<string>();
  const names = new Set<string>();
  const expected = new Set(expectedNames);
  if (expected.size !== expectedNames.length)
    throw new Error("Duplicate expected registry item");
  const listGroups: (Omit<G, "items"> & { items: T[] })[] = sourceGroups
    .filter((group) => group.items.length > 0)
    .map((group) => {
      if (categories.has(group.category))
        throw new Error(`Duplicate registry category: ${group.category}`);
      categories.add(group.category);
      for (const item of group.items) {
        if (names.has(item.name))
          throw new Error(`Duplicate registry item: ${item.name}`);
        if (!expected.has(item.name))
          throw new Error(`Unexpected registry item: ${item.name}`);
        names.add(item.name);
      }
      return {
        ...group,
        items: ([...group.items] as T[]).sort(compareRegistryNames),
      };
    });
  for (const name of expected) {
    if (!names.has(name)) throw new Error(`Missing registry item: ${name}`);
  }
  const listCategory = listGroups.flatMap((group) => group.items);
  const listAlphabetical = [...listCategory].sort(compareRegistryNames);

  const groups = listGroups
    .map((group) => ({ ...group, items: group.items.filter(isBrowsable) }))
    .filter((group) => group.items.length > 0);
  const sequences = {
    alphabetical: listAlphabetical.filter(isBrowsable),
    category: listCategory.filter(isBrowsable),
  };
  const categoryLinks = new Map<
    string,
    { previousCategory?: T; nextCategory?: T }
  >();
  groups.forEach((group, index) => {
    const previousCategory =
      groups.length > 1
        ? groups[(index - 1 + groups.length) % groups.length].items[0]
        : undefined;
    const nextCategory =
      groups.length > 1
        ? groups[(index + 1) % groups.length].items[0]
        : undefined;
    group.items.forEach((item) =>
      categoryLinks.set(item.name, { previousCategory, nextCategory }),
    );
  });
  const navigation = new Map<string, RegistryBrowseNavigationPlans<T>>();
  sequences.alphabetical.forEach((item) =>
    navigation.set(item.name, { alphabetical: {}, category: {} }),
  );
  for (const order of ["alphabetical", "category"] as const) {
    const items = sequences[order];
    items.forEach((item, index) => {
      navigation.get(item.name)![order] = {
        previous:
          items.length > 1
            ? items[(index - 1 + items.length) % items.length]
            : undefined,
        next: items.length > 1 ? items[(index + 1) % items.length] : undefined,
        ...categoryLinks.get(item.name),
      };
    });
  }
  const listPlan: RegistryListBrowsePlan = {
    sequences: {
      alphabetical: listAlphabetical.map((item) => item.name),
      category: listCategory.map((item) => item.name),
    },
    groups: listGroups.map(({ items, ...group }) => ({
      ...group,
      names: items.map((item) => item.name),
    })),
  };
  return { groups, sequences, navigation, listPlan };
}
