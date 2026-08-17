// @vitest-environment jsdom
import type { Root } from "fumadocs-core/page-tree";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileHeaderMenu } from "@/components/mobile-header-menu";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const tree: Root = {
  name: "Docs",
  children: [
    {
      type: "folder",
      name: "Getting started",
      children: [
        { type: "page", name: "Installation", url: "/docs/installation" },
      ],
    },
  ],
};

const items = [
  { href: "/docs", label: "Docs" },
  { href: "/components", label: "Components" },
] as const;

function openMenu(pathname: string) {
  navigation.pathname = pathname;
  render(<MobileHeaderMenu tree={tree} items={items} />);
  fireEvent.click(screen.getByRole("button"));
}

afterEach(() => {
  cleanup();
  navigation.pathname = "/";
});

describe("MobileHeaderMenu", () => {
  it("keeps a top-level section highlighted on its child routes", () => {
    openMenu("/components/button");

    expect(
      screen.getByRole("link", { name: "Components" }).getAttribute(
        "aria-current",
      ),
    ).toBe("location");
    expect(
      screen.getByRole("link", { name: "Docs" }).hasAttribute("aria-current"),
    ).toBe(false);
  });

  it("keeps Home exact so it does not match every route", () => {
    openMenu("/components/button");

    expect(
      screen.getByRole("link", { name: "Home" }).hasAttribute("aria-current"),
    ).toBe(false);
  });

  it("marks a docs page as the current page rather than a section", () => {
    openMenu("/docs/installation");

    expect(
      screen.getByRole("link", { name: "Installation" }).getAttribute(
        "aria-current",
      ),
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "Docs" }).getAttribute("aria-current"),
    ).toBe("location");
  });
});
