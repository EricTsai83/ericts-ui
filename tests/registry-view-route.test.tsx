import type { NextConfig } from "next";
import {
  getRedirectUrl,
  getRewrittenUrl,
  unstable_getResponseFromNextConfig,
} from "next/experimental/testing/server";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import ViewPage, {
  generateStaticParams,
} from "@/app/(view)/view/[style]/[name]/[[...variant]]/page";
import nextConfig from "@/next.config";

vi.mock("fumadocs-mdx/next", () => ({
  createMDX: () => (config: NextConfig) => config,
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

vi.mock("@/components/registry-demo-shell", () => ({
  RegistryDemoShell: ({ variant }: { variant: string }) => (
    <div data-preview-variant={variant} />
  ),
}));

vi.mock("@/lib/registry-display", () => {
  const items = [
    {
      name: "example",
      title: "Example",
      kind: "component",
      defaultVariant: "css-only",
    },
    {
      name: "fallback",
      title: "Fallback",
      kind: "component",
      defaultVariant: "unknown",
    },
    { name: "hidden", title: "Hidden", kind: "component", browsable: false },
  ];
  return {
    getRegistryDisplayItems: () => items,
    getRegistryDisplayItem: (name: string) =>
      items.find((item) => item.name === name),
    getRegistryDisplayNavigation: () => ({}),
    getRegistryDisplayNavigationGroups: () => [],
  };
});

describe("static fullscreen preview routes", () => {
  it("prerenders the default and supported variants, excluding hidden items", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(8);
    expect(
      params
        .filter(({ name }) => name === "example")
        .map(({ variant }) => variant),
    ).toEqual([[], ["motion"], ["css-only"], ["usage"]]);
    expect(params.some(({ name }) => name === "hidden")).toBe(false);
  });

  it.each(["motion", "css-only", "usage"])(
    "renders the explicit %s variant in the server's first response",
    async (variant) => {
      const page = await ViewPage({
        params: Promise.resolve({ style: "base", name: "example", variant: [variant] }),
      });
      expect(renderToStaticMarkup(page)).toContain(
        `data-preview-variant="${variant}"`,
      );
    },
  );

  it.each([["example", "css-only"], ["fallback", "motion"]])(
    "preserves the default variant for %s",
    async (name, variant) => {
      const page = await ViewPage({
        params: Promise.resolve({ style: "base", name }),
      });
      expect(renderToStaticMarkup(page)).toContain(
        `data-preview-variant="${variant}"`,
      );
    },
  );

  it.each([
    { style: "other", name: "example" },
    { style: "base", name: "missing" },
    { style: "base", name: "hidden" },
    { style: "base", name: "example", variant: ["invalid"] },
    { style: "base", name: "example", variant: ["motion", "extra"] },
  ])("rejects an unsupported destination: %j", async (params) => {
    await expect(ViewPage({ params: Promise.resolve(params) })).rejects.toThrow(
      "NOT_FOUND",
    );
  });
});

describe("shared preview URLs", () => {
  it.each(["motion", "css-only", "usage"])(
    "rewrites ?variant=%s to its static route without redirecting",
    async (variant) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://example.com/view/base/example?variant=${variant}`,
        nextConfig,
      });
      const rewrittenUrl = new URL(getRewrittenUrl(response)!);
      expect(rewrittenUrl.pathname).toBe(`/view/base/example/${variant}`);
      expect(getRedirectUrl(response)).toBeNull();
    },
  );

  it.each(["", "?variant=unknown", "?variant="])(
    "keeps the default page for %s",
    async (query) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://example.com/view/base/example${query}`,
        nextConfig,
      });
      expect(getRewrittenUrl(response)).toBeNull();
    },
  );

  it.each(["", "/css-only"])(
    "keeps renamed preview links resolving: %s",
    async (suffix) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://example.com/view/base/morph${suffix}?variant=usage`,
        nextConfig,
      });
      expect(getRedirectUrl(response)).toBe(
        `https://example.com/view/base/text-morph${suffix}?variant=usage`,
      );
    },
  );

  it("preserves the Markdown documentation rewrite", async () => {
    const response = await unstable_getResponseFromNextConfig({
      url: "https://example.com/docs/installation.md",
      nextConfig,
    });
    expect(new URL(getRewrittenUrl(response)!).pathname).toBe("/llm/installation");
  });
});
