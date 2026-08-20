import { describe, expect, it } from "vitest";

import { getRegistryItem } from "@/lib/registry";

describe("registry metadata", () => {
  it("keeps NavLink's name framework-neutral while exposing its requirement", () => {
    const item = getRegistryItem("nav-link");

    expect(item?.title).toBe("Nav Link");
    expect(item?.meta?.tags).toContain("nextjs-only");
    expect(item?.meta?.tags).toContain("pending-state");
    expect(item?.meta?.tags).toContain("typed-routes");
    expect(item?.meta?.tags).toContain("cache-components");
    expect(item?.searchTerms).toContain("nextjs-only");
  });

  it("keeps the Sliding Play Button description free of design credits", () => {
    const item = getRegistryItem("sliding-play-button");

    expect(item?.description).not.toContain("Jhey Tompkins");
    expect(item?.meta?.references).toBeUndefined();
  });
});
