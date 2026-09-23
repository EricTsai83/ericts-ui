// @vitest-environment jsdom
import { act } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ContextCursor,
  ContextCursorTarget,
} from "@/registry/base/ui/context-cursor";

function rect(left: number, top: number, width: number, height: number) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      // A fine hover pointer, with no reduced-motion preference.
      matches: media.includes("pointer: fine"),
      media,
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
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function scrollListenerCount(spy: { mock: { calls: unknown[][] } }) {
  return spy.mock.calls.filter(([type]) => type === "scroll").length;
}

describe("ContextCursor", () => {
  it("re-measures cached rects after a scroll under a still pointer", async () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { container } = render(
      <ContextCursor>
        <ContextCursorTarget label="Open">target</ContextCursorTarget>
      </ContextCursor>,
    );

    const wrapper = container.querySelector<HTMLElement>(
      '[data-slot="context-cursor"]',
    );
    const target = screen.getByText("target");
    if (!wrapper) throw new Error("wrapper not found");

    let wrapperRect = rect(0, 0, 400, 400);
    let targetRect = rect(100, 100, 200, 200);
    vi.spyOn(wrapper, "getBoundingClientRect").mockImplementation(
      () => wrapperRect,
    );
    const targetMeasure = vi
      .spyOn(target, "getBoundingClientRect")
      .mockImplementation(() => targetRect);

    // Inactive: no scroll listener yet.
    expect(scrollListenerCount(addSpy)).toBe(0);

    await act(async () => {
      fireEvent.pointerOver(target, {
        pointerType: "mouse",
        clientX: 200,
        clientY: 200,
      });
    });

    expect(targetMeasure).toHaveBeenCalledTimes(1);
    expect(wrapper.dataset.contextCursorNativeHidden).toBe("true");
    expect(scrollListenerCount(addSpy)).toBe(1);

    // The page scrolls 500px; the pointer has not moved, so the target is
    // now entirely above it.
    wrapperRect = rect(0, -500, 400, 400);
    targetRect = rect(100, -400, 200, 200);

    await act(async () => {
      window.dispatchEvent(new Event("scroll"));
      window.dispatchEvent(new Event("scroll"));
      vi.advanceTimersByTime(32);
    });

    // Coalesced into one re-measure per frame.
    expect(targetMeasure).toHaveBeenCalledTimes(2);
    // The pointer is outside the fresh target rect, so the native cursor is
    // handed back instead of staying hidden against the stale rect.
    expect(wrapper.dataset.contextCursorNativeHidden).toBeUndefined();

    cleanup();

    expect(scrollListenerCount(removeSpy)).toBe(1);
  });
});
