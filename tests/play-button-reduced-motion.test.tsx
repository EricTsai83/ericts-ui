// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlayButton, playPauseIconPath } from "@/registry/base/ui/play-button";

// Motion reads the media query once per module registry, on the first render
// that calls `useReducedMotion`. That makes the preference file-wide, so this
// case lives apart from the default-motion suite rather than inside it.
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

describe("PlayButton under reduced motion", () => {
  it("cuts straight to the target shape and drops the opted-in pulse", () => {
    render(<PlayButton pulseOnToggle />);

    const button = screen.getByRole("button");
    const path = button.querySelector("path") as SVGPathElement;

    expect(path.getAttribute("d")).toBe(playPauseIconPath(0));

    fireEvent.click(button);

    expect(button.dataset.state).toBe("playing");
    expect(path.getAttribute("d")).toBe(playPauseIconPath(1));
    expect(button.querySelector("[data-slot='play-button-pulse']")).toBeNull();
  });
});
