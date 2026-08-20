// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SlidingPlayButton,
  slidingPlayPauseIconStyles,
} from "@/registry/base/ui/sliding-play-button";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SlidingPlayButton under reduced motion", () => {
  it("cuts straight to the target three-layer composition", () => {
    render(<SlidingPlayButton />);

    const button = screen.getByRole("button");
    const leftBar = button.querySelector(
      '[data-slot="sliding-play-button-left-bar"]',
    ) as SVGRectElement;
    const rightBar = button.querySelector(
      '[data-slot="sliding-play-button-right-bar"]',
    ) as SVGRectElement;
    const triangle = button.querySelector(
      '[data-slot="sliding-play-button-triangle"]',
    ) as SVGPathElement;

    fireEvent.click(button);

    const pause = slidingPlayPauseIconStyles(1);
    expect(button.dataset.state).toBe("playing");
    expect(leftBar.style.transform).toBe(pause.leftBar.transform);
    expect(leftBar.style.opacity).toBe(String(pause.leftBar.opacity));
    expect(rightBar.style.transform).toBe(pause.rightBar.transform);
    expect(rightBar.style.opacity).toBe(String(pause.rightBar.opacity));
    expect(triangle.style.transform).toBe(pause.triangle.transform);
  });
});
