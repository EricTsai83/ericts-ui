// @vitest-environment jsdom
import type { ComponentProps } from "react";
import type { Root } from "fumadocs-core/page-tree";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileDocsNavigation } from "@/components/mobile-docs-navigation";

const navigation = vi.hoisted(() => ({ pathname: "/docs/installation" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("next/link", async () => {
  const { createElement } = await import("react");

  type MockLinkProps = Omit<ComponentProps<"a">, "href"> & {
    href: string | { pathname?: string | null };
  };

  return {
    default: ({ href, ...props }: MockLinkProps) =>
      createElement("a", {
        ...props,
        href: typeof href === "string" ? href : (href.pathname ?? ""),
      }),
  };
});

const tree: Root = {
  name: "Documentation",
  children: [
    { type: "page", name: "Introduction", url: "/docs" },
    { type: "page", name: "Installation", url: "/docs/installation" },
    { type: "separator", name: "Recipes" },
    { type: "page", name: "Surface Grain", url: "/docs/surface-grain" },
  ],
};

afterEach(() => {
  cleanup();
  navigation.pathname = "/docs/installation";
});

describe("MobileDocsNavigation", () => {
  it("keeps the current article visible in the persistent trigger", () => {
    render(<MobileDocsNavigation tree={tree} />);

    const trigger = screen.getByRole("button", {
      name: "Browse documentation pages",
    });

    expect(trigger.textContent).toContain("Docs");
    expect(trigger.textContent).toContain("Installation");
  });

  it("falls back to an article-discovery label on an unknown route", () => {
    navigation.pathname = "/docs/unknown";

    render(<MobileDocsNavigation tree={tree} />);

    expect(
      screen.getByRole("button", { name: "Browse documentation pages" })
        .textContent,
    ).toContain("Browse articles");
  });
});
