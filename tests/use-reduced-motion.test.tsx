// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useReducedMotion } from "@/registry/base/hooks/use-reduced-motion";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function ReducedMotionHarness() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <output data-testid="preference">{String(prefersReducedMotion)}</output>
  );
}

function createMediaQueryList(initialMatches: boolean) {
  let matches = initialMatches;
  const addEventListener = vi.fn<MediaQueryList["addEventListener"]>();
  const removeEventListener = vi.fn<MediaQueryList["removeEventListener"]>();

  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;

  return {
    addEventListener,
    mediaQuery,
    removeEventListener,
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
    },
  };
}

describe("useReducedMotion", () => {
  it("reads the current reduced-motion preference on mount", () => {
    const media = createMediaQueryList(true);
    const matchMedia = vi.fn(() => media.mediaQuery);
    vi.stubGlobal("matchMedia", matchMedia);

    render(<ReducedMotionHarness />);

    expect(matchMedia).toHaveBeenCalledWith(
      "(prefers-reduced-motion: reduce)",
    );
    expect(screen.getByTestId("preference").textContent).toBe("true");
    expect(media.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("reacts to preference changes and removes its listener on unmount", () => {
    const media = createMediaQueryList(false);
    vi.stubGlobal("matchMedia", vi.fn(() => media.mediaQuery));

    const view = render(<ReducedMotionHarness />);
    const listener = media.addEventListener.mock.calls[0]?.[1];

    expect(listener).toBeTypeOf("function");
    expect(screen.getByTestId("preference").textContent).toBe("false");

    media.setMatches(true);

    act(() => {
      if (typeof listener === "function") {
        listener.call(media.mediaQuery, new Event("change"));
      }
    });

    expect(screen.getByTestId("preference").textContent).toBe("true");

    view.unmount();

    expect(media.removeEventListener).toHaveBeenCalledWith("change", listener);
  });
});
