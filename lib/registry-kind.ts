export type RegistryKind = "component" | "hook" | "block";

export const registryKindRank: Record<RegistryKind, number> = {
  component: 0,
  hook: 1,
  block: 2,
};

const registryKindLabels: Record<RegistryKind, string> = {
  component: "UI",
  hook: "Hook",
  block: "Block",
};

const registryKindGroupLabels: Record<RegistryKind, string> = {
  component: "Components",
  hook: "Hooks",
  block: "Blocks",
};

export function getRegistryKindFromCategory(
  category: string,
): RegistryKind | null {
  if (category === "blocks") {
    return "block";
  }

  if (category === "hooks") {
    return "hook";
  }

  if (category === "ui") {
    return "component";
  }

  return null;
}

export function getRegistryKindFromSearchId(id: string): RegistryKind | null {
  if (id.startsWith("component-")) {
    return "component";
  }

  if (id.startsWith("hook-")) {
    return "hook";
  }

  if (id.startsWith("block-")) {
    return "block";
  }

  return null;
}

export function getRegistryKindSearchId(kind: RegistryKind, name: string) {
  return `${kind}-${name}`;
}

export function getRegistryKindLabel(kind: RegistryKind) {
  return registryKindLabels[kind];
}

export function getRegistryKindGroupLabel(kind: RegistryKind) {
  return registryKindGroupLabels[kind];
}
