// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RegistryItemsBrowser } from "@/components/registry-items-browser";

const items = [
  {
    name: "zulu-button",
    title: "Zulu Button",
    category: "ui",
    categories: ["button"],
    groupCategory: "button",
    groupLabel: "Button",
    href: "/components/zulu-button",
  },
  {
    name: "beta-animation",
    title: "Beta Animation",
    category: "ui",
    categories: ["animation", "feedback"],
    groupCategory: "animation",
    groupLabel: "Animation",
    href: "/components/beta-animation",
  },
  {
    name: "alpha-animation",
    title: "Alpha Animation",
    category: "ui",
    categories: ["animation"],
    groupCategory: "animation",
    groupLabel: "Animation",
    href: "/components/alpha-animation",
  },
];

afterEach(cleanup);

function renderBrowser(enableArrangement = true) {
  render(
    <RegistryItemsBrowser
      items={items}
      title="Components"
      description="Browse components."
      searchInputId="components-search"
      searchLabel="Search components"
      searchPlaceholder="Search components..."
      itemLabel="component"
      itemLabelPlural="components"
      emptyTitle="No components found"
      emptyDescription="Try another search."
      noItemsLabel="No components yet."
      enableArrangement={enableArrangement}
    />,
  );
}

describe("RegistryItemsBrowser arrangement", () => {
  it("hides arrangement controls when the list does not opt in", () => {
    renderBrowser(false);

    expect(
      screen.queryByRole("button", { name: "Arrange alphabetically" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Arrange by category" }),
    ).toBeNull();
  });

  it("defaults to the alphabetical view", () => {
    renderBrowser();

    expect(
      screen
        .getByRole("button", { name: "Arrange alphabetically" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.queryByRole("heading", { name: "Animation" }),
    ).toBeNull();
  });

  it("groups each item once by its primary category", () => {
    renderBrowser();

    fireEvent.click(
      screen.getByRole("button", { name: "Arrange by category" }),
    );

    expect(screen.getByRole("heading", { name: "Animation" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Button" })).toBeTruthy();
    expect(screen.getAllByText("Beta Animation")).toHaveLength(1);
    expect(
      screen
        .getByRole("button", { name: "Arrange by category" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });

  it("preserves category view while filtering", () => {
    renderBrowser();

    fireEvent.click(
      screen.getByRole("button", { name: "Arrange by category" }),
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Zulu" },
    });

    expect(screen.getByRole("heading", { name: "Button" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Animation" }),
    ).toBeNull();
    expect(screen.getByText("1 of 3 components")).toBeTruthy();
  });
});
