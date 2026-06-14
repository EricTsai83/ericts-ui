import registry from "@/registry.json";

export type RegistryItem = (typeof registry.items)[number] & {
  category: string;
  href: string;
  registryUrl: string;
};

function getCategory(item: (typeof registry.items)[number]) {
  if (item.files.some((file) => file.path.includes("/blocks/"))) {
    return "blocks";
  }

  if (
    item.files.some(
      (file) => file.path.includes("/ui/") || file.type === "registry:ui"
    )
  ) {
    return "ui";
  }

  return item.type.replace("registry:", "");
}

export const registryItems = registry.items.map((item) => ({
  ...item,
  category: getCategory(item),
  href: `/view/base/${item.name}`,
  registryUrl: `/r/${item.name}.json`,
})) satisfies RegistryItem[];

export function getRegistryItem(name: string) {
  return registryItems.find((item) => item.name === name);
}

export function getRegistryCategories() {
  return Array.from(new Set(registryItems.map((item) => item.category)));
}
