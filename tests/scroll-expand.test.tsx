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

const MEDIA_WIDTH = 1672;
const MEDIA_HEIGHT = 941;

/**
 * Resolves where the media's own subject lands on the stage and where the frame
 * is centred, so the two can be compared at any stage aspect ratio. Because the
 * zoom pivots on the subject, its stage position is `origin + offset` and does
 * not depend on the current scale.
 */
function readFocalAlignment(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>(
    "[data-slot='scroll-expand']",
  )!;
  const frame = container.querySelector<HTMLElement>(
    ".scroll-expand__frame",
  )!;
  const media = container.querySelector<HTMLElement>(
    ".scroll-expand__media",
  )!;

  const stageWidth = root.clientWidth;
  const stageHeight = root.clientHeight;
  const insets = [
    ...frame.style.clipPath.matchAll(/(-?[\d.]+)%/g),
  ].map((match) => Number(match[1]));
  const [insetTop, insetRight, insetBottom, insetLeft] = insets;
  const transform = media.style.transform.match(
    /translate3d\((-?[\d.]+)px, (-?[\d.]+)px, 0\) scale\(([\d.]+)\)/,
  )!;
  const offsetX = Number(transform[1]);
  const offsetY = Number(transform[2]);
  const scale = Number(transform[3]);
  const [originX, originY] = media.style.transformOrigin
    .split(" ")
    .map(Number.parseFloat);
  const boxWidth = Number.parseFloat(media.style.width);
  const boxHeight = Number.parseFloat(media.style.height);

  return {
    aspect: boxWidth / boxHeight,
    focal: { x: originX + offsetX, y: originY + offsetY },
    frameCenter: {
      x:
        ((insetLeft / 100) * stageWidth +
          stageWidth -
          (insetRight / 100) * stageWidth) /
        2,
      y:
        ((insetTop / 100) * stageHeight +
          stageHeight -
          (insetBottom / 100) * stageHeight) /
        2,
    },
    // A transform of translate(d) scale(z) about origin O maps the box edges to
    // O + d + z * (edge - O).
    coverage: {
      left: originX + offsetX - scale * originX,
      right: originX + offsetX + scale * (boxWidth - originX),
      top: originY + offsetY - scale * originY,
      bottom: originY + offsetY + scale * (boxHeight - originY),
    },
    stage: { width: stageWidth, height: stageHeight },
  };
}

function renderFocalStage(size: { width: number; height: number }) {
  const focal = { x: 70, y: 43 };
  const { container } = render(
    <ScrollExpand
      src="/hero.jpg"
      direction="focus"
      focalPoint={focal}
      startWidth={38}
      startHeight={64}
      startPosition={{ x: 73, y: 50 }}
      mediaZoom={1.3}
      smoothing={0}
    />,
  );
  const root = container.querySelector<HTMLElement>(
    "[data-slot='scroll-expand']",
  )!;
  const image = container.querySelector<HTMLImageElement>("img")!;

  Object.defineProperties(root, {
    clientWidth: { configurable: true, value: size.width },
    clientHeight: { configurable: true, value: size.height },
  });
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: MEDIA_WIDTH },
    naturalHeight: { configurable: true, value: MEDIA_HEIGHT },
  });

  fireEvent.load(image);

  return { container, root, focal };
}

