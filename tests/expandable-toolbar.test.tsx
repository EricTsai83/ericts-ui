// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExpandableToolbar } from "@/registry/base/ui/expandable-toolbar";

afterEach(cleanup);

function renderToolbar(side: "start" | "end" | "center") {
  return render(
    <ExpandableToolbar
      side={side}
      anchor="toolbar"
      expandIcon={<span>+</span>}
      expandLabel="Expand actions"
      collapseLabel="Collapse actions"
    >
      <button type="button">One</button>
      <button type="button">Two</button>
      <button type="button">Three</button>
      <button type="button">Four</button>
    </ExpandableToolbar>,
  );
}

function getPanels(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      "[data-slot='expandable-toolbar-panel']",
    ),
  );
}

describe("ExpandableToolbar", () => {
  it("renders a single panel holding every child for side='start'", () => {
    const { container } = renderToolbar("start");
    const panels = getPanels(container);

    expect(panels).toHaveLength(1);
    expect(panels[0].textContent).toBe("OneTwoThreeFour");

    const trigger = screen.getByRole("button", { name: "Expand actions" });

    expect(trigger.getAttribute("aria-controls")).toBe(panels[0].id);
  });

  it("splits the children into two panels flanking the trigger for side='center'", () => {
    const { container } = renderToolbar("center");
    const panels = getPanels(container);

    expect(panels).toHaveLength(2);
    expect(panels[0].textContent).toBe("OneTwo");
    expect(panels[1].textContent).toBe("ThreeFour");

    // The trigger sits between the two panels in the DOM.
    const toolbar = container.querySelector(
      "[data-slot='expandable-toolbar']",
    ) as HTMLElement;
    const slots = Array.from(toolbar.children).map((child) =>
      child.getAttribute("data-slot"),
    );

    expect(slots).toEqual([
      "expandable-toolbar-panel",
      "expandable-toolbar-trigger-wrapper",
      "expandable-toolbar-panel",
    ]);

    // The trigger announces both panels.
    const trigger = screen.getByRole("button", { name: "Expand actions" });

    expect(trigger.getAttribute("aria-controls")).toBe(
      `${panels[0].id} ${panels[1].id}`,
    );
  });

  it("opens and closes both center panels together", () => {
    const { container } = renderToolbar("center");
    const panels = getPanels(container);

    for (const panel of panels) {
      expect(panel.getAttribute("aria-hidden")).toBe("true");
      expect(panel.getAttribute("data-state")).toBe("closed");
    }

    fireEvent.click(screen.getByRole("button", { name: "Expand actions" }));

    for (const panel of getPanels(container)) {
      expect(panel.getAttribute("aria-hidden")).toBe("false");
      expect(panel.getAttribute("data-state")).toBe("open");
    }

    fireEvent.click(screen.getByRole("button", { name: "Collapse actions" }));

    for (const panel of getPanels(container)) {
      expect(panel.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("reports controlled open changes without mutating its own state", () => {
    const onOpenChange = vi.fn();

    render(
      <ExpandableToolbar
        open={false}
        onOpenChange={onOpenChange}
        side="center"
        anchor="toolbar"
        expandIcon={<span>+</span>}
        expandLabel="Expand actions"
        collapseLabel="Collapse actions"
      >
        <button type="button">One</button>
        <button type="button">Two</button>
      </ExpandableToolbar>,
    );

    const trigger = screen.getByRole("button", { name: "Expand actions" });

    fireEvent.click(trigger);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});
