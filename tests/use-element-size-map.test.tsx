// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useElementSizeMap } from "@/registry/base/hooks/use-element-size-map";

class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = [];

  readonly callback: ResizeObserverCallback;
  readonly observe = vi.fn<(target: Element) => void>();
  readonly unobserve = vi.fn<(target: Element) => void>();
  readonly disconnect = vi.fn<() => void>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
  }

  takeRecords() {
    return [];
  }
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
  ResizeObserverMock.instances = [];
  globalThis.ResizeObserver = ResizeObserverMock;
});

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalResizeObserver;
  vi.restoreAllMocks();
});

function SizeMapHarness({
  onRender,
  showSecond = true,
}: {
  onRender: () => void;
  showSecond?: boolean;
}) {
  onRender();

  const { setMeasureRef, sizes } = useElementSizeMap<HTMLDivElement>();

  return (
    <>
      <div ref={setMeasureRef("first")} data-testid="first" />
      {showSecond ? (
        <div ref={setMeasureRef("second")} data-testid="second" />
      ) : null}
      <output data-testid="sizes">{JSON.stringify(sizes)}</output>
    </>
  );
}

function resizeEntry(
  target: Element,
  width: number,
  height: number,
): ResizeObserverEntry {
  return {
    target,
    contentRect: target.getBoundingClientRect(),
    borderBoxSize: [{ inlineSize: width, blockSize: height }],
    contentBoxSize: [],
    devicePixelContentBoxSize: [],
  };
}

describe("useElementSizeMap", () => {
  it("shares one observer and batches a multi-entry resize into one render", () => {
    const onRender = vi.fn();

    render(<SizeMapHarness onRender={onRender} />);

    expect(ResizeObserverMock.instances).toHaveLength(1);

    const observer = ResizeObserverMock.instances[0];
    const first = screen.getByTestId("first");
    const second = screen.getByTestId("second");

    expect(observer.observe).toHaveBeenCalledTimes(2);

    const rendersBeforeResize = onRender.mock.calls.length;

    act(() => {
      observer.callback(
        [resizeEntry(first, 120, 40), resizeEntry(second, 180, 64)],
        observer,
      );
    });

    expect(onRender).toHaveBeenCalledTimes(rendersBeforeResize + 1);
    expect(screen.getByTestId("sizes").textContent).toBe(
      JSON.stringify({
        first: { width: 120, height: 40 },
        second: { width: 180, height: 64 },
      }),
    );
  });

  it("measures the layout box a ref attaches to, not the painted one", () => {
    // A `scale()` anywhere up the tree — the element's own animation, a
    // zoomed-out preview frame — shrinks the painted rect while leaving the
    // layout box alone. The observer above always reports the layout box, so
    // this path has to agree with it: a consumer whose ref re-attaches would
    // otherwise see the size flip between the two on every render, and anything
    // positioned from that size would jump.
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(320);
    vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(200);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 224,
      height: 140,
    } as DOMRect);

    render(<SizeMapHarness onRender={vi.fn()} />);

    expect(JSON.parse(screen.getByTestId("sizes").textContent ?? "{}")).toEqual({
      first: { width: 320, height: 200 },
      second: { width: 320, height: 200 },
    });
  });

  it("keeps measuring a ref that holds still across renders", () => {
    // The hook must not depend on its consumer handing React a new ref callback
    // every render to stay subscribed — that churn re-measures and re-subscribes
    // on every commit, which is exactly what a stable ref exists to avoid.
    const view = render(<SizeMapHarness onRender={vi.fn()} />);
    const observer = ResizeObserverMock.instances[0];
    const first = screen.getByTestId("first");

    view.rerender(<SizeMapHarness onRender={vi.fn()} />);
    view.rerender(<SizeMapHarness onRender={vi.fn()} />);

    expect(observer.observe).toHaveBeenCalledTimes(2);
    expect(observer.unobserve).not.toHaveBeenCalled();

    act(() => {
      observer.callback([resizeEntry(first, 512, 256)], observer);
    });

    expect(
      JSON.parse(screen.getByTestId("sizes").textContent ?? "{}").first,
    ).toEqual({ width: 512, height: 256 });
  });

  it("keeps the threshold behavior and unobserves detached elements", () => {
    const onRender = vi.fn();
    const view = render(<SizeMapHarness onRender={onRender} />);
    const observer = ResizeObserverMock.instances[0];
    const first = screen.getByTestId("first");
    const second = screen.getByTestId("second");

    act(() => {
      observer.callback([resizeEntry(first, 100, 50)], observer);
    });

    const sizesBeforeNoise = screen.getByTestId("sizes").textContent;

    act(() => {
      observer.callback([resizeEntry(first, 100.4, 50.4)], observer);
    });

    expect(screen.getByTestId("sizes").textContent).toBe(sizesBeforeNoise);

    view.rerender(
      <SizeMapHarness onRender={onRender} showSecond={false} />,
    );

    expect(observer.unobserve).toHaveBeenCalledWith(second);

    view.unmount();
    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });
});
