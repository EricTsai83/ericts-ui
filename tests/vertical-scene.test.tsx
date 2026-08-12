// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/blocks/vertical-scene.css", () => ({}));

import {
  VerticalScene,
  type VerticalSceneItem,
} from "@/registry/base/blocks/vertical-scene";

const items: readonly VerticalSceneItem[] = [
  {
    value: "forest",
    label: "Forest",
    title: "Below the canopy",
    image: { src: "/forest.jpg", alt: "A dense forest" },
  },
  {
    value: "coast",
    label: "Coast",
    title: "At the waterline",
    image: { src: "/coast.jpg", alt: "A rocky coast" },
  },
  {
    value: "desert",
    label: "Desert",
    title: "Across the basin",
    image: { src: "/desert.jpg", alt: "A broad desert" },
  },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("VerticalScene", () => {
  it("uses the sliding list beside the scene content", () => {
    render(<VerticalScene items={items} />);

    const selector = screen.getByRole("tablist", { name: "Choose a scene" });
    const slidingList = selector.closest("[data-slot='sliding-list']");

    expect(slidingList).toBeTruthy();
    expect(slidingList?.parentElement?.classList.contains("vertical-scene__body")).toBe(
      true,
    );
    expect(slidingList?.nextElementSibling?.getAttribute("role")).toBe(
      "tabpanel",
    );
    expect(
      screen
        .getByRole("tab", { name: "Forest" })
        .querySelector('[data-indicator="dot"]'),
    ).toBeTruthy();
  });

  it("moves down to later scenes and reports the selected item", () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <VerticalScene items={items} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Desert" }));

    expect(
      screen.getByRole("heading", { name: "Across the basin" }),
    ).toBeTruthy();
    expect(
      container
        .querySelector("[data-slot='vertical-scene']")
        ?.getAttribute("data-direction"),
    ).toBe("down");
    expect(onValueChange).toHaveBeenCalledWith("desert", items[2]);
  });

  it("moves up when selecting an earlier scene", () => {
    const { container } = render(
      <VerticalScene items={items} defaultValue="desert" />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Forest" }));

    expect(
      container
        .querySelector("[data-slot='vertical-scene']")
        ?.getAttribute("data-direction"),
    ).toBe("up");
    expect(
      screen.getByRole("heading", { name: "Below the canopy" }),
    ).toBeTruthy();
  });

  it("supports arrow-key selection and wraps at either end", () => {
    render(<VerticalScene items={items} />);

    fireEvent.keyDown(screen.getByRole("tab", { name: "Forest" }), {
      key: "ArrowLeft",
    });

    expect(
      screen
        .getByRole("tab", { name: "Desert" })
        .getAttribute("aria-selected"),
    ).toBe("true");

    fireEvent.keyDown(screen.getByRole("tab", { name: "Desert" }), {
      key: "ArrowRight",
    });

    expect(
      screen
        .getByRole("tab", { name: "Forest" })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("keeps controlled state with the parent", () => {
    const onValueChange = vi.fn();

    render(
      <VerticalScene
        items={items}
        value="coast"
        onValueChange={onValueChange}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Desert" }));

    expect(
      screen.getByRole("heading", { name: "At the waterline" }),
    ).toBeTruthy();
    expect(onValueChange).toHaveBeenCalledWith("desert", items[2]);
  });

  it("renders a useful empty state", () => {
    render(<VerticalScene items={[]} emptyLabel="Add a scene" />);

    expect(screen.getByText("Add a scene")).toBeTruthy();
  });
});
