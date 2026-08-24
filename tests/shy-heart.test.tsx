// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/ui/shy-heart.css", () => ({}));

import { ShyHeart } from "@/registry/base/ui/shy-heart";

afterEach(cleanup);

describe("ShyHeart", () => {
  it("renders the brand outline with raised, larger blush marks", () => {
    const { container } = render(<ShyHeart label="Shy heart" />);
    const body = container.querySelector(
      "[data-slot='shy-heart-body']",
    );
    const left = container.querySelector(
      "[data-slot='shy-heart-blush-left']",
    );
    const right = container.querySelector(
      "[data-slot='shy-heart-blush-right']",
    );

    expect(body?.getAttribute("d")).toContain("M128 224.6");
    expect(left?.querySelectorAll("path")).toHaveLength(4);
    expect(right?.querySelectorAll("path")).toHaveLength(4);
    expect(
      left
        ?.querySelector(".shy-heart-blush-backdrop")
        ?.getAttribute("d"),
    ).toBe("M50 120H103");
    expect(right?.querySelector(".shy-heart-blush-lines")).toBeTruthy();
    expect(
      left?.querySelector(".shy-heart-blush-lines path")?.getAttribute("d"),
    ).toBe("M65 108V127");
    expect(screen.getByRole("img", { name: "Shy heart" })).toBeTruthy();
  });

  it("renders a single tilt stage without legacy turn cues", () => {
    const { container } = render(<ShyHeart />);

    expect(container.querySelector(".shy-heart-motion-stage")).toBeTruthy();
    expect(container.querySelector(".shy-heart-turn-stage")).toBeNull();
    expect(container.querySelector(".shy-heart-depth")).toBeNull();
    expect(
      container.querySelector("[data-slot^='shy-heart-turn-indicator']"),
    ).toBeNull();
  });

  it("supports a static decorative rendering", () => {
    const { container } = render(<ShyHeart animated={false} />);
    const root = container.querySelector<HTMLElement>(
      "[data-slot='shy-heart']",
    );

    expect(root?.dataset.animated).toBeUndefined();
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.getAttribute("role")).toBeNull();
  });

  it("forwards its root ref and converts numeric dimensions and durations", () => {
    const ref = createRef<HTMLSpanElement>();

    render(
      <ShyHeart
        ref={ref}
        duration={420}
        size={96}
        tiltDuration="360ms"
      />,
    );

    expect(ref.current?.dataset.slot).toBe("shy-heart");
    expect(
      ref.current?.style.getPropertyValue("--shy-heart-duration"),
    ).toBe("420ms");
    expect(ref.current?.style.getPropertyValue("--shy-heart-size")).toBe(
      "96px",
    );
    expect(
      ref.current?.style.getPropertyValue("--shy-heart-tilt-duration"),
    ).toBe("360ms");
  });
});
