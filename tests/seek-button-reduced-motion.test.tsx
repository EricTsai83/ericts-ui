// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { animate, MotionValue } from "motion/react";

import { SeekButton } from "@/registry/base/ui/seek-button";

const { stop } = vi.hoisted(() => ({ stop: vi.fn() }));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, animate: vi.fn(() => ({ stop })) };
});

let reduced = true;
let listeners: Set<() => void>;

function setReducedMotion(value: boolean) {
  act(() => {
    reduced = value;
    listeners.forEach((listener) => listener());
  });
}

beforeEach(() => {
  reduced = true;
  listeners = new Set();
  vi.stubGlobal("matchMedia", (media: string) => ({
    get matches() {
      return reduced;
    },
    media,
    addEventListener: (_event: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) =>
      listeners.delete(listener),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("SeekButton under reduced motion", () => {
  it("drops the spin but still reports the seek", () => {
    const onSeek = vi.fn();
    render(<SeekButton onSeek={onSeek} />);

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));

    expect(onSeek).toHaveBeenCalledTimes(2);
    expect(animate).not.toHaveBeenCalled();
  });

  it("stops an active spin on preference changes and can enable motion again", () => {
    reduced = false;
    const onSeek = vi.fn();
    const { unmount } = render(<SeekButton onSeek={onSeek} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(animate).toHaveBeenCalledTimes(1);

    const rotation = vi.mocked(animate).mock.calls[0][0];
    // Simulate a frame in the interrupted animation, without wall-clock timing.
    if (!(rotation instanceof MotionValue))
      throw new Error("Expected a MotionValue animation");
    act(() => rotation.set(125));

    setReducedMotion(true);
    expect(stop).toHaveBeenCalledTimes(1);
    expect(rotation.get()).toBe(0);
    fireEvent.click(button);
    expect(animate).toHaveBeenCalledTimes(1);
    expect(onSeek).toHaveBeenCalledTimes(2);

    setReducedMotion(false);
    fireEvent.click(button);
    expect(animate).toHaveBeenCalledTimes(2);
    expect(vi.mocked(animate).mock.calls[1][1]).toBe(360);
    expect(onSeek).toHaveBeenCalledTimes(3);

    unmount();
    expect(stop).toHaveBeenCalledTimes(2);
    expect(listeners.size).toBe(0);
  });
});
