import { describe, expect, it, vi } from "vitest";

import { buildRegistryBrowseModel } from "@/lib/registry-browse-build";
import {
  getRegistryBrowseHref,
  getRegistryBrowseOrder,
  getRegistryPrefetchHref,
} from "@/lib/registry-browse-order";
import { getStaticRegistryBrowseModel } from "@/lib/registry-browse.server";
import { getRegistryDisplayItems } from "@/lib/registry-display";

vi.mock("server-only", () => ({}));

const alpha = { name: "z-slug", title: "Alpha" };
const beta = { name: "a-slug", title: "Beta" };
const gamma = { name: "gamma", title: "Gamma" };
const groups = [
  { category: "first", label: "First", items: [gamma, beta] },
  { category: "second", label: "Second", items: [alpha] },
];
const compile = () =>
  buildRegistryBrowseModel(groups, [alpha.name, beta.name, gamma.name]);

describe("registry browsing order", () => {
  it("rejects duplicated, missing and unknown items before prerendering", () => {
    expect(() =>
      buildRegistryBrowseModel(
        [{ category: "x", label: "X", items: [alpha, alpha] }],
        [alpha.name],
      ),
    ).toThrow("Duplicate registry item");
    expect(() => buildRegistryBrowseModel([], [alpha.name])).toThrow(
      "Missing registry item",
    );
    expect(() => buildRegistryBrowseModel(groups, [alpha.name])).toThrow(
      "Unexpected registry item",
    );
  });
  it("rejects duplicate categories, and produces empty plans for an empty kind", () => {
    expect(() =>
      buildRegistryBrowseModel(
        [
          { category: "x", label: "X", items: [alpha] },
          { category: "x", label: "X", items: [beta] },
        ],
        [alpha.name, beta.name],
      ),
    ).toThrow("Duplicate registry category");
    expect(buildRegistryBrowseModel([], []).listPlan.sequences).toEqual({
      alphabetical: [],
      category: [],
    });
  });
  it("keeps hidden items in the list but out of the fullscreen tour, in the same order", () => {
    const hidden = { name: "hidden", title: "Aardvark", browsable: false };
    const model = buildRegistryBrowseModel(
      [
        { category: "first", label: "First", items: [gamma, hidden, beta] },
        groups[1],
      ],
      [alpha.name, beta.name, gamma.name, hidden.name],
    );
    expect(model.listPlan.sequences).toEqual({
      alphabetical: [hidden.name, alpha.name, beta.name, gamma.name],
      category: [hidden.name, beta.name, gamma.name, alpha.name],
    });
    expect(model.listPlan.groups[0].names).toEqual([
      hidden.name,
      beta.name,
      gamma.name,
    ]);
    expect(model.sequences.alphabetical).toEqual([alpha, beta, gamma]);
    expect(model.groups[0].items).toEqual([beta, gamma]);
    expect(model.navigation.has(hidden.name)).toBe(false);
  });

  it("sorts by displayed title, rather than the registry slug", () => {
    expect(compile().sequences.alphabetical).toEqual([alpha, beta, gamma]);
    expect(groups[0].items).toEqual([gamma, beta]);
  });
  it("preserves taxonomy order and sorts names inside each category", () => {
    expect(compile().sequences.category).toEqual([beta, gamma, alpha]);
    expect(compile().navigation.get(gamma.name)?.category).toMatchObject({
      previous: beta,
      next: alpha,
      nextCategory: alpha,
    });
  });
  it("wraps in both directions and handles a single item", () => {
    expect(compile().navigation.get(alpha.name)?.alphabetical).toMatchObject({
      previous: gamma,
      next: beta,
    });
    expect(
      buildRegistryBrowseModel(
        [{ category: "only", label: "Only", items: [alpha] }],
        [alpha.name],
      ).navigation.get(alpha.name)?.category,
    ).toMatchObject({
      previous: undefined,
      next: undefined,
      nextCategory: undefined,
    });
  });
  it("preserves variant paths and real document anchors, replacing only the order fragment", () => {
    expect(
      getRegistryBrowseHref("/view/base/scan-reveal/css-only", "alphabetical"),
    ).toBe("/view/base/scan-reveal/css-only#order=alphabetical");
    expect(
      getRegistryBrowseHref(
        "/view/base/scan-reveal#order=category",
        "alphabetical",
      ),
    ).toBe("/view/base/scan-reveal#order=alphabetical");
    expect(
      getRegistryBrowseHref("/components/scan-reveal#installation", "category"),
    ).toBe("/components/scan-reveal#installation");
    expect(getRegistryBrowseHref("/components/scan-reveal", null)).toBe(
      "/components/scan-reveal",
    );
  });
  it("reads the order from the fragment only", () => {
    expect(getRegistryBrowseOrder("#order=category")).toBe("category");
    expect(getRegistryBrowseOrder("#order=invalid")).toBeNull();
    expect(getRegistryBrowseOrder("")).toBeNull();
  });
  it("prefetches the canonical static route for either order", () => {
    for (const order of ["alphabetical", "category"] as const) {
      expect(
        getRegistryPrefetchHref(
          getRegistryBrowseHref("/view/base/scan-reveal", order),
        ),
      ).toBe("/view/base/scan-reveal");
    }
  });
  it("uses alphabetical navigation for direct fullscreen URLs too", () => {
    const sorted = getRegistryDisplayItems("component")
      .filter((item) => item.browsable !== false)
      .sort((a, b) => a.title.localeCompare(b.title));
    for (let index = 0; index < sorted.length; index++) {
      const navigation = getStaticRegistryBrowseModel(
        "component",
      ).navigation.get(sorted[index].name)?.alphabetical;
      expect(navigation?.next?.name).toBe(
        sorted[(index + 1) % sorted.length].name,
      );
    }
  });
});
