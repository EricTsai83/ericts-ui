// @vitest-environment jsdom
import { useCallback, type MutableRefObject } from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  scrollAnchorEasings,
  useScrollAnchor,
  type UseScrollAnchorOptions,
} from "@/registry/base/hooks/use-scroll-anchor";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

type Layout = {
  containerTop: number;
  clientHeight: number;
  customTargetTop: number;
  scrollHeight: number;
  targetHeight: number;
  targetTop: number;
};

type ScrollAnchorHarnessProps = Pick<
  UseScrollAnchorOptions<HTMLDivElement>,
  | "activeKey"
  | "animate"
  | "duration"
  | "easing"
  | "enabled"
  | "getTarget"
  | "onSettled"
  | "respectReducedMotion"
> & {
  layout: MutableRefObject<Layout>;
};

function ScrollAnchorHarness({
  activeKey,
  animate,
  enabled = true,
  getTarget,
  layout,
  onSettled,
  duration = 100,
  easing = scrollAnchorEasings.linear,
  respectReducedMotion,
}: ScrollAnchorHarnessProps) {
  const { containerRef, scrollActiveIntoView } =
    useScrollAnchor<HTMLDivElement>({
      activeKey,
      anchorRatio: 0.5,
      animate,
      duration,
      easing,
      enabled,
      getTarget,
      onSettled,
      respectReducedMotion,
    });

  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;

      if (!node) return;

      Object.defineProperties(node, {
        clientHeight: {
          configurable: true,
          get: () => layout.current.clientHeight,
        },
        scrollHeight: {
          configurable: true,
          get: () => layout.current.scrollHeight,
        },
      });

      node.getBoundingClientRect = () =>
        rectAt(layout.current.containerTop, layout.current.clientHeight);
    },
    [containerRef, layout],
  );

  const setTargetRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      node.getBoundingClientRect = () =>
        rectAt(layout.current.targetTop, layout.current.targetHeight);
    },
    [layout],
  );

  const setCustomTargetRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      node.getBoundingClientRect = () =>
        rectAt(layout.current.customTargetTop, layout.current.targetHeight);
    },
    [layout],
  );

  return (
    <>
      <button
        data-testid="reanchor"
        onClick={() => scrollActiveIntoView({ animate: false })}
        type="button"
      >
        Re-anchor
      </button>
      <div ref={setContainerRef} data-testid="container">
        <div ref={setCustomTargetRef} data-custom-anchor />
        <div ref={setTargetRef} data-scroll-anchor />
      </div>
    </>
  );
}

function createLayout(overrides: Partial<Layout> = {}) {
  return {
    current: {
      containerTop: 0,
      clientHeight: 200,
      customTargetTop: 0,
      scrollHeight: 1000,
      targetHeight: 40,
      targetTop: 0,
      ...overrides,
    },
  };
}

function rectAt(top: number, height: number): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    right: 100,
    bottom: top + height,
    left: 0,
    width: 100,
    height,
    toJSON: () => ({}),
  };
}

function installAnimationFrameMock() {
  let nextId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = nextId;
    nextId += 1;
    callbacks.set(id, callback);
    return id;
  });
  const cancelAnimationFrame = vi.fn((id: number) => {
    callbacks.delete(id);
  });

  vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
  vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

  return {
    callbacks,
    cancelAnimationFrame,
    requestAnimationFrame,
    runFrame(now: number) {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(now));
    },
  };
}

