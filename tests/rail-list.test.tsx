// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RailList, type RailListItem } from "@/registry/base/ui/rail-list";

const items: RailListItem[] = [
  { value: "overview", label: "Overview" },
  { value: "process", label: "Process", disabled: true },
  { value: "gallery", label: "Gallery" },
];

afterEach(cleanup);

describe("RailList", () => {
  it("renders a horizontal tablist", () => {
    render(<RailList items={items} aria-label="Chapters" />);

    expect(
      screen
        .getByRole("tablist", { name: "Chapters" })
        .getAttribute("aria-orientation"),
    ).toBe("horizontal");
  });

  it("starts without an active item when defaultValue is omitted", () => {
    render(<RailList items={items} />);

    expect(
      screen
        .getAllByRole("tab")
        .every((tab) => tab.getAttribute("aria-selected") === "false"),
    ).toBe(true);
    expect(screen.getByRole("tab", { name: "Overview" }).tabIndex).toBe(0);
  });

  it("supports a specific default active item", () => {
    render(<RailList items={items} defaultValue="gallery" />);

    expect(
      screen
        .getByRole("tab", { name: "Gallery" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("selects on click and reports the item", () => {
    const onValueChange = vi.fn();

    render(<RailList items={items} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole("tab", { name: "Gallery" }));

    expect(
      screen
        .getByRole("tab", { name: "Gallery" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      "gallery",
      expect.objectContaining({ value: "gallery" }),
    );
  });

  it("keeps controlled state with the parent", () => {
    const onValueChange = vi.fn();

    render(
      <RailList items={items} value="overview" onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Gallery" }));

    expect(
      screen
        .getByRole("tab", { name: "Overview" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      "gallery",
      expect.objectContaining({ value: "gallery" }),
    );
  });

  it("skips disabled items and wraps with arrow keys", () => {
    render(<RailList items={items} defaultValue="overview" />);

    const overview = screen.getByRole("tab", { name: "Overview" });
    fireEvent.keyDown(overview, { key: "ArrowRight" });

    expect(
      screen
        .getByRole("tab", { name: "Gallery" })
        .getAttribute("aria-selected"),
    ).toBe("true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Gallery" }), {
      key: "ArrowRight",
    });

    expect(
      screen
        .getByRole("tab", { name: "Overview" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("supports Home and End keys", () => {
    render(<RailList items={items} defaultValue="overview" />);

    fireEvent.keyDown(screen.getByRole("tab", { name: "Overview" }), {
      key: "End",
    });

    expect(
      screen
        .getByRole("tab", { name: "Gallery" })
        .getAttribute("aria-selected"),
    ).toBe("true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Gallery" }), {
      key: "Home",
    });

    expect(
      screen
        .getByRole("tab", { name: "Overview" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("wires item ids and panel relationships for tab semantics", () => {
    render(
      <RailList
        items={items.map((item, index) => ({
          ...item,
          id: `tab-${index}`,
          ariaControls: "panel",
        }))}
      />,
    );

    const overview = screen.getByRole("tab", { name: "Overview" });

    expect(overview.getAttribute("id")).toBe("tab-0");
    expect(overview.getAttribute("aria-controls")).toBe("panel");
  });

  it("places the indicator on the requested edge", () => {
    const { container } = render(<RailList items={items} edge="top" />);

    expect(
      container
        .querySelector('[data-slot="rail-list"]')
        ?.getAttribute("data-edge"),
    ).toBe("top");
  });
});
