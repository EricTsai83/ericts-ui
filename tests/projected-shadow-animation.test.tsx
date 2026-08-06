// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@/registry/base/ui/projected-shadow-animation.css", () => ({}));

import { ProjectedShadow } from "@/registry/base/ui/projected-shadow-animation";

afterEach(cleanup);

describe("ProjectedShadow", () => {
  it("renders active state and timing variables", () => {
    const { container } = render(
      <ProjectedShadow
        active
        duration={140}
        activeDuration="320ms"
        ease="ease-out"
        projectedShadowBlur={4}
        projectedShadowOffset={{ x: "-20%", y: -18 }}
      >
        <span>Icon</span>
      </ProjectedShadow>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='projected-shadow']",
    );

    expect(root?.dataset.active).toBe("true");
    expect(root?.style.getPropertyValue("--projected-shadow-duration")).toBe(
      "140ms",
    );
    expect(
      root?.style.getPropertyValue("--projected-shadow-active-duration"),
    ).toBe("320ms");
    expect(root?.style.getPropertyValue("--projected-shadow-ease")).toBe(
      "ease-out",
    );
    expect(root?.style.getPropertyValue("--projected-shadow-blur")).toBe("4px");
    expect(
      root?.style.getPropertyValue("--projected-shadow-projected-x"),
    ).toBe("-20%");
    expect(
      root?.style.getPropertyValue("--projected-shadow-projected-y"),
    ).toBe("-18px");
  });

  it("can render only the target layer", () => {
    const { container } = render(
      <ProjectedShadow showContactShadow={false} showProjectedShadow={false}>
        <span>Icon</span>
      </ProjectedShadow>,
    );

    expect(
      container.querySelector("[data-slot='projected-shadow-projected']"),
    ).toBeNull();
    expect(
      container.querySelector("[data-slot='projected-shadow-contact']"),
    ).toBeNull();
    expect(screen.getAllByText("Icon")).toHaveLength(1);
  });
});