describe("useScrollAnchor", () => {
  it("places the first target instantly and clamps it to the scroll range", () => {
    const animationFrame = installAnimationFrameMock();
    const layout = createLayout({ targetTop: 2000 });
    const onSettled = vi.fn();

    const view = render(
      <ScrollAnchorHarness
        activeKey="first"
        layout={layout}
        onSettled={onSettled}
      />,
    );
    const container = view.getByTestId("container");

    expect(container.scrollTop).toBe(800);
    expect(animationFrame.requestAnimationFrame).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("animates later key changes with the configured duration and easing", () => {
    const animationFrame = installAnimationFrameMock();
    const layout = createLayout();
    const onSettled = vi.fn();

    const view = render(
      <ScrollAnchorHarness
        activeKey="first"
        layout={layout}
        onSettled={onSettled}
      />,
    );
    const container = view.getByTestId("container");
    onSettled.mockClear();
    layout.current.targetTop = 500;

    view.rerender(
      <ScrollAnchorHarness
        activeKey="second"
        layout={layout}
        onSettled={onSettled}
      />,
    );

    expect(animationFrame.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(container.scrollTop).toBe(0);

    act(() => animationFrame.runFrame(0));
    act(() => animationFrame.runFrame(50));

    expect(container.scrollTop).toBe(210);
    expect(onSettled).not.toHaveBeenCalled();

    act(() => animationFrame.runFrame(100));

    expect(container.scrollTop).toBe(420);
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("resolves function durations from the absolute scroll distance", () => {
    const animationFrame = installAnimationFrameMock();
    const duration = vi.fn(() => 200);
    const layout = createLayout();

    const view = render(
      <ScrollAnchorHarness
        activeKey="first"
        duration={duration}
        layout={layout}
      />,
    );
    const container = view.getByTestId("container");
    duration.mockClear();
    layout.current.targetTop = 500;

    view.rerender(
      <ScrollAnchorHarness
        activeKey="second"
        duration={duration}
        layout={layout}
      />,
    );

    expect(duration).toHaveBeenCalledWith(420);

    act(() => animationFrame.runFrame(0));
    act(() => animationFrame.runFrame(100));
    expect(container.scrollTop).toBe(210);

    act(() => animationFrame.runFrame(200));
    expect(container.scrollTop).toBe(420);
  });

  it("jumps instantly when the user prefers reduced motion", () => {
    const animationFrame = installAnimationFrameMock();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );
    const layout = createLayout();
    const onSettled = vi.fn();

    const view = render(
      <ScrollAnchorHarness
        activeKey="first"
        layout={layout}
        onSettled={onSettled}
      />,
    );
    const container = view.getByTestId("container");
    onSettled.mockClear();
    layout.current.targetTop = 500;

    view.rerender(
      <ScrollAnchorHarness
        activeKey="second"
        layout={layout}
        onSettled={onSettled}
      />,
    );

    expect(container.scrollTop).toBe(420);
    expect(animationFrame.requestAnimationFrame).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledTimes(1);
  });

  it("animates when reduced-motion handling is explicitly disabled", () => {
    const animationFrame = installAnimationFrameMock();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );
    const layout = createLayout();

    const view = render(
      <ScrollAnchorHarness
        activeKey="first"
        layout={layout}
        respectReducedMotion={false}
      />,
    );
    const container = view.getByTestId("container");
    layout.current.targetTop = 500;

    view.rerender(
      <ScrollAnchorHarness
        activeKey="second"
        layout={layout}
        respectReducedMotion={false}
      />,
    );

    expect(animationFrame.requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(container.scrollTop).toBe(0);

    act(() => animationFrame.runFrame(0));
    act(() => animationFrame.runFrame(100));

    expect(container.scrollTop).toBe(420);
  });

  it("uses a custom target for imperative instant re-anchoring", () => {
    const animationFrame = installAnimationFrameMock();
    const layout = createLayout();
    const getTarget = vi.fn((container: HTMLDivElement) =>
      container.querySelector<HTMLElement>("[data-custom-anchor]"),
    );

    const view = render(
      <ScrollAnchorHarness
        activeKey="first"
        getTarget={getTarget}
        layout={layout}
      />,
    );
    const container = view.getByTestId("container");
    getTarget.mockClear();
    layout.current.customTargetTop = 500;

    act(() => view.getByTestId("reanchor").click());

    expect(getTarget).toHaveBeenCalledWith(container);
    expect(container.scrollTop).toBe(420);
    expect(animationFrame.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("reads the latest options without re-anchoring for option-only renders", () => {
    const animationFrame = installAnimationFrameMock();
    const layout = createLayout();
    const firstOnSettled = vi.fn();
    const latestOnSettled = vi.fn();

    const view = render(
      <ScrollAnchorHarness
        activeKey="first"
        layout={layout}
        onSettled={firstOnSettled}
      />,
    );

    expect(firstOnSettled).toHaveBeenCalledTimes(1);
    animationFrame.requestAnimationFrame.mockClear();

    view.rerender(
      <ScrollAnchorHarness
        activeKey="first"
        easing={scrollAnchorEasings.easeInOutCubic}
        layout={layout}
        onSettled={latestOnSettled}
      />,
    );

    expect(animationFrame.requestAnimationFrame).not.toHaveBeenCalled();
    expect(latestOnSettled).not.toHaveBeenCalled();

    act(() => view.getByTestId("reanchor").click());

    expect(firstOnSettled).toHaveBeenCalledTimes(1);
    expect(latestOnSettled).toHaveBeenCalledTimes(1);
  });

  it("cancels in-flight animation when the key changes and on unmount", () => {
    const animationFrame = installAnimationFrameMock();
    const layout = createLayout();

    const view = render(
      <ScrollAnchorHarness activeKey="first" layout={layout} />,
    );
    layout.current.targetTop = 500;

    view.rerender(
      <ScrollAnchorHarness activeKey="second" layout={layout} />,
    );
    act(() => animationFrame.runFrame(0));

    expect(animationFrame.callbacks.size).toBe(1);

    layout.current.targetTop = 700;
    view.rerender(
      <ScrollAnchorHarness activeKey="third" layout={layout} />,
    );

    expect(animationFrame.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(animationFrame.callbacks.size).toBe(1);

    view.unmount();

    expect(animationFrame.cancelAnimationFrame).toHaveBeenCalledTimes(2);
    expect(animationFrame.callbacks.size).toBe(0);
  });

  it("stays idle while disabled and anchors instantly when enabled", () => {
    const animationFrame = installAnimationFrameMock();
    const layout = createLayout({ targetTop: 500 });
    const onSettled = vi.fn();

    const view = render(
      <ScrollAnchorHarness
        activeKey="first"
        enabled={false}
        layout={layout}
        onSettled={onSettled}
      />,
    );
    const container = view.getByTestId("container");

    expect(container.scrollTop).toBe(0);
    expect(onSettled).not.toHaveBeenCalled();

    layout.current.targetTop = 700;
    view.rerender(
      <ScrollAnchorHarness
        activeKey="second"
        enabled={false}
        layout={layout}
        onSettled={onSettled}
      />,
    );
    view.rerender(
      <ScrollAnchorHarness
        activeKey="second"
        enabled
        layout={layout}
        onSettled={onSettled}
      />,
    );

    expect(container.scrollTop).toBe(620);
    expect(animationFrame.requestAnimationFrame).not.toHaveBeenCalled();
    expect(onSettled).toHaveBeenCalledTimes(1);
  });
});
