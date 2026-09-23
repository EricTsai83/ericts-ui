// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  HighlightTabs,
  type HighlightTab,
} from "@/registry/base/ui/highlight-tabs";

const tabs: HighlightTab[] = [
  { value: "overview", label: "Overview" },
  { value: "usage", label: "Usage" },
];

afterEach(cleanup);

describe("HighlightTabs", () => {
  it("labels the tablist with aria-labelledby instead of the default label", () => {
    render(
      <>
        <h2 id="docs-heading">Docs</h2>
        <HighlightTabs tabs={tabs} aria-labelledby="docs-heading" />
      </>,
    );

    const tablist = screen.getByRole("tablist", { name: "Docs" });

    expect(tablist.getAttribute("aria-labelledby")).toBe("docs-heading");
    expect(tablist.hasAttribute("aria-label")).toBe(false);
    expect(
      document
        .querySelector('[data-slot="highlight-tabs"]')
        ?.hasAttribute("aria-labelledby"),
    ).toBe(false);
  });

  it("keeps an explicit aria-label alongside aria-labelledby", () => {
    render(
      <HighlightTabs
        tabs={tabs}
        aria-label="Fallback"
        aria-labelledby="docs-heading"
      />,
    );

    const tablist = screen.getByRole("tablist");

    expect(tablist.getAttribute("aria-label")).toBe("Fallback");
    expect(tablist.getAttribute("aria-labelledby")).toBe("docs-heading");
  });

  it("falls back to the default tablist label", () => {
    render(<HighlightTabs tabs={tabs} />);

    expect(screen.getByRole("tablist", { name: "Tabs" })).toBeTruthy();
  });
});
