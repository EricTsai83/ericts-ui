// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArcMenu, ArcMenuAction } from "@/registry/base/ui/arc-menu";

// Motion caches this media query per module registry, so reduced-motion
// behavior stays in its own test file rather than sharing the default suite.
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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ArcMenu under reduced motion", () => {
  it("keeps actions at their destinations and crossfades the trigger icons", () => {
    const { container } = render(
      <ArcMenu>
        <ArcMenuAction label="Document" icon={<span />} />
        <ArcMenuAction label="Image" icon={<span />} />
        <ArcMenuAction label="Folder" icon={<span />} />
      </ArcMenu>,
    );

    const actionSlot = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-action-slot']",
    );
    const triggerFace = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-trigger-face']",
    );
    const closeIcon = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-close-icon']",
    );

    expect(actionSlot?.style.transform).not.toBe(
      "translate3d(0px, 0px, 0) scale(0.94)",
    );
    expect(triggerFace?.style.filter).toBe("blur(0px)");
    expect(closeIcon?.style.filter).toBe("blur(0px)");
  });
});
