// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ExpandingSegmentedTabs,
  type ExpandingSegmentedTabsItem,
} from "@/registry/base/ui/expanding-segmented-tabs";

const items: ExpandingSegmentedTabsItem[] = [
  { value: "discuss", label: "Discuss", icon: <span>D</span> },
  { value: "library", label: "Library", icon: <span>L</span>, disabled: true },
  { value: "queue", label: "Queue", icon: <span>Q</span> },
];

afterEach(cleanup);

describe("ExpandingSegmentedTabs", () => {
  it("selects values in uncontrolled mode", () => {
    const onValueChange = vi.fn();

    render(
      <ExpandingSegmentedTabs
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
      <ExpandingSegmentedTabs
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
      <ExpandingSegmentedTabs
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
      <ExpandingSegmentedTabs
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
});
