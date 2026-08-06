// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
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

const arrangementStorageKey = "ericts-ui:components:arrangement";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function BrowserFixture({
  enableArrangement = true,
}: {
  enableArrangement?: boolean;
}) {
  return (
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
      arrangementStorageKey={arrangementStorageKey}
    />
  );
}

function renderBrowser(enableArrangement = true) {
  render(<BrowserFixture enableArrangement={enableArrangement} />);
}

describe("RegistryItemsBrowser arrangement", () => {
  it("keeps server-rendered arrangement content hidden until storage is read", () => {
    const html = renderToString(<BrowserFixture />);

    expect(html).toContain('aria-busy="true"');
    expect(html.match(/invisible/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("hides arrangement controls when the list does not opt in", () => {
    renderBrowser(false);

    expect(
      screen.queryByRole("group", { name: "Arrange items" }),
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

  it("uses the stored arrangement on the first client render", () => {
    window.localStorage.setItem(arrangementStorageKey, "category");

    renderBrowser();

    expect(
      screen
        .getByRole("button", { name: "Arrange by category" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByRole("heading", { name: "Animation" })).toBeTruthy();
  });

  it("saves arrangement changes to local storage", () => {
    renderBrowser();

    fireEvent.click(
      screen.getByRole("button", { name: "Arrange by category" }),
    );

    expect(window.localStorage.getItem(arrangementStorageKey)).toBe(
      "category",
    );
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
    expect(screen.getByText("Zulu Button")).toBeTruthy();
    expect(screen.queryByText("Beta Animation")).toBeNull();
  });
});
