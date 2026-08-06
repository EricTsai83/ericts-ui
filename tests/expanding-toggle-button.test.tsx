// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ExpandingToggleButton } from "@/registry/base/ui/expanding-toggle-button";

afterEach(cleanup);

describe("ExpandingToggleButton", () => {
  it("toggles its active state in uncontrolled mode", () => {
    const onActiveChange = vi.fn();

    render(
      <ExpandingToggleButton
        icon={<span>+</span>}
        activeIcon={<span>−</span>}
        label="Expanded action"
        inactiveLabel="Expand action"
        activeLabel="Collapse action"
        onActiveChange={onActiveChange}
      />,
    );

    const button = screen.getByRole("button", { name: "Expand action" });
    const anchor = button.closest(
      "[data-slot='expanding-toggle-button-anchor']",
    ) as HTMLElement | null;

    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.style.width).toBe("36px");
    expect(anchor?.style.width).toBe("36px");
    expect(button.className).toContain("border-border");

    fireEvent.click(button);

    expect(
      screen.getByRole("button", { name: "Collapse action" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(onActiveChange).toHaveBeenCalledWith(true);
  });

  it("reports controlled changes without mutating the active state", () => {
    const onActiveChange = vi.fn();

    render(
      <ExpandingToggleButton
        active={false}
        icon={<span>+</span>}
        label="Expanded action"
        inactiveLabel="Expand action"
        activeLabel="Collapse action"
        onActiveChange={onActiveChange}
      />,
    );

    const button = screen.getByRole("button", { name: "Expand action" });

    fireEvent.click(button);

    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(onActiveChange).toHaveBeenCalledWith(true);
  });

  it.each([
    "default",
    "outline",
    "secondary",
    "ghost",
    "destructive",
    "link",
  ] as const)("keeps the %s variant after expansion", (variant) => {
    render(
      <ExpandingToggleButton
        variant={variant}
        icon={<span>+</span>}
        label="Expanded action"
        inactiveLabel="Expand action"
        activeLabel="Collapse action"
      />,
    );

    const button = screen.getByRole("button", { name: "Expand action" });
    const initialClassName = button.className;

    fireEvent.click(button);

    expect(
      screen.getByRole("button", { name: "Collapse action" }).className,
    ).toBe(initialClassName);
  });

  it("respects a prevented click without changing state", () => {
    const onActiveChange = vi.fn();

    render(
      <ExpandingToggleButton
        icon={<span>+</span>}
        label="Expanded action"
        inactiveLabel="Expand action"
        activeLabel="Collapse action"
        onClick={(event) => event.preventDefault()}
        onActiveChange={onActiveChange}
      />,
    );

    const button = screen.getByRole("button", { name: "Expand action" });

    fireEvent.click(button);

    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(onActiveChange).not.toHaveBeenCalled();
  });
});
