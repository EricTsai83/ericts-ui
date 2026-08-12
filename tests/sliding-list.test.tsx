// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SlidingList,
  type SlidingListItem,
} from "@/registry/base/ui/sliding-list";

const items: SlidingListItem[] = [
  { value: "strategy", label: "Strategy" },
  { value: "identity", label: "Identity", disabled: true },
  { value: "motion", label: "Motion" },
];

afterEach(cleanup);

describe("SlidingList", () => {
  it("starts without an active item when defaultValue is omitted", () => {
    render(<SlidingList items={items} />);

    expect(
      screen
        .getAllByRole("tab")
        .every((tab) => tab.getAttribute("aria-selected") === "false"),
    ).toBe(true);
    expect(screen.getByRole("tab", { name: "Strategy" }).tabIndex).toBe(0);
  });

  it("supports a specific default active item", () => {
    render(<SlidingList items={items} defaultValue="motion" />);

    expect(
      screen.getByRole("tab", { name: "Motion" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("supports starting without an active item", () => {
    render(<SlidingList items={items} defaultValue={null} />);

    const strategyItem = screen.getByRole("tab", { name: "Strategy" });

    expect(
      screen
        .getAllByRole("tab")
        .every((tab) => tab.getAttribute("aria-selected") === "false"),
    ).toBe(true);
    expect(strategyItem.tabIndex).toBe(0);

    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));

    expect(
      screen.getByRole("tab", { name: "Motion" }).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("supports a controlled empty value", () => {
    const onValueChange = vi.fn();

    render(
      <SlidingList
        items={items}
        value={null}
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));

    expect(
      screen
        .getAllByRole("tab")
        .every((tab) => tab.getAttribute("aria-selected") === "false"),
    ).toBe(true);
    expect(onValueChange).toHaveBeenCalledWith(
      "motion",
      expect.objectContaining({ value: "motion" }),
    );
  });

  it("selects values in uncontrolled mode", () => {
    const onValueChange = vi.fn();

    render(
      <SlidingList
        items={items}
        defaultValue="strategy"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));

    expect(
      screen.getByRole("tab", { name: "Motion" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      "motion",
      expect.objectContaining({ value: "motion" }),
    );
  });

  it("reports controlled changes without mutating the selected value", () => {
    const onValueChange = vi.fn();

    render(
      <SlidingList
        items={items}
        value="strategy"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));

    expect(
      screen
        .getByRole("tab", { name: "Strategy" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      "motion",
      expect.objectContaining({ value: "motion" }),
    );
  });

  it("skips disabled items during keyboard navigation", () => {
    render(<SlidingList items={items} defaultValue="strategy" />);

    fireEvent.keyDown(screen.getByRole("tab", { name: "Strategy" }), {
      key: "ArrowDown",
    });

    const motionItem = screen.getByRole("tab", { name: "Motion" });

    expect(motionItem.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(motionItem);
  });

  it("exposes left and right alignment states", () => {
    const { rerender } = render(
      <SlidingList items={items} align="left" aria-label="Alignment" />,
    );

    expect(
      screen.getByRole("tablist", { name: "Alignment" }).getAttribute(
        "data-align",
      ),
    ).toBe("left");

    rerender(
      <SlidingList items={items} align="right" aria-label="Alignment" />,
    );

    expect(
      screen.getByRole("tablist", { name: "Alignment" }).getAttribute(
        "data-align",
      ),
    ).toBe("right");
  });

  it("renders built-in and custom indicators", () => {
    const { rerender } = render(
      <SlidingList items={items} aria-label="Indicators" />,
    );

    expect(
      screen
        .getByRole("tab", { name: "Strategy" })
        .querySelector('[data-indicator="dot"]'),
    ).toBeTruthy();

    rerender(
      <SlidingList items={items} indicator="dash" aria-label="Indicators" />,
    );

    expect(
      screen
        .getByRole("tab", { name: "Strategy" })
        .querySelector('[data-indicator="dash"]'),
    ).toBeTruthy();

    rerender(
      <SlidingList
        items={items}
        indicator={<svg data-testid="custom-icon" />}
        aria-label="Indicators"
      />,
    );

    expect(screen.getAllByTestId("custom-icon")).toHaveLength(items.length);
    expect(
      screen
        .getByRole("tab", { name: "Strategy" })
        .querySelector('[data-indicator="custom"]'),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("tab", { name: "Strategy" })
        .querySelector('[data-indicator="custom"]')
        ?.classList.contains("-left-5"),
    ).toBe(true);
  });

  it("forwards tab relationships and item intent callbacks", () => {
    const onItemPointerEnter = vi.fn();
    const onItemFocus = vi.fn();
    const relatedItems: SlidingListItem[] = [
      {
        value: "strategy",
        label: "Strategy",
        id: "strategy-tab",
        ariaControls: "strategy-panel",
      },
    ];

    render(
      <SlidingList
        items={relatedItems}
        onItemPointerEnter={onItemPointerEnter}
        onItemFocus={onItemFocus}
      />,
    );

    const tab = screen.getByRole("tab", { name: "Strategy" });

    fireEvent.pointerEnter(tab);
    fireEvent.focus(tab);

    expect(tab.id).toBe("strategy-tab");
    expect(tab.getAttribute("aria-controls")).toBe("strategy-panel");
    expect(onItemPointerEnter).toHaveBeenCalledWith(relatedItems[0]);
    expect(onItemFocus).toHaveBeenCalledWith(relatedItems[0]);
  });
});
