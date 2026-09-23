// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Heartbeat } from "@/registry/base/ui/heartbeat";

afterEach(cleanup);

describe("Heartbeat", () => {
  it("keeps the duplicated shadow child out of the tab order", () => {
    const { container } = render(
      <Heartbeat>
        <button type="button">Action</button>
      </Heartbeat>,
    );

    const shadow = container.querySelector("[data-slot='heartbeat-shadow']");
    expect(shadow?.hasAttribute("inert")).toBe(true);
    expect(shadow?.getAttribute("aria-hidden")).toBe("true");

    const target = container.querySelector("[data-slot='heartbeat-target']");
    expect(target?.hasAttribute("inert")).toBe(false);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("renders children once without the shadow layer", () => {
    render(
      <Heartbeat showShadow={false}>
        <span>Icon</span>
      </Heartbeat>,
    );

    expect(screen.getAllByText("Icon")).toHaveLength(1);
  });
});