describe("ScrollExpand focal point", () => {
  it.each([
    ["a wide stage", { width: 900, height: 400 }],
    ["a narrow stage", { width: 400, height: 600 }],
    ["a square stage", { width: 600, height: 600 }],
  ])("lands the subject under the frame on %s", (_label, size) => {
    const { container, root } = renderFocalStage(size);

    root.scrollTop = 99999;
    fireEvent.scroll(root);

    const { focal: onStage, frameCenter } = readFocalAlignment(container);

    expect(onStage.x).toBeCloseTo(frameCenter.x, 1);
    expect(onStage.y).toBeCloseTo(frameCenter.y, 1);
  });

  it("scales the media without ever panning it", () => {
    const { container, root } = renderFocalStage({
      width: 900,
      height: 400,
    });
    const offsets: string[] = [];
    const scales: number[] = [];
    const frame: number[] = [];

    for (const scrollTop of [0, 200, 400, 600, 800, 99999]) {
      root.scrollTop = scrollTop;
      fireEvent.scroll(root);

      const media = container.querySelector<HTMLElement>(
        ".scroll-expand__media",
      )!;
      const transform = media.style.transform.match(
        /translate3d\((-?[\d.]+)px, (-?[\d.]+)px, 0\) scale\(([\d.]+)\)/,
      )!;

      offsets.push(`${transform[1]},${transform[2]}`);
      scales.push(Number(transform[3]));
      frame.push(readFocalAlignment(container).frameCenter.x);
    }

    // The frame sweeps across the stage and the media zooms, but the translation
    // never changes — the subject is parked on its target from the first pixel
    // of scroll, so there is no residual pan for the eye to catch.
    expect(frame.at(-1)! - frame[0]).toBeGreaterThan(150);
    expect(new Set(offsets).size).toBe(1);
    expect(scales.at(-1)).toBeGreaterThan(scales[0]);
  });

  it("never lets the stage see past the edge of the media", () => {
    const { container, root } = renderFocalStage({
      width: 900,
      height: 400,
    });

    for (const scrollTop of [0, 200, 480, 760, 99999]) {
      root.scrollTop = scrollTop;
      fireEvent.scroll(root);

      const { coverage, stage } = readFocalAlignment(container);

      expect(coverage.left).toBeLessThanOrEqual(0.001);
      expect(coverage.top).toBeLessThanOrEqual(0.001);
      expect(coverage.right).toBeGreaterThanOrEqual(stage.width - 0.001);
      expect(coverage.bottom).toBeGreaterThanOrEqual(stage.height - 0.001);
    }
  });

  it.each([
    ["wide", { width: 900, height: 400 }],
    ["narrow", { width: 400, height: 600 }],
  ])("keeps the media's own aspect ratio on a %s stage", (_label, size) => {
    const { container } = renderFocalStage(size);

    expect(readFocalAlignment(container).aspect).toBeCloseTo(
      MEDIA_WIDTH / MEDIA_HEIGHT,
      3,
    );
  });

  it("grows the box past a minimal cover so the offset needs no clamping", () => {
    const { container } = renderFocalStage({ width: 900, height: 400 });
    const media = container.querySelector<HTMLElement>(
      ".scroll-expand__media",
    )!;

    // A minimal cover would be 900 wide (900 / 1672 beats 400 / 941). The
    // binding constraint is instead the stage's left edge: the subject sits 70%
    // across the media and has to reach the resting frame centre at x = 657, so
    // the box needs 657 / 0.7 = 938.571 of width to still cover the stage.
    expect(media.style.width).toBe("938.571px");
    expect(media.style.height).toBe("528.227px");
    // Left as `cover` so an unsized box still crops instead of stretching.
    expect(media.style.objectFit).toBe("");
    expect(media.style.transformOrigin).toBe("657px 227.138px");
  });

  it("falls back to the coverage clamp when the subject cannot reach its target", () => {
    // A subject flush against the left edge of the media can never sit at 73% of
    // the stage, so the box stops growing and the clamp keeps the stage covered.
    const { container } = render(
      <ScrollExpand
        src="/hero.jpg"
        direction="focus"
        focalPoint={{ x: 0, y: 43 }}
        startWidth={38}
        startHeight={64}
        startPosition={{ x: 73, y: 50 }}
        mediaZoom={1.3}
        smoothing={0}
      />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='scroll-expand']",
    )!;
    const image = container.querySelector<HTMLImageElement>("img")!;

    Object.defineProperties(root, {
      clientWidth: { configurable: true, value: 900 },
      clientHeight: { configurable: true, value: 400 },
    });
    Object.defineProperties(image, {
      naturalWidth: { configurable: true, value: MEDIA_WIDTH },
      naturalHeight: { configurable: true, value: MEDIA_HEIGHT },
    });
    fireEvent.load(image);

    for (const scrollTop of [0, 400, 99999]) {
      root.scrollTop = scrollTop;
      fireEvent.scroll(root);

      const { coverage, stage } = readFocalAlignment(container);

      expect(coverage.left).toBeLessThanOrEqual(0.001);
      expect(coverage.right).toBeGreaterThanOrEqual(stage.width - 0.001);
    }
  });

  it("keeps the plain scale transform when no focal point is given", () => {
    const { container } = render(
      <ScrollExpand src="/hero.jpg" mediaZoom={1.4} smoothing={0} />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='scroll-expand']",
    )!;
    const media = container.querySelector<HTMLElement>(
      ".scroll-expand__media",
    )!;

    Object.defineProperty(root, "clientHeight", {
      configurable: true,
      value: 500,
    });
    fireEvent(window, new Event("resize"));

    expect(media.style.transform).toBe("scale(1.4)");
    expect(media.style.width).toBe("");
  });
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

  it("swaps in compact overrides once the stage is narrow", () => {
    const { container } = render(
      <ScrollExpand
        src="/hero.jpg"
        startWidth={38}
        startHeight={64}
        startPosition={{ x: 73, y: 50 }}
        scrollDistance={1.2}
        holdDistance={0}
        compact={{
          startWidth: 80,
          startHeight: 40,
          startPosition: { x: 50, y: 32 },
          scrollDistance: 0.85,
        }}
        compactAt={640}
        smoothing={0}
      />,
    );
    const root = container.querySelector<HTMLElement>(
      "[data-slot='scroll-expand']",
    );
    const track = container.querySelector<HTMLElement>(
      ".scroll-expand__track",
    );
    const frame = container.querySelector<HTMLElement>(
      ".scroll-expand__frame",
    );

    Object.defineProperties(root, {
      clientWidth: { configurable: true, value: 900 },
      clientHeight: { configurable: true, value: 500 },
    });
    fireEvent(window, new Event("resize"));

    expect(root?.dataset.size).toBe("regular");
    expect(frame?.style.clipPath).toBe("inset(18% 8% 18% 54% round 24px)");
    expect(track?.style.height).toBe("1100px");

    Object.defineProperty(root, "clientWidth", {
      configurable: true,
      value: 390,
    });
    fireEvent(window, new Event("resize"));

    expect(root?.dataset.size).toBe("compact");
    expect(frame?.style.clipPath).toBe("inset(12% 10% 48% 10% round 24px)");
    expect(track?.style.height).toBe("925px");
  });

  it("settles focus on the detail frame when motion is disabled", () => {
    const { container } = render(
      <ScrollExpand src="/hero.jpg" direction="focus" enabled={false} />,
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

    Object.defineProperty(root, "clientHeight", {
      configurable: true,
      value: 500,
    });
    fireEvent(window, new Event("resize"));

    expect(root?.dataset.motion).toBe("disabled");
    expect(frame?.style.clipPath).toBe("inset(21% 29% 21% 29% round 24px)");
    expect(media?.style.transform).toBe("scale(1.35)");
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
