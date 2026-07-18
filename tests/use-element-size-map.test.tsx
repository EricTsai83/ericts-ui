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
