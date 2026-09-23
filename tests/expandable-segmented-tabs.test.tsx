// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ExpandableSegmentedTabs,
  type ExpandableSegmentedTabsItem,
} from "@/registry/base/ui/expandable-segmented-tabs";

const items: ExpandableSegmentedTabsItem[] = [
  { value: "discuss", label: "Discuss", icon: <span>D</span> },
  { value: "library", label: "Library", icon: <span>L</span>, disabled: true },
  { value: "queue", label: "Queue", icon: <span>Q</span> },
];

afterEach(cleanup);

describe("ExpandableSegmentedTabs", () => {
  it("selects values in uncontrolled mode", () => {
    const onValueChange = vi.fn();

    render(
      <ExpandableSegmentedTabs
        items={items}
        defaultValue="discuss"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Queue" }));

    expect(
      screen.getByRole("tab", { name: "Queue" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      "queue",
      expect.objectContaining({ value: "queue" }),
    );
  });

  it("reports controlled changes without mutating the selected value", () => {
    const onValueChange = vi.fn();

    render(
      <ExpandableSegmentedTabs
        items={items}
        value="discuss"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Queue" }));

    expect(
      screen
        .getByRole("tab", { name: "Discuss" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      "queue",
      expect.objectContaining({ value: "queue" }),
    );
  });

  it("skips disabled items during keyboard navigation", () => {
    const onValueChange = vi.fn();

    render(
      <ExpandableSegmentedTabs
        items={items}
        defaultValue="discuss"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole("tab", { name: "Discuss" }), {
      key: "ArrowRight",
    });

    const queueItem = screen.getByRole("tab", { name: "Queue" });

    expect(queueItem.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(queueItem);
    expect(onValueChange).toHaveBeenCalledWith(
      "queue",
      expect.objectContaining({ value: "queue" }),
    );
  });

  it("fires value intent for enabled inactive items", () => {
    const onValueIntent = vi.fn();

    render(
      <ExpandableSegmentedTabs
        items={items}
        defaultValue="discuss"
        onValueIntent={onValueIntent}
      />,
    );

    fireEvent.pointerEnter(screen.getByRole("tab", { name: "Queue" }));
    fireEvent.focus(screen.getByRole("tab", { name: "Library" }));

    expect(onValueIntent).toHaveBeenCalledTimes(1);
    expect(onValueIntent).toHaveBeenCalledWith(
      "queue",
      expect.objectContaining({ value: "queue" }),
    );
  });

  it("labels the tablist with aria-labelledby instead of the default label", () => {
    render(
      <>
        <h2 id="mode-heading">Mode</h2>
        <ExpandableSegmentedTabs items={items} aria-labelledby="mode-heading" />
      </>,
    );

    const tablist = screen.getByRole("tablist", { name: "Mode" });

    expect(tablist.getAttribute("aria-labelledby")).toBe("mode-heading");
    expect(tablist.hasAttribute("aria-label")).toBe(false);
    expect(
      document
        .querySelector('[data-slot="expandable-segmented-tabs"]')
        ?.hasAttribute("aria-labelledby"),
    ).toBe(false);
  });

  it("keeps an explicit aria-label alongside aria-labelledby", () => {
    render(
      <ExpandableSegmentedTabs items={items} aria-label="Fallback" aria-labelledby="mode-heading" />,
    );

    const tablist = screen.getByRole("tablist");

    expect(tablist.getAttribute("aria-label")).toBe("Fallback");
    expect(tablist.getAttribute("aria-labelledby")).toBe("mode-heading");
  });

  it("falls back to the default tablist label", () => {
    render(<ExpandableSegmentedTabs items={items} />);

    expect(screen.getByRole("tablist", { name: "Options" })).toBeTruthy();
  });

  it("wires item ids and aria-controls onto the tab triggers", () => {
    render(
      <ExpandableSegmentedTabs
        items={[
          { ...items[0], id: "discuss-tab", ariaControls: "discuss-panel" },
          items[2],
        ]}
      />,
    );

    const [linked, plain] = screen.getAllByRole("tab");

    expect(linked.id).toBe("discuss-tab");
    expect(linked.getAttribute("aria-controls")).toBe("discuss-panel");
    expect(plain.hasAttribute("id")).toBe(false);
    expect(plain.hasAttribute("aria-controls")).toBe(false);
  });
});
