// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MobileHeaderMenu } from "@/components/mobile-header-menu";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

const items = [
  { href: "/docs", label: "Docs" },
  { href: "/components", label: "Components" },
] as const;

function openMenu(pathname: string) {
  navigation.pathname = pathname;
  render(<MobileHeaderMenu items={items} />);
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

  it("keeps document articles out of the top-level menu", () => {
    openMenu("/docs/installation");

    expect(screen.queryByRole("link", { name: "Installation" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Docs" }).getAttribute("aria-current"),
    ).toBe("location");
  });
});
