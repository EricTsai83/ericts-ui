// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdaptiveSwitch } from "@/registry/base/ui/adaptive-switch";

afterEach(cleanup);

describe("AdaptiveSwitch", () => {
  it("renders the initial checked position without enabling animations", () => {
    const markup = renderToString(
      <AdaptiveSwitch
        aria-label="Initial state"
        checkedLabel="Live"
        uncheckedLabel="Paused"
        defaultChecked
      />,
    );

    expect(markup).toContain('data-animated="false"');
    expect(markup).toContain(
      'style="transform:translateX(100%);transform-origin:100% 50% 0"',
    );
    expect(markup).not.toContain("will-change-transform");
  });

  it("reveals the matching text while toggling in uncontrolled mode", () => {
    const onCheckedChange = vi.fn();

    render(
      <AdaptiveSwitch
        aria-label="Deployment status"
        checkedLabel="Live"
        uncheckedLabel="Paused"
        onCheckedChange={onCheckedChange}
      />,
    );

    const control = screen.getByRole("switch", {
      name: "Deployment status",
    });
    const checkedLabel = control.querySelector(
      "[data-slot='adaptive-switch-checked-label']",
    );
    const uncheckedLabel = control.querySelector(
      "[data-slot='adaptive-switch-unchecked-label']",
    );
    const thumbVisual = control.querySelector<HTMLElement>(
      "[data-slot='adaptive-switch-thumb-visual']",
    );

    expect(control.getAttribute("data-unchecked")).toBe("");
    expect(control.getAttribute("data-with-labels")).toBe("true");
    expect(control.getAttribute("data-animation")).toBe("elastic");
    expect(checkedLabel?.getAttribute("aria-hidden")).toBe("true");
    expect(uncheckedLabel?.textContent).toBe("Paused");

    fireEvent.click(control);

    expect(control.getAttribute("data-checked")).toBe("");
    expect(control.getAttribute("data-animated")).toBe("true");
    expect(thumbVisual?.getAttribute("aria-hidden")).toBe("true");
    expect(thumbVisual?.className).toContain("will-change-transform");
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("supports a conventional switch when labels are omitted", () => {
    render(<AdaptiveSwitch aria-label="Notifications" defaultChecked />);

    const control = screen.getByRole("switch", { name: "Notifications" });
    const thumb = control.querySelector(
      "[data-slot='adaptive-switch-thumb']",
    );
    const thumbVisual = control.querySelector(
      "[data-slot='adaptive-switch-thumb-visual']",
    );

    expect(control.getAttribute("data-checked")).toBe("");
    expect(control.getAttribute("data-with-labels")).toBe("false");
    expect(control.getAttribute("data-animation")).toBe("smooth");
    expect(control.className).toContain(
      "transition-[background-color,border-color,box-shadow]",
    );
    expect(control.className).toContain("cursor-pointer");
    expect(control.className).toContain("data-disabled:cursor-not-allowed");
    expect(control.className).toContain("data-readonly:cursor-default");
    expect(thumb?.className).toContain("group/adaptive-switch-thumb");
    expect(thumb?.className).not.toContain("transition-transform");
    expect(thumb?.className).not.toContain("background-color");
    expect(thumbVisual?.className).not.toContain("will-change-transform");
    expect(
      control.querySelector("[data-slot='adaptive-switch-checked-label']"),
    ).toBeNull();
  });

  it("supports explicit elastic and motionless modes", () => {
    const { rerender } = render(
      <AdaptiveSwitch
        aria-label="Deployment status"
        checkedLabel="Live"
        uncheckedLabel="Paused"
        animation="none"
      />,
    );

    expect(
      screen
        .getByRole("switch", { name: "Deployment status" })
        .getAttribute("data-animation"),
    ).toBe("none");

    rerender(
      <AdaptiveSwitch aria-label="Compact status" animation="elastic" />,
    );

    expect(
      screen
        .getByRole("switch", { name: "Compact status" })
        .getAttribute("data-animation"),
    ).toBe("elastic");
  });

  it("renders a large conventional switch without animation", () => {
    render(
      <AdaptiveSwitch
        aria-label="Large switch"
        size="lg"
        animation="none"
      />,
    );

    const control = screen.getByRole("switch", { name: "Large switch" });
    const thumb = control.querySelector(
      "[data-slot='adaptive-switch-thumb']",
    );
    const thumbVisual = control.querySelector(
      "[data-slot='adaptive-switch-thumb-visual']",
    );

    expect(control.getAttribute("data-size")).toBe("lg");
    expect(control.getAttribute("data-animation")).toBe("none");
    expect(control.className).toContain(
      "data-[animation=none]:transition-none",
    );
    expect(thumb?.className).toContain(
      "group-data-[size=lg]/adaptive-switch:size-6",
    );
    expect(thumbVisual?.className).not.toContain("will-change-transform");
  });

  it("reports controlled changes without mutating the checked state", () => {
    const onCheckedChange = vi.fn();

    render(
      <AdaptiveSwitch
        aria-label="Deployment status"
        checked={false}
        checkedLabel="Live"
        uncheckedLabel="Paused"
        onCheckedChange={onCheckedChange}
      />,
    );

    const control = screen.getByRole("switch", {
      name: "Deployment status",
    });

    fireEvent.click(control);

    expect(control.getAttribute("data-unchecked")).toBe("");
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it("does not change when disabled", () => {
    const onCheckedChange = vi.fn();

    render(
      <AdaptiveSwitch
        aria-label="Deployment status"
        disabled
        onCheckedChange={onCheckedChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("switch", { name: "Deployment status" }),
    );

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
