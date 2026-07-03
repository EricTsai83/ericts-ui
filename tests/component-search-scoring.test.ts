import { describe, expect, it } from "vitest";

import {
  getRegistryItemScore,
  searchRegistryItems,
} from "@/lib/component-search";

type ScoreCase = {
  name: string;
  query: string;
  itemName: string;
  title: string;
  category: string;
  searchTerms: string[];
  expected: number;
};

const cases: ScoreCase[] = [
  {
    name: "exact name/title match",
    query: "copy button",
    itemName: "copy button",
    title: "Copy Button",
    category: "button",
    searchTerms: [],
    expected: 100,
  },
  {
    name: "prefix name/title match",
    query: "copy",
    itemName: "copy button",
    title: "Copy Button",
    category: "button",
    searchTerms: [],
    expected: 80,
  },
  {
    name: "name/title includes match",
    query: "py but",
    itemName: "copy button",
    title: "Copy Button",
    category: "button",
    searchTerms: [],
    expected: 60,
  },
  {
    name: "regression: exact search term beats category substring",
    query: "pill",
    itemName: "status marker",
    title: "status marker",
    category: "pill group",
    searchTerms: ["pill"],
    expected: 55,
  },
  {
    name: "prefix search term beats category substring",
    query: "pil",
    itemName: "status marker",
    title: "status marker",
    category: "pill group",
    searchTerms: ["pillar"],
    expected: 50,
  },
  {
    name: "search term includes beats category substring",
    query: "ill",
    itemName: "status marker",
    title: "status marker",
    category: "pill group",
    searchTerms: ["pillar"],
    expected: 45,
  },
  {
    name: "category substring only",
    query: "pill",
    itemName: "status marker",
    title: "status marker",
    category: "pill group",
    searchTerms: [],
    expected: 40,
  },
  {
    name: "all-words fallback",
    query: "status group",
    itemName: "status marker",
    title: "status marker",
    category: "pill group",
    searchTerms: [],
    expected: 20,
  },
  {
    name: "no match",
    query: "zzz",
    itemName: "status marker",
    title: "status marker",
    category: "pill group",
    searchTerms: [],
    expected: 0,
  },
];

describe("getRegistryItemScore", () => {
  for (const testCase of cases) {
    it(`${testCase.name} -> ${testCase.expected}`, () => {
      const score = getRegistryItemScore({
        query: testCase.query,
        name: testCase.itemName,
        title: testCase.title,
        category: testCase.category,
        searchTerms: testCase.searchTerms,
      });

      expect(score).toBe(testCase.expected);
    });
  }
});

describe("searchRegistryItems integration", () => {
  it("still ranks the copy button component first for its own name", () => {
    const results = searchRegistryItems("copy button");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].url).toBe("/components/copy-button");
  });
});
