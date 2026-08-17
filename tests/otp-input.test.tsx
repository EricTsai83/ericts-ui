// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// The success wave and the error shake are both imperative, so the assertion
// is on the call rather than on a computed style jsdom would not produce.
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();

  return { ...actual, animate: vi.fn() };
});

const { animate } = await import("motion/react");
const { OTPInput } = await import("@/registry/base/ui/otp-input");

const animateMock = vi.mocked(animate);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function slotsOf(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>("[data-filled]"),
  );
}

describe("OTPInput success wave", () => {
  it("lifts each slot box, staggered, rather than the row as a whole", () => {
    const { container } = render(<OTPInput value="248917" status="success" />);

    expect(animateMock).toHaveBeenCalledTimes(1);

    const [targets, keyframes, options] = animateMock.mock.calls[0];

    // The shake takes the row element; the wave takes its children, so the two
    // never own the same property on the same node.
    expect(Array.isArray(targets)).toBe(true);
    expect(targets).toHaveLength(6);
    expect(targets).toEqual(slotsOf(container));
    expect(keyframes).toEqual({ y: [0, -10, 0], scale: [1, 1.04, 1] });
    expect(typeof options?.delay).toBe("function");
  });

  it("gives the rise and the fall their own curves", () => {
    render(<OTPInput value="248917" status="success" />);

    const [, , options] = animateMock.mock.calls[0];

    // One easing across three keyframes would snap out of the apex as hard as
    // it snapped in. The apex also sits before the midpoint.
    expect(options?.ease).toHaveLength(2);
    expect(options?.times?.[1]).toBeLessThan(0.5);
  });

  it("rides the border flip on the same stagger as the lift", () => {
    const { container } = render(<OTPInput value="248917" status="success" />);

    expect(slotsOf(container).map((slot) => slot.style.transitionDelay)).toEqual(
      ["0ms", "40ms", "80ms", "120ms", "160ms", "200ms"],
    );
  });

  it("leaves the slots undelayed outside success", () => {
    const { container } = render(<OTPInput value="248917" status="error" />);

    expect(
      slotsOf(container).every((slot) => slot.style.transitionDelay === ""),
    ).toBe(true);
  });

  it("shakes the row, not the slots, on error", () => {
    render(<OTPInput value="248917" status="error" />);

    const [targets, keyframes] = animateMock.mock.calls[0];

    expect(Array.isArray(targets)).toBe(false);
    expect(keyframes).toEqual({ x: [0, -5, 5, -3, 3, -1, 0] });
  });
});
