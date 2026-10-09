import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/search/route";

const { searchDocs, searchRegistry } = vi.hoisted(() => ({
  searchDocs: vi.fn(),
  searchRegistry: vi.fn(),
}));

vi.mock("fumadocs-core/search/server", () => ({
  createFromSource: () => ({ search: searchDocs }),
}));
vi.mock("@/lib/source", () => ({ source: {} }));
vi.mock("@/lib/component-search", () => ({ searchRegistryItems: searchRegistry }));

beforeEach(() => {
  searchDocs.mockReset().mockResolvedValue([{ id: "docs-result" }]);
  searchRegistry.mockReset().mockReturnValue([{ id: "registry-result" }]);
});

describe("public search response caching", () => {
  it("keeps result order and query options while enabling only CDN freshness", async () => {
    const response = await GET(new Request(
      "https://example.com/api/search?query=copy&locale=en&tag=ui,hooks&limit=4&mode=vector",
    ));

    expect(await response.json()).toEqual([
      { id: "registry-result" },
      { id: "docs-result" },
    ]);
    expect(searchDocs).toHaveBeenCalledWith("copy", {
      locale: "en", tag: ["ui", "hooks"], limit: 4, mode: "vector",
    });
    expect(response.headers.get("Cache-Control")).toBe(
      "public, max-age=0, must-revalidate",
    );
    expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe(
      "public, s-maxage=86400",
    );
  });

  it("returns a cacheable empty response without running search for an empty query", async () => {
    const response = await GET(new Request("https://example.com/api/search?query="));

    expect(await response.json()).toEqual([]);
    expect(searchDocs).not.toHaveBeenCalled();
    expect(searchRegistry).not.toHaveBeenCalled();
    expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe(
      "public, s-maxage=86400",
    );
  });

  it("lets search failures propagate instead of turning them into cacheable results", async () => {
    searchDocs.mockRejectedValue(new Error("search failed"));
    await expect(GET(new Request("https://example.com/api/search?query=copy")))
      .rejects.toThrow("search failed");
  });
});
