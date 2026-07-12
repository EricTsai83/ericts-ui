// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MorphingSegmentedControl,
  type MorphingSegmentedControlItem,
} from "@/registry/base/ui/morphing-segmented-control";

const items: MorphingSegmentedControlItem[] = [
  { value: "discuss", label: "Discuss", icon: <span>D</span> },
  { value: "library", label: "Library", icon: <span>L</span>, disabled: true },
  { value: "queue", label: "Queue", icon: <span>Q</span> },
];

afterEach(cleanup);

describe("MorphingSegmentedControl", () => {
  it("selects values in uncontrolled mode", () => {
    const onValueChange = vi.fn();

    render(
      <MorphingSegmentedControl
        items={items}
        defaultValue="discuss"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Queue" }));

    expect(
      screen.getByRole("radio", { name: "Queue" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      "queue",
      expect.objectContaining({ value: "queue" }),
    );
  });

  it("reports controlled changes without mutating the selected value", () => {
    const onValueChange = vi.fn();

    render(
      <MorphingSegmentedControl
        items={items}
        value="discuss"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: "Queue" }));

    expect(
      screen
        .getByRole("radio", { name: "Discuss" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(onValueChange).toHaveBeenCalledWith(
      "queue",
      expect.objectContaining({ value: "queue" }),
    );
  });

  it("skips disabled items during keyboard navigation", () => {
    const onValueChange = vi.fn();

    render(
      <MorphingSegmentedControl
        items={items}
        defaultValue="discuss"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole("radio", { name: "Discuss" }), {
      key: "ArrowRight",
    });

    const queueItem = screen.getByRole("radio", { name: "Queue" });

    expect(queueItem.getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(queueItem);
    expect(onValueChange).toHaveBeenCalledWith(
      "queue",
      expect.objectContaining({ value: "queue" }),
    );
  });

  it("fires value intent for enabled inactive items", () => {
    const onValueIntent = vi.fn();

    render(
      <MorphingSegmentedControl
        items={items}
        defaultValue="discuss"
        onValueIntent={onValueIntent}
      />,
    );

    fireEvent.pointerEnter(screen.getByRole("radio", { name: "Queue" }));
    fireEvent.focus(screen.getByRole("radio", { name: "Library" }));

    expect(onValueIntent).toHaveBeenCalledTimes(1);
    expect(onValueIntent).toHaveBeenCalledWith(
      "queue",
      expect.objectContaining({ value: "queue" }),
    );
  });
});
