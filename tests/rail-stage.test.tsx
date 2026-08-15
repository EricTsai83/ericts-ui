// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  RailStage,
  type RailStageItem,
} from "@/registry/base/blocks/rail-stage";

const items: RailStageItem[] = [
  { id: "one", label: "One", header: <h3>One header</h3>, content: "one body" },
  { id: "two", label: "Two", content: "two body" },
  { id: "three", label: "Three", content: "three body" },
];

afterEach(() => {
  cleanup();
});

describe("RailStage", () => {
  it("exposes the rail as a named tab list with one selected tab", () => {
    render(<RailStage items={items} railLabel="Sections" />);

    const rail = screen.getByRole("tablist", { name: "Sections" });

    expect(rail).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("One");
  });

  it("shows the first item's content and header by default", () => {
    render(<RailStage items={items} railLabel="Sections" />);

    expect(screen.getByRole("tabpanel").textContent).toContain("one body");
    expect(screen.getByRole("heading", { name: "One header" })).toBeTruthy();
  });

  it("honours defaultValue when uncontrolled", () => {
    render(<RailStage items={items} defaultValue="three" railLabel="Sections" />);

    expect(screen.getByRole("tab", { selected: true }).textContent).toBe(
      "Three",
    );
    expect(screen.getByRole("tabpanel").textContent).toContain("three body");
  });

  it("swaps the stage when another rail entry is chosen", () => {
    render(<RailStage items={items} railLabel="Sections" />);

    fireEvent.click(screen.getByRole("tab", { name: "Two" }));

    expect(screen.getByRole("tab", { selected: true }).textContent).toBe("Two");
    expect(screen.getByRole("tabpanel").textContent).toContain("two body");
  });

  it("slides one shared indicator to the selected rail entry", () => {
    const { container } = render(
      <RailStage items={items} railLabel="Sections" />,
    );
    const tabs = screen.getAllByRole("tab");
    const secondTab = tabs[1];

    Object.defineProperties(secondTab, {
      offsetHeight: { configurable: true, value: 64 },
      offsetTop: { configurable: true, value: 64 },
    });

    fireEvent.click(secondTab);

    const indicator = container.querySelector<HTMLElement>(
      '[data-slot="rail-stage-indicator"]',
    );

    expect(indicator?.style.height).toBe("48px");
    expect(indicator?.style.transform).toBe("translate3d(0, 72px, 0)");
    expect(indicator?.className).toContain("motion-reduce:transition-none");
  });

  it("reports changes and defers to the prop when controlled", () => {
    const onValueChange = vi.fn();

    render(
      <RailStage
        items={items}
        value="one"
        onValueChange={onValueChange}
        railLabel="Sections"
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Two" }));

    expect(onValueChange).toHaveBeenCalledWith("two");
    // Controlled: the parent did not move `value`, so the stage must not either.
    expect(screen.getByRole("tabpanel").textContent).toContain("one body");
  });

  it("omits the header strip for items that do not supply one", () => {
    render(<RailStage items={items} defaultValue="two" railLabel="Sections" />);

    expect(screen.queryByRole("heading")).toBeNull();
  });

  it("forwards a ref to the root node", () => {
    const ref = createRef<HTMLDivElement>();

    render(<RailStage ref={ref} items={items} railLabel="Sections" />);

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.dataset.slot).toBe("rail-stage");
  });

  it("renders nothing when given no items", () => {
    const { container } = render(<RailStage items={[]} railLabel="Sections" />);

    expect(container.firstChild).toBeNull();
  });
});
