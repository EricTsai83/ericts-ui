import type { SortedResult } from "fumadocs-core/search";

import { registryItems } from "@/lib/registry";

const REGISTRY_RESULT_LIMIT = 8;

export type RegistrySearchKind = "component" | "hook";

const registrySearchKindRank: Record<RegistrySearchKind, number> = {
  component: 0,
  hook: 1,
};

type RegistrySearchEntry = {
  score: number;
  kind: RegistrySearchKind;
  title: string;
  result: SortedResult;
};

type DefaultRegistrySearchEntry = {
  item: (typeof registryItems)[number];
  kind: RegistrySearchKind;
  title: string;
};

export function searchRegistryItems(query: string): SortedResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return registryItems
    .flatMap((item): RegistrySearchEntry[] => {
      const kind = getRegistrySearchKind(item.category);

      if (!kind) {
        return [];
      }

      const title = item.title ?? item.name;
      const score = getRegistryItemScore({
        query: normalizedQuery,
        title,
        name: item.name,
        category: item.category,
        description: item.description,
      });

      if (score === 0) {
        return [];
      }

      return [
        {
          score,
          kind,
          title,
          result: {
            id: getRegistrySearchId(kind, item.name),
            type: "page",
            content: highlightText(title, query),
            breadcrumbs: [getRegistryItemSection(item.category)],
            url: item.href,
          },
        },
      ];
    })
    .sort((a, b) => sortRegistrySearchEntries(a, b))
    .slice(0, REGISTRY_RESULT_LIMIT)
    .map((entry) => entry.result);
}

export function getDefaultRegistrySearchItems(): SortedResult[] {
  return [...registryItems]
    .flatMap((item): DefaultRegistrySearchEntry[] => {
      const kind = getRegistrySearchKind(item.category);

      if (!kind) {
        return [];
      }

      return [
        {
          item,
          kind,
          title: item.title ?? item.name,
        },
      ];
    })
    .sort(
      (a, b) =>
        registrySearchKindRank[a.kind] - registrySearchKindRank[b.kind] ||
        a.title.localeCompare(b.title),
    )
    .map((item): SortedResult => {
      return {
        id: getRegistrySearchId(item.kind, item.item.name),
        type: "page",
        content: escapeHtml(item.title),
        breadcrumbs: [getRegistryItemSection(item.item.category)],
        url: item.item.href,
      };
    });
}

export function getRegistrySearchKindFromId(
  id: string,
): RegistrySearchKind | null {
  if (id.startsWith("component-")) {
    return "component";
  }

  if (id.startsWith("hook-")) {
    return "hook";
  }

  return null;
}

function getRegistrySearchKind(category: string): RegistrySearchKind | null {
  if (category === "hooks") {
    return "hook";
  }

  if (category === "ui") {
    return "component";
  }

  return null;
}

function getRegistrySearchId(kind: RegistrySearchKind, name: string) {
  return `${kind}-${name}`;
}

function getRegistryItemSection(category: string) {
  if (category === "hooks") {
    return "Hooks";
  }

  return "Components";
}

function sortRegistrySearchEntries(
  a: RegistrySearchEntry,
  b: RegistrySearchEntry,
) {
  return (
    b.score - a.score ||
    registrySearchKindRank[a.kind] - registrySearchKindRank[b.kind] ||
    a.title.localeCompare(b.title)
  );
}

function getRegistryItemScore({
  query,
  title,
  name,
  category,
  description,
}: {
  query: string;
  title: string;
  name: string;
  category: string;
  description?: string;
}) {
  const normalizedName = normalizeSearchText(name);
  const normalizedTitle = normalizeSearchText(title);
  const normalizedCategory = normalizeSearchText(category);
  const normalizedDescription = normalizeSearchText(description ?? "");
  const searchableText = [
    normalizedName,
    normalizedTitle,
    normalizedCategory,
    normalizedDescription,
  ].join(" ");

  if (normalizedName === query || normalizedTitle === query) {
    return 100;
  }

  if (normalizedName.startsWith(query) || normalizedTitle.startsWith(query)) {
    return 80;
  }

  if (normalizedName.includes(query) || normalizedTitle.includes(query)) {
    return 60;
  }

  if (normalizedCategory.includes(query)) {
    return 40;
  }

  if (normalizedDescription.includes(query)) {
    return 30;
  }

  if (query.split(" ").every((term) => searchableText.includes(term))) {
    return 20;
  }

  return 0;
}

function normalizeSearchText(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function highlightText(value: string, query: string) {
  const escapedValue = escapeHtml(value);
  const terms = Array.from(
    new Set(
      normalizeSearchText(query).split(" ").filter(Boolean).map(escapeRegExp),
    ),
  );

  if (terms.length === 0) {
    return escapedValue;
  }

  return escapedValue.replace(
    new RegExp(`(${terms.join("|")})`, "gi"),
    "<mark>$1</mark>",
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
