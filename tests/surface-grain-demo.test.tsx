// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SurfaceGrainDemo } from "@/components/surface-grain-demo";

vi.mock("@/components/surface-grain-demo.module.css", () => ({
  default: new Proxy(
    {},
    {
      get: (_target, property) => String(property),
    },
  ),
}));

const rect = ({
  top,
  right,
  bottom,
  left,
}: {
  top: number;
  right: number;
  bottom: number;
  left: number;
}) =>
  ({
    top,
    right,
    bottom,
    left,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect;

describe("SurfaceGrainDemo", () => {
  it("uses one lens across both themes and magnifies noise at every edge", () => {
    render(<SurfaceGrainDemo />);

    const button = screen.getByRole("button", {
      name: "Magnify surface comparison",
    });
    const preview = screen.getByLabelText(
      "Light and dark plain and grain inspection area",
    );
    const lightSurface = preview.querySelector<HTMLElement>(
      '[data-surface-mode="Light"]',
    );
    const darkSurface = preview.querySelector<HTMLElement>(
      '[data-surface-mode="Dark"]',
    );
    const lightGrain = preview.querySelector<HTMLElement>(
      '[data-grain-mode="Light"]',
    );
    const darkGrain = preview.querySelector<HTMLElement>(
      '[data-grain-mode="Dark"]',
    );

    Object.defineProperties(preview, {
      clientWidth: { configurable: true, value: 640 },
      clientHeight: { configurable: true, value: 540 },
    });
    preview.getBoundingClientRect = () =>
      rect({ top: 50, right: 740, bottom: 590, left: 100 });
    if (lightSurface) {
      lightSurface.getBoundingClientRect = () =>
        rect({ top: 50, right: 740, bottom: 320, left: 100 });
    }
    if (darkSurface) {
      darkSurface.getBoundingClientRect = () =>
        rect({ top: 320, right: 740, bottom: 590, left: 100 });
    }
    if (lightGrain) {
      lightGrain.getBoundingClientRect = () =>
        rect({ top: 94, right: 740, bottom: 320, left: 420 });
    }
    if (darkGrain) {
      darkGrain.getBoundingClientRect = () =>
        rect({ top: 364, right: 740, bottom: 590, left: 420 });
    }

    fireEvent.click(button);

    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.getAttribute("aria-label")).toBe("Exit magnifier");
    expect(button.getAttribute("aria-keyshortcuts")).toBe("Escape");
    expect(screen.getByText("Exit magnifier")).toBeTruthy();
    expect(screen.getByText("Esc")).toBeTruthy();
    expect(preview.getAttribute("data-magnifying")).toBe("true");

    const lens = document.querySelector<HTMLElement>(
      "[data-magnifier-lens]",
    );
    const canvas = lens?.querySelector<HTMLElement>(
      "[data-magnifier-canvas]",
    );
    const lightNoise = lens?.querySelector<HTMLElement>(
      '[data-magnifier-noise="Light"]',
    );
    const darkNoise = lens?.querySelector<HTMLElement>(
      '[data-magnifier-noise="Dark"]',
    );

    fireEvent.pointerMove(preview, { clientX: 500, clientY: 150 });

    expect(lens?.parentElement).toBe(preview);
    expect(lens?.dataset.theme).toBe("Light");
    expect(canvas?.style.transform).toBe(
      "translate(-1520px, -320px) scale(4)",
    );
    expect(lightNoise?.style.visibility).toBe("visible");
    expect(lightNoise?.style.backgroundPosition).toBe("-240px -144px");
    expect(lightNoise?.style.clipPath).toBe("inset(0px 0px 0px 0px)");
    expect(darkNoise?.style.visibility).toBe("hidden");

    fireEvent.pointerMove(preview, { clientX: 500, clientY: 420 });

    expect(lens?.dataset.theme).toBe("Dark");
    expect(darkNoise?.style.visibility).toBe("visible");
    expect(darkNoise?.style.backgroundPosition).toBe("-240px -144px");

    fireEvent.pointerMove(preview, { clientX: 100, clientY: 50 });

    expect(lens?.style.getPropertyValue("--lens-x")).toBe("0px");
    expect(lens?.style.getPropertyValue("--lens-y")).toBe("0px");
    expect(canvas?.style.transform).toBe("translate(80px, 80px) scale(4)");

    expect(screen.getAllByText("Noise opacity 2.5%").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Noise opacity 4%").length).toBeGreaterThan(0);

    fireEvent.click(button);

    expect(preview.getAttribute("data-magnifying")).toBe("false");
    expect(screen.queryByText("Esc")).toBeNull();

    fireEvent.click(button);
    fireEvent.keyDown(preview, { key: "Escape" });

    expect(preview.getAttribute("data-magnifying")).toBe("false");
    expect(button.getAttribute("aria-label")).toBe(
      "Magnify surface comparison",
    );
    expect(document.activeElement).toBe(button);
  });
});
