// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();

  return { ...actual, animate: vi.fn() };
});

const { animate } = await import("motion/react");
const { OTPInput } = await import("@/registry/base/ui/otp-input");

const animateMock = vi.mocked(animate);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("OTPInput under reduced motion", () => {
  it("drops the success wave and the stagger it was carrying", () => {
    const { container } = render(
      <OTPInput value="248917" status="success" successMessage="Verified." />,
    );

    expect(animateMock).not.toHaveBeenCalled();

    const slots = Array.from(
      container.querySelectorAll<HTMLElement>("[data-filled]"),
    );

    expect(slots.every((slot) => slot.style.transitionDelay === "")).toBe(true);
  });

  it("still announces success in the live region", () => {
    const { container } = render(
      <OTPInput value="248917" status="success" successMessage="Verified." />,
    );

    const live = container.querySelector("[aria-live='polite']");

    expect(live?.textContent).toBe("Verified.");
  });
});
