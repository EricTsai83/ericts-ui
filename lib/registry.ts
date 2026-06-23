import registry from "@/registry.json";

type RegistryFile = {
  path: string;
  type: string;
  target?: string;
};

export type RegistryItemMeta = {
  tags?: string[];
  effects?: string[];
  cssOnly?: boolean;
};

type RegistrySourceItem = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  categories?: string[];
  meta?: RegistryItemMeta;
  registryDependencies?: string[];
  dependencies?: string[];
  files?: RegistryFile[];
};

export type RegistryItem = RegistrySourceItem & {
  category: string;
  hasCssOnly: boolean;
  href: string;
  registryUrl: string;
  searchTerms: string[];
};

function getCategory(item: RegistrySourceItem) {
  const files = item.files ?? [];

  if (
    item.type === "registry:block" ||
    files.some((file) => file.path.includes("/blocks/"))
  ) {
    return "blocks";
  }

  if (
    files.some(
      (file) => file.path.includes("/ui/") || file.type === "registry:ui"
    )
  ) {
    return "ui";
  }

  if (
    files.some(
      (file) => file.path.includes("/hooks/") || file.type === "registry:hook"
    )
  ) {
    return "hooks";
  }

  return item.type.replace("registry:", "");
}

const registrySourceItems = registry.items as RegistrySourceItem[];

function hasCssOnlySupport(item: RegistrySourceItem) {
  return Boolean(item.meta?.cssOnly);
}

function getSearchTerms(item: RegistrySourceItem, category: string) {
  const cssOnly = hasCssOnlySupport(item);

  return uniqueStrings([
    item.name,
    item.title,
    category,
    ...(item.categories ?? []),
    ...(item.meta?.effects ?? []),
    ...(cssOnly
      ? ["css-only alternative", "css alternative", "css-only", "css version"]
      : []),
  ]);
}

function getHref(item: RegistrySourceItem, category: string) {
  if (category === "hooks") {
    return `/hooks/${item.name}`;
  }

  if (category === "blocks") {
    return `/blocks/${item.name}`;
  }

  return `/components/${item.name}`;
}

export const registryItems: RegistryItem[] = registrySourceItems.map((item) => {
  const category = getCategory(item);

  return {
    ...item,
    category,
    hasCssOnly: hasCssOnlySupport(item),
    href: getHref(item, category),
    registryUrl: `/r/${item.name}.json`,
    searchTerms: getSearchTerms(item, category),
  };
});

export function getRegistryItem(name: string) {
  return registryItems.find((item) => item.name === name);
}

export function getRegistryItemsByCategory(category: string) {
  return registryItems.filter((item) => item.category === category);
}

export function getRegistryCategories() {
  return Array.from(new Set(registryItems.map((item) => item.category)));
}

export function getRegistryItemFacets(items: RegistryItem[] = registryItems) {
  return uniqueStrings(items.flatMap((item) => item.categories ?? [])).sort(
    (a, b) => a.localeCompare(b),
  );
}

export function getRegistryItemBadges(item: RegistryItem, limit = 5) {
  const badges = uniqueStrings([
    item.categories?.[0],
    item.meta?.effects?.[0],
    item.hasCssOnly ? "CSS-only alternative" : undefined,
  ]);

  return {
    visible: badges.slice(0, limit),
    hiddenCount: Math.max(0, badges.length - limit),
  };
}

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value))),
  );
}
