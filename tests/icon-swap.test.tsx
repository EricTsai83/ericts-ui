// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IconSwap as CssOnlyIconSwap } from "@/registry/base/css-only/icon-swap";
import { IconSwap } from "@/registry/base/ui/icon-swap";

vi.mock("@/registry/base/css-only/icon-swap.css", () => ({}));

afterEach(cleanup);

describe("IconSwap", () => {
  it("keeps both synchronized icon layers under a stable root", () => {
    const { container, rerender } = render(
      <IconSwap
        active={false}
        icon={<span data-testid="inactive-icon" />}
        activeIcon={<span data-testid="active-icon" />}
      />,
    );
    const root = container.querySelector('[data-slot="icon-swap"]');
    const inactiveLayer = container.querySelector(
      '[data-slot="icon-swap-icon"]',
    );
    const activeLayer = container.querySelector(
      '[data-slot="icon-swap-active-icon"]',
    );

    expect(inactiveLayer?.getAttribute("data-state")).toBe("open");
    expect(activeLayer?.getAttribute("data-state")).toBe("closed");

    rerender(
      <IconSwap
        active
        icon={<span data-testid="inactive-icon" />}
        activeIcon={<span data-testid="active-icon" />}
      />,
    );

    expect(container.querySelector('[data-slot="icon-swap"]')).toBe(root);
    expect(container.querySelector('[data-slot="icon-swap-icon"]')).toBe(
      inactiveLayer,
    );
    expect(
      container.querySelector('[data-slot="icon-swap-active-icon"]'),
    ).toBe(activeLayer);
    expect(inactiveLayer?.getAttribute("data-state")).toBe("closed");
    expect(activeLayer?.getAttribute("data-state")).toBe("open");
  });

  it("forwards root props and exposes non-animated state", () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <IconSwap
        ref={ref}
        active
        animated={false}
        icon={<span />}
        activeIcon={<span />}
        data-testid="swap"
      />,
    );

    expect(ref.current).toBe(container.querySelector('[data-testid="swap"]'));
    expect(ref.current?.getAttribute("aria-hidden")).toBe("true");
    expect(ref.current?.getAttribute("data-state")).toBe("active");
    expect(ref.current?.getAttribute("data-animated")).toBe("false");
  });

  it("keeps the CSS-only API and state contract aligned", () => {
    const { container, rerender } = render(
      <CssOnlyIconSwap
        active={false}
        duration={220}
        icon={<span />}
        activeIcon={<span />}
      />,
    );
    const root = container.querySelector<HTMLElement>(
      '[data-slot="icon-swap"]',
    );
    const inactiveLayer = container.querySelector(
      '[data-slot="icon-swap-icon"]',
    );

    expect(root?.style.getPropertyValue("--icon-swap-duration")).toBe(
      "220ms",
    );
    expect(inactiveLayer?.getAttribute("data-state")).toBe("open");

    rerender(
      <CssOnlyIconSwap
        active
        animated={false}
        icon={<span />}
        activeIcon={<span />}
      />,
    );

    expect(root?.getAttribute("data-state")).toBe("active");
    expect(root?.getAttribute("data-animated")).toBe("false");
    // Without an explicit duration prop the stylesheet defaults own the
    // timing, so no inline custom property should block CSS overrides.
    expect(root?.style.getPropertyValue("--icon-swap-duration")).toBe("");
    expect(inactiveLayer?.getAttribute("data-state")).toBe("closed");
  });
});
