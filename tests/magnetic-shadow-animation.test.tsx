// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/registry/base/ui/magnetic-shadow-animation.css", () => ({}));

import { MagneticShadow } from "@/registry/base/ui/magnetic-shadow-animation";

afterEach(cleanup);

describe("MagneticShadow", () => {
  it("renders active state and timing variables", () => {
    const { container } = render(
      <MagneticShadow
        active
        duration={140}
        activeDuration="320ms"
        ease="ease-out"
      >
        <span>Icon</span>
      </MagneticShadow>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='magnetic-shadow']",
    );

    expect(root?.dataset.active).toBe("true");
    expect(root?.style.getPropertyValue("--magnetic-shadow-duration")).toBe(
      "140ms",
    );
    expect(
      root?.style.getPropertyValue("--magnetic-shadow-active-duration"),
    ).toBe("320ms");
    expect(root?.style.getPropertyValue("--magnetic-shadow-ease")).toBe(
      "ease-out",
    );
  });

  it("can render only the target layer", () => {
    const { container } = render(
      <MagneticShadow showContactShadow={false} showProjectedShadow={false}>
        <span>Icon</span>
      </MagneticShadow>,
    );

    expect(
      container.querySelector("[data-slot='magnetic-shadow-projected']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='magnetic-shadow-contact']"),
    ).toBeNull();
    expect(screen.getAllByText("Icon")).toHaveLength(1);
  });
});
