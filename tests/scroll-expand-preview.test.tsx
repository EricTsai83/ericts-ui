// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/blocks/scroll-expand.css", () => ({}));

import Preview from "@/components/previews/scroll-expand";

class ResizeObserverMock implements ResizeObserver {
  readonly observe = vi.fn<(target: Element) => void>();
  readonly unobserve = vi.fn<(target: Element) => void>();
  readonly disconnect = vi.fn<() => void>();

  constructor(callback: ResizeObserverCallback) {
    void callback;
  }

  takeRecords() {
    return [];
  }
}

const originalResizeObserver = globalThis.ResizeObserver;

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(
      (query: string) =>
        ({
          matches:
            query === "(prefers-reduced-motion: reduce)" ? reduce : false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        }) as MediaQueryList,
    ),
  );
}

beforeEach(() => {
  globalThis.ResizeObserver = ResizeObserverMock;
});

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalResizeObserver;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ScrollExpand preview", () => {
  it("shows the scroll hint while motion is allowed", () => {
    stubReducedMotion(false);
    const { container } = render(<Preview variant="default" />);

    expect(screen.getByText("Scroll down")).toBeTruthy();
    expect(screen.queryByText("Reduced motion")).toBeNull();
    expect(
      container
        .querySelector("[data-slot='scroll-expand']")
        ?.getAttribute("data-motion"),
    ).toBe("enabled");
  });

  it("names the reduced-motion mode and offers a way past it", () => {
    stubReducedMotion(true);
    const { container } = render(<Preview variant="default" />);
    const root = container.querySelector("[data-slot='scroll-expand']");

    expect(screen.getByText("Reduced motion")).toBeTruthy();
    expect(screen.queryByText("Scroll down")).toBeNull();
    expect(root?.getAttribute("data-motion")).toBe("disabled");

    fireEvent.click(screen.getByRole("button", { name: "Play anyway" }));

    expect(root?.getAttribute("data-motion")).toBe("enabled");
    expect(screen.queryByText("Reduced motion")).toBeNull();
    expect(screen.getByText("Scroll down")).toBeTruthy();
  });
});
