import registry from "@/registry.json";

type RegistryFile = {
  path: string;
  type: string;
  target?: string;
};

type RegistrySourceItem = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  files?: RegistryFile[];
};

export type RegistryItem = RegistrySourceItem & {
  category: string;
  href: string;
  registryUrl: string;
};

function getCategory(item: RegistrySourceItem) {
  const files = item.files ?? [];

  if (files.some((file) => file.path.includes("/blocks/"))) {
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

export const registryItems: RegistryItem[] = registrySourceItems.map((item) => ({
  ...item,
  category: getCategory(item),
  href: `/components/${item.name}`,
  registryUrl: `/r/${item.name}.json`,
}));

export function getRegistryItem(name: string) {
  return registryItems.find((item) => item.name === name);
}

export function getRegistryCategories() {
  return Array.from(new Set(registryItems.map((item) => item.category)));
}
