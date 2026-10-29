import type { RegistryBrowseOrder } from "@/lib/registry-browse-order";

export type RegistryBrowseNavigation<T> = {
  previous?: T;
  next?: T;
  previousCategory?: T;
  nextCategory?: T;
};

export type RegistryBrowseNavigationPlans<T> = Record<
  RegistryBrowseOrder,
  RegistryBrowseNavigation<T>
>;

/** Compact indices into the single items payload, rather than duplicate item objects. */
export type RegistryListBrowsePlan = {
  sequences: Record<RegistryBrowseOrder, string[]>;
  groups: {
    category: string;
    label: string;
    description?: string;
    names: string[];
  }[];
};
