import { describe, expect, it } from "vitest";

import { searchRegistryItems } from "@/lib/component-search";

describe("searchRegistryItems", () => {
  it("returns an empty array for an empty query", () => {
    expect(searchRegistryItems("")).toEqual([]);
  });

  it("ranks an exact title match first", () => {
    const results = searchRegistryItems("copy button");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].url).toBe("/components/copy-button");
  });

  it("does not throw on regex-special characters in the query", () => {
    expect(() => searchRegistryItems("c++ (unmatched)")).not.toThrow();
    expect(Array.isArray(searchRegistryItems("c++ (unmatched)"))).toBe(true);
  });
});
