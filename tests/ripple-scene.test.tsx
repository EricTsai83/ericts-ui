// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/blocks/ripple-scene.css", () => ({}));

import {
  RippleScene,
  type RippleSceneItem,
} from "@/registry/base/blocks/ripple-scene";

const items: readonly RippleSceneItem[] = [
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

function settleRipple(container: HTMLElement) {
  const settleStrip = container.querySelector(
    ".ripple-scene__strip[data-settle]",
  );

  // jsdom has no AnimationEvent constructor, so build the event by hand.
  // React's vendor-prefix detection fails under jsdom and registers the
  // webkit event name, so fire both to stay environment-agnostic.
  for (const type of ["animationend", "webkitAnimationEnd"]) {
    const settle = new Event(type, { bubbles: true });
    Object.assign(settle, { animationName: "ripple-scene-strip" });
    fireEvent(settleStrip as Element, settle);
  }
}

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(
      () =>
        ({
          matches: false,
          media: "(prefers-reduced-motion: reduce)",
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        }) as MediaQueryList,
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("RippleScene", () => {
  it("renders the selected photo as a single static base scene", () => {
    const { container } = render(<RippleScene items={items} />);

    expect(
      container
        .querySelector(".ripple-scene__scene--base img")
        ?.getAttribute("src"),
    ).toBe("/forest.jpg");
    expect(container.querySelector(".ripple-scene__scene--ripple")).toBeNull();
  });

  it("ripples the next scene in as staggered strips above the previous scene", async () => {
    const { container } = render(<RippleScene items={items} />);

    fireEvent.click(screen.getByRole("tab", { name: "Coast" }));

    await waitFor(() => {
      expect(
        container.querySelectorAll(".ripple-scene__strip").length,
      ).toBeGreaterThan(1);
    });

    // The previous scene keeps holding the base while the wave plays, and
    // every strip carries the new face beneath the fading old face.
    expect(
      container
        .querySelector(".ripple-scene__scene--base img")
        ?.getAttribute("src"),
    ).toBe("/forest.jpg");
    for (const strip of container.querySelectorAll(".ripple-scene__strip")) {
      const faces = strip.querySelectorAll("img");
      expect(faces[0]?.getAttribute("src")).toBe("/coast.jpg");
      expect(faces[1]?.getAttribute("src")).toBe("/forest.jpg");
    }

    settleRipple(container);

    expect(
      container
        .querySelector(".ripple-scene__scene--base img")
        ?.getAttribute("src"),
    ).toBe("/coast.jpg");
    expect(container.querySelector(".ripple-scene__scene--ripple")).toBeNull();
  });

  it("sweeps the wave toward the newly selected scene", async () => {
    const { container } = render(
      <RippleScene items={items} defaultValue="coast" />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Desert" }));
    await waitFor(() => {
      expect(container.querySelector(".ripple-scene__strip")).toBeTruthy();
    });

    // Forward selection settles on the far right strip.
    const strips = [...container.querySelectorAll(".ripple-scene__strip")];
    expect(strips.at(-1)?.hasAttribute("data-settle")).toBe(true);
    settleRipple(container);

    fireEvent.click(screen.getByRole("tab", { name: "Forest" }));
    await waitFor(() => {
      expect(container.querySelector(".ripple-scene__strip")).toBeTruthy();
    });

    // Backward selection settles on the far left strip.
    const backStrips = [...container.querySelectorAll(".ripple-scene__strip")];
    expect(backStrips[0]?.hasAttribute("data-settle")).toBe(true);
  });

  it("promotes an interrupted ripple before staging the next scene", async () => {
    const { container } = render(<RippleScene items={items} />);

    fireEvent.click(screen.getByRole("tab", { name: "Coast" }));

    await waitFor(() => {
      expect(
        container.querySelector(".ripple-scene__scene--ripple"),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("tab", { name: "Desert" }));

    await waitFor(() => {
      expect(
        container
          .querySelector(".ripple-scene__strip img")
          ?.getAttribute("src"),
      ).toBe("/desert.jpg");
    });
    expect(
      container
        .querySelector(".ripple-scene__scene--base img")
        ?.getAttribute("src"),
    ).toBe("/coast.jpg");
  });

  it("places its selector on the horizontal scene rail", () => {
    render(<RippleScene items={items} />);

    const selector = screen.getByRole("tablist", { name: "Choose a scene" });
    const rail = selector.closest('[data-slot="rail-list"]');

    expect(selector.getAttribute("aria-orientation")).toBe("horizontal");
    expect(rail?.previousElementSibling?.getAttribute("role")).toBe(
      "tabpanel",
    );
  });

  it("selects scenes and reports the selected item", () => {
    const onValueChange = vi.fn();

    render(<RippleScene items={items} onValueChange={onValueChange} />);

    expect(
      screen.getByRole("heading", { name: "Below the canopy" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Coast" }));

    expect(
      screen.getByRole("heading", { name: "At the waterline" }),
    ).toBeTruthy();
    expect(onValueChange).toHaveBeenCalledWith("coast", items[1]);
  });

  it("supports arrow-key selection and wraps at either end", () => {
    render(<RippleScene items={items} />);

    const forest = screen.getByRole("tab", { name: "Forest" });
    fireEvent.keyDown(forest, { key: "ArrowLeft" });

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
      <RippleScene items={items} value="coast" onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Desert" }));

    expect(
      screen.getByRole("heading", { name: "At the waterline" }),
    ).toBeTruthy();
    expect(onValueChange).toHaveBeenCalledWith("desert", items[2]);
  });

  it("renders a useful empty state", () => {
    render(<RippleScene items={[]} emptyLabel="Add a scene" />);

    expect(screen.getByText("Add a scene")).toBeTruthy();
  });
});
