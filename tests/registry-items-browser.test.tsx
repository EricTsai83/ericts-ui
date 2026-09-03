// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { RegistryItemsBrowser } from "@/components/registry-items-browser";

const items = [
  {
    name: "zulu-action",
    title: "Zulu Action",
    category: "ui",
    categories: ["action"],
    groupCategory: "action",
    groupLabel: "Actions",
    groupDescription: "Controls that perform an action.",
    meta: { tags: ["nextjs-only"] },
    href: "/components/zulu-action",
  },
  {
    name: "beta-motion",
    title: "Beta Motion",
    category: "ui",
    categories: ["motion-primitive"],
    groupCategory: "motion-primitive",
    groupLabel: "Motion Primitives",
    groupDescription: "Reusable motion behaviors.",
    href: "/components/beta-motion",
  },
  {
    name: "alpha-motion",
    title: "Alpha Motion",
    category: "ui",
    categories: ["motion-primitive"],
    groupCategory: "motion-primitive",
    groupLabel: "Motion Primitives",
    groupDescription: "Reusable motion behaviors.",
    href: "/components/alpha-motion",
  },
  {
    // A registry slug that differs from the display label, which is what used
    // to surface as a card reading "drawer" underneath an "Overlays" heading.
    name: "delta-drawer",
    title: "Delta Drawer",
    category: "ui",
    categories: ["drawer"],
    groupCategory: "overlay",
    groupLabel: "Overlays",
    groupDescription: "Content that floats above the page.",
    meta: { effects: ["height-animation"] },
    href: "/components/delta-drawer",
  },
];

const arrangementStorageKey = "ericts-ui:components:arrangement";
// Deliberately not alphabetical: label sorting would read Actions → Motion
// Primitives → Overlays, which is exactly the order this browser used to impose.
const categoryOrder = ["overlay", "action", "motion-primitive"];

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function BrowserFixture({
  enableArrangement = true,
  order = categoryOrder,
}: {
  enableArrangement?: boolean;
  order?: string[];
}) {
  return (
    <RegistryItemsBrowser
      items={items}
      categoryOrder={order}
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
      screen.queryByRole("heading", { name: "Motion Primitives" }),
    ).toBeNull();
  });

  it("groups each item once by its primary category", () => {
    renderBrowser();

    fireEvent.click(
      screen.getByRole("button", { name: "Arrange by category" }),
    );

    expect(
      screen.getByRole("heading", { name: "Motion Primitives" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Actions" })).toBeTruthy();
    expect(screen.getAllByText("Beta Motion")).toHaveLength(1);
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
    expect(
      screen.getByRole("heading", { name: "Motion Primitives" }),
    ).toBeTruthy();
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

    expect(screen.getByRole("heading", { name: "Actions" })).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Motion Primitives" }),
    ).toBeNull();
    expect(screen.getByText("Zulu Action")).toBeTruthy();
    expect(screen.queryByText("Beta Motion")).toBeNull();
  });
});

describe("RegistryItemsBrowser group order", () => {
  function showCategoryGroups() {
    fireEvent.click(
      screen.getByRole("button", { name: "Arrange by category" }),
    );

    return screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
  }

  it("renders groups in the order the categories were declared", () => {
    renderBrowser();

    expect(showCategoryGroups()).toEqual([
      "Overlays",
      "Actions",
      "Motion Primitives",
    ]);
  });

  it("sorts a category with no declared rank after the declared ones", () => {
    render(<BrowserFixture order={["motion-primitive"]} />);

    expect(showCategoryGroups()).toEqual([
      "Motion Primitives",
      "Actions",
      "Overlays",
    ]);
  });
});

describe("RegistryItemsBrowser category labels", () => {
  it("surfaces framework-only tags in the item metadata", () => {
    renderBrowser();

    expect(screen.getByText("Actions / Next.js only")).toBeTruthy();
  });

  it("labels a card with the same taxonomy as the group headings", () => {
    renderBrowser();

    expect(screen.getByText("Overlays / height-animation")).toBeTruthy();
    expect(screen.queryByText("drawer / height-animation")).toBeNull();
  });

  it("drops the category from a card once its heading states it", () => {
    renderBrowser();

    fireEvent.click(
      screen.getByRole("button", { name: "Arrange by category" }),
    );

    expect(screen.getByRole("heading", { name: "Overlays" })).toBeTruthy();
    expect(screen.getByText("height-animation")).toBeTruthy();
    expect(screen.queryByText("Overlays / height-animation")).toBeNull();
  });

  it("explains categories in the grouped view", () => {
    renderBrowser();

    fireEvent.click(
      screen.getByRole("button", { name: "Arrange by category" }),
    );

    expect(
      screen.getByText("Content that floats above the page."),
    ).toBeTruthy();
  });
});
