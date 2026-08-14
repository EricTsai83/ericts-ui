export type RegistryKind = "component" | "hook" | "block";

type RegistryKindDefinition = {
  kind: RegistryKind;
  /** URL segment this kind's routes live under: `/components/otp-input`. */
  segment: string;
  /** The `category` `lib/registry` derives for this kind's registry items. */
  registryCategory: string;
  groupLabel: string;
};

/**
 * What each kind is called, where it lives, and the order kinds rank in. Every
 * other mapping between the three vocabularies — display kind, URL segment,
 * registry category — is derived from this table, because they used to be
 * spelled out separately in `getHref`, in the item page's back-link map, and in
 * three copied route directories, so adding a kind meant finding all of them.
 *
 * Declaration order is rank order: components lead search results, then hooks,
 * then blocks.
 */
const registryKinds = [
  {
    kind: "component",
    segment: "components",
    registryCategory: "ui",
    groupLabel: "Components",
  },
  {
    kind: "hook",
    segment: "hooks",
    registryCategory: "hooks",
    groupLabel: "Hooks",
  },
  {
    kind: "block",
    segment: "blocks",
    registryCategory: "blocks",
    groupLabel: "Blocks",
  },
] as const satisfies readonly RegistryKindDefinition[];

const registryKindsByKind = Object.fromEntries(
  registryKinds.map((definition) => [definition.kind, definition]),
) as Record<RegistryKind, RegistryKindDefinition>;

export const registryKindSegments = registryKinds.map(
  (definition) => definition.segment,
);

export const registryKindRank = Object.fromEntries(
  registryKinds.map((definition, index) => [definition.kind, index]),
) as Record<RegistryKind, number>;

export function getRegistryKindFromCategory(
  category: string,
): RegistryKind | null {
  return (
    registryKinds.find(
      (definition) => definition.registryCategory === category,
    )?.kind ?? null
  );
}

export function getRegistryKindFromSegment(
  segment: string,
): RegistryKind | null {
  return (
    registryKinds.find((definition) => definition.segment === segment)?.kind ??
    null
  );
}

export function getRegistryKindFromSearchId(id: string): RegistryKind | null {
  return (
    registryKinds.find((definition) => id.startsWith(`${definition.kind}-`))
      ?.kind ?? null
  );
}

export function getRegistryKindSearchId(kind: RegistryKind, name: string) {
  return `${kind}-${name}`;
}

export function getRegistryKindSegment(kind: RegistryKind) {
  return registryKindsByKind[kind].segment;
}

export function getRegistryKindRegistryCategory(kind: RegistryKind) {
  return registryKindsByKind[kind].registryCategory;
}

export function getRegistryKindGroupLabel(kind: RegistryKind) {
  return registryKindsByKind[kind].groupLabel;
}
