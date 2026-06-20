import type { SortedResult } from "fumadocs-core/search";

import { registryItems } from "@/lib/registry";

const COMPONENT_RESULT_LIMIT = 8;

type ComponentSearchEntry = {
  score: number;
  result: SortedResult;
};

export function searchComponents(query: string): SortedResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  return registryItems
    .flatMap((item): ComponentSearchEntry[] => {
      const title = item.title ?? item.name;
      const score = getComponentScore({
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
          result: {
            id: `component-${item.name}`,
            type: "page",
            content: highlightText(title, query),
            breadcrumbs: ["Components", item.category],
            url: item.href,
          },
        },
      ];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, COMPONENT_RESULT_LIMIT)
    .map((entry) => entry.result);
}

export function getDefaultComponentSearchItems(): SortedResult[] {
  return [...registryItems]
    .sort((a, b) => (a.title ?? a.name).localeCompare(b.title ?? b.name))
    .map((item) => {
      const title = item.title ?? item.name;

      return {
        id: `component-${item.name}`,
        type: "page",
        content: escapeHtml(title),
        breadcrumbs: ["Components", item.category],
        url: item.href,
      };
    });
}

function getComponentScore({
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
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function highlightText(value: string, query: string) {
  const escapedValue = escapeHtml(value);
  const terms = Array.from(
    new Set(
      query
        .replace(/[-_]/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(escapeRegExp),
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
