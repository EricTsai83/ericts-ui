import type { SortedResult } from "fumadocs-core/search";

import {
  getRegistryKindFromCategory,
  getRegistryKindFromSearchId,
  getRegistryKindGroupLabel,
  getRegistryKindSearchId,
  registryKindRank,
  type RegistryKind,
} from "@/lib/registry-kind";
import { registryItems } from "@/lib/registry";

const REGISTRY_RESULT_LIMIT = 8;

export type RegistrySearchKind = RegistryKind;

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
      const kind = getRegistryKindFromCategory(item.category);

      if (!kind) {
        return [];
      }

      const title = item.title ?? item.name;
      const score = getRegistryItemScore({
        query: normalizedQuery,
        title,
        name: item.name,
        category: item.category,
        searchTerms: item.searchTerms,
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
            id: getRegistryKindSearchId(kind, item.name),
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
      const kind = getRegistryKindFromCategory(item.category);

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
        registryKindRank[a.kind] - registryKindRank[b.kind] ||
        a.title.localeCompare(b.title),
    )
    .map((item): SortedResult => {
      return {
        id: getRegistryKindSearchId(item.kind, item.item.name),
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
  return getRegistryKindFromSearchId(id);
}

function getRegistryItemSection(category: string) {
  const kind = getRegistryKindFromCategory(category);

  return kind ? getRegistryKindGroupLabel(kind) : "Components";
}

function sortRegistrySearchEntries(
  a: RegistrySearchEntry,
  b: RegistrySearchEntry,
) {
  return (
    b.score - a.score ||
    registryKindRank[a.kind] - registryKindRank[b.kind] ||
    a.title.localeCompare(b.title)
  );
}

export function getRegistryItemScore({
  query,
  title,
  name,
  category,
  searchTerms,
}: {
  query: string;
  title: string;
  name: string;
  category: string;
  searchTerms?: string[];
}) {
  const normalizedName = normalizeSearchText(name);
  const normalizedTitle = normalizeSearchText(title);
  const normalizedCategory = normalizeSearchText(category);
  const normalizedSearchTerms = (searchTerms ?? [])
    .map(normalizeSearchText)
    .filter(Boolean);
  const searchableText = [
    normalizedName,
    normalizedTitle,
    normalizedCategory,
    ...normalizedSearchTerms,
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

  if (normalizedSearchTerms.some((term) => term === query)) {
    return 55;
  }

  if (normalizedSearchTerms.some((term) => term.startsWith(query))) {
    return 50;
  }

  if (normalizedSearchTerms.some((term) => term.includes(query))) {
    return 45;
  }

  if (normalizedCategory.includes(query)) {
    return 40;
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
