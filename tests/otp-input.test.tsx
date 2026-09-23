// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

describe("OTPInput form participation", () => {
  function formOf(container: HTMLElement) {
    return container.querySelector("form") as HTMLFormElement;
  }

  it("submits the joined value under `name`", () => {
    const { container } = render(
      <form>
        <OTPInput name="code" defaultValue="248917" />
      </form>,
    );

    expect(new FormData(formOf(container)).get("code")).toBe("248917");
  });

  it("renders no form field without a name", () => {
    const { container } = render(
      <form>
        <OTPInput defaultValue="248917" />
      </form>,
    );

    expect(Array.from(new FormData(formOf(container)).keys())).toEqual([]);
  });

  it("tracks typing in the submitted value", () => {
    const { container } = render(
      <form>
        <OTPInput name="code" length={4} />
      </form>,
    );
    const input = screen.getByLabelText("One-time passcode");

    fireEvent.keyDown(input, { key: "1" });
    fireEvent.keyDown(input, { key: "2" });

    expect(new FormData(formOf(container)).get("code")).toBe("12");
    // The visible input's own value stays empty for its keyboard logic.
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("associates with a form by id when rendered outside it", () => {
    const { container } = render(
      <>
        <form id="verify" />
        <OTPInput name="code" form="verify" defaultValue="1234" length={4} />
      </>,
    );

    expect(new FormData(formOf(container)).get("code")).toBe("1234");
  });

  it("does not submit while disabled, like a native control", () => {
    const { container } = render(
      <form>
        <OTPInput name="code" defaultValue="248917" disabled />
      </form>,
    );

    expect(new FormData(formOf(container)).get("code")).toBeNull();
  });

  it("blocks validation until every slot is filled when required", () => {
    const { container, rerender } = render(
      <form>
        <OTPInput name="code" length={4} value="12" required />
      </form>,
    );
    const input = screen.getByLabelText<HTMLInputElement>("One-time passcode");

    expect(formOf(container).checkValidity()).toBe(false);
    expect(input.validity.valueMissing).toBe(true);

    rerender(
      <form>
        <OTPInput name="code" length={4} value="1234" required />
      </form>,
    );

    expect(formOf(container).checkValidity()).toBe(true);
  });

  it("stays valid when not required", () => {
    const { container } = render(
      <form>
        <OTPInput name="code" length={4} />
      </form>,
    );

    expect(formOf(container).checkValidity()).toBe(true);
  });
});
