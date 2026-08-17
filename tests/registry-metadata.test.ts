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
});
