// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/blocks/scroll-expand.css", () => ({}));

import {
  ScrollExpand,
  ScrollExpandItem,
} from "@/registry/base/blocks/scroll-expand";

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

beforeEach(() => {
  globalThis.ResizeObserver = ResizeObserverMock;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(
      () =>
        ({
          matches: false,
          media: "(prefers-reduced-motion: reduce)",
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        }) as MediaQueryList,
    ),
  );
});

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalResizeObserver;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ScrollExpand", () => {
  it("sizes its track and reveals full-bleed content at progress one", () => {
    const { container } = render(
      <ScrollExpand
        src="/hero.jpg"
        alt="Product hero"
        title="Built to scale"
        scrollHint="Scroll"
        startPosition={{ x: 70, y: 40 }}
        titleAlign="start"
        titleClassName="demo-title"
        contentAlign="start"
        contentPosition="bottom"
        smoothing={0}
      >
        <ScrollExpandItem start={0.7} end={0.9} offsetY={20}>
          <button type="button">Explore</button>
        </ScrollExpandItem>
      </ScrollExpand>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='scroll-expand']",
    );
    const track = container.querySelector<HTMLElement>(
      ".scroll-expand__track",
    );
    const stage = container.querySelector<HTMLElement>(
      ".scroll-expand__stage",
    );
    const frame = container.querySelector<HTMLElement>(
      ".scroll-expand__frame",
    );
    const media = container.querySelector<HTMLElement>(
      ".scroll-expand__media",
    );
    const overlay = container.querySelector<HTMLElement>(
      ".scroll-expand__overlay",
    );
    const item = container.querySelector<HTMLElement>(
      ".scroll-expand__item",
    );
    const title = container.querySelector<HTMLElement>(
      ".scroll-expand__title",
    );

    expect(root).toBeTruthy();
    expect(track).toBeTruthy();
    expect(stage).toBeTruthy();
    expect(frame).toBeTruthy();
    expect(media).toBeTruthy();
    expect(overlay?.hasAttribute("inert")).toBe(true);
    expect(item).toBeTruthy();
    expect(title?.classList.contains("demo-title")).toBe(true);

    Object.defineProperty(root, "clientHeight", {
      configurable: true,
      value: 500,
    });
    fireEvent(window, new Event("resize"));

    expect(stage?.style.height).toBe("500px");
    expect(track?.style.height).toBe("1275px");
    expect(frame?.style.clipPath).toBe(
      "inset(11% 9% 31% 49% round 24px)",
    );
    expect(overlay?.dataset.align).toBe("start");
    expect(overlay?.dataset.position).toBe("bottom");

    if (root) {
      root.scrollTop = 600;
      fireEvent.scroll(root);
    }

    expect(frame?.style.clipPath).toBe("inset(0% 0% 0% 0% round 0px)");
    expect(media?.style.transform).toBe("scale(1)");
    expect(overlay?.getAttribute("aria-hidden")).toBe("false");
    expect(overlay?.hasAttribute("inert")).toBe(false);
    expect(item?.style.opacity).toBe("1");
    expect(item?.style.transform).toBe("translate3d(0, 0px, 0) scale(1)");
  });

  it("removes the extra scroll track when expansion is disabled", () => {
    const { container } = render(
      <ScrollExpand src="/hero.jpg" enabled={false} />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='scroll-expand']",
    );
    const track = container.querySelector<HTMLElement>(
      ".scroll-expand__track",
    );

    Object.defineProperty(root, "clientHeight", {
      configurable: true,
      value: 420,
    });
    fireEvent(window, new Event("resize"));

    expect(root?.classList.contains("scroll-expand--scroller")).toBe(false);
    expect(track?.style.height).toBe("420px");
  });

  it("focuses from full bleed into the configured detail frame", () => {
    const { container } = render(
      <ScrollExpand
        src="/hero.jpg"
        direction="focus"
        mediaZoom={1.5}
        mediaTransformOrigin="left center"
        smoothing={0}
      >
        <p>Detail</p>
      </ScrollExpand>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='scroll-expand']",
    );
    const frame = container.querySelector<HTMLElement>(
      ".scroll-expand__frame",
    );
    const media = container.querySelector<HTMLElement>(
      ".scroll-expand__media",
    );
    const overlay = container.querySelector<HTMLElement>(
      ".scroll-expand__overlay",
    );

    Object.defineProperty(root, "clientHeight", {
      configurable: true,
      value: 500,
    });
    fireEvent(window, new Event("resize"));

    expect(root?.dataset.direction).toBe("focus");
    expect(frame?.style.clipPath).toBe(
      "inset(0% 0% 0% 0% round 0px)",
    );
    expect(media?.style.transform).toBe("scale(1)");
    expect(media?.style.transformOrigin).toBe("left center");

    if (root) {
      root.scrollTop = 600;
      fireEvent.scroll(root);
    }

    expect(frame?.style.clipPath).toBe(
      "inset(21% 29% 21% 29% round 24px)",
    );
    expect(media?.style.transform).toBe("scale(1.5)");
    expect(overlay?.getAttribute("aria-hidden")).toBe("false");
    expect(overlay?.hasAttribute("inert")).toBe(false);
  });

  it("focuses into a measured circle while keeping content on the stage", () => {
    const { container } = render(
      <ScrollExpand
        src="/hero.jpg"
        direction="focus"
        frameShape="circle"
        contentLayer="stage"
        startWidth={50}
        startHeight={60}
        startPosition={{ x: 70, y: 50 }}
        smoothing={0}
      >
        <p>Outside detail</p>
      </ScrollExpand>,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='scroll-expand']",
    );
    const stage = container.querySelector<HTMLElement>(
      ".scroll-expand__stage",
    );
    const frame = container.querySelector<HTMLElement>(
      ".scroll-expand__frame",
    );
    const overlay = container.querySelector<HTMLElement>(
      ".scroll-expand__overlay",
    );

    Object.defineProperties(root, {
      clientWidth: { configurable: true, value: 800 },
      clientHeight: { configurable: true, value: 500 },
    });
    fireEvent(window, new Event("resize"));

    if (root) {
      root.scrollTop = 600;
      fireEvent.scroll(root);
    }

    expect(root?.dataset.frameShape).toBe("circle");
    expect(frame?.style.clipPath).toBe(
      "inset(100px 90px 100px 410px round 150px)",
    );
    expect(overlay?.dataset.layer).toBe("stage");
    expect(stage?.contains(overlay ?? null)).toBe(true);
    expect(frame?.contains(overlay ?? null)).toBe(false);
  });
});
