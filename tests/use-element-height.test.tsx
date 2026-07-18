// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useElementHeight } from "@/registry/base/hooks/use-element-height";

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
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    rectWithHeight(40),
  );
});

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalResizeObserver;
  vi.restoreAllMocks();
});

function HeightHarness({
  threshold,
  version = 0,
}: {
  threshold?: number;
  version?: number;
}) {
  const [ref, height] = useElementHeight<HTMLDivElement>(threshold);

  return (
    <>
      <div key={version} ref={ref} data-testid="measured" />
      <output data-testid="height">{height ?? "null"}</output>
    </>
  );
}

function resizeEntry(
  target: Element,
  blockSize?: number,
): ResizeObserverEntry {
  return {
    target,
    contentRect: target.getBoundingClientRect(),
    borderBoxSize:
      blockSize === undefined
        ? []
        : [{ inlineSize: 100, blockSize }],
    contentBoxSize: [],
    devicePixelContentBoxSize: [],
  };
}

function rectWithHeight(height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    right: 100,
    bottom: height,
    left: 0,
    width: 100,
    height,
    toJSON: () => ({}),
  };
}

describe("useElementHeight", () => {
  it("measures immediately and tracks border-box height changes", () => {
    render(<HeightHarness />);

    expect(screen.getByTestId("height").textContent).toBe("40");
    expect(ResizeObserverMock.instances).toHaveLength(1);

    const observer = ResizeObserverMock.instances[0];
    const measured = screen.getByTestId("measured");

    expect(observer.observe).toHaveBeenCalledWith(measured);

    act(() => {
      observer.callback([resizeEntry(measured, 84)], observer);
    });

    expect(screen.getByTestId("height").textContent).toBe("84");
  });

  it("ignores sub-pixel changes within the default threshold", () => {
    render(<HeightHarness />);

    const observer = ResizeObserverMock.instances[0];
    const measured = screen.getByTestId("measured");

    act(() => {
      observer.callback([resizeEntry(measured, 80)], observer);
      observer.callback([resizeEntry(measured, 80.4)], observer);
    });

    expect(screen.getByTestId("height").textContent).toBe("80");
  });

  it("uses a custom threshold to suppress measurement noise", () => {
    render(<HeightHarness threshold={2} />);

    const observer = ResizeObserverMock.instances[0];
    const measured = screen.getByTestId("measured");

    act(() => {
      observer.callback([resizeEntry(measured, 80)], observer);
      observer.callback([resizeEntry(measured, 81.5)], observer);
    });

    expect(screen.getByTestId("height").textContent).toBe("80");

    act(() => {
      observer.callback([resizeEntry(measured, 82.1)], observer);
    });

    expect(screen.getByTestId("height").textContent).toBe("82.1");
  });

  it("falls back to the rendered rectangle when border-box data is absent", () => {
    render(<HeightHarness />);

    const observer = ResizeObserverMock.instances[0];
    const measured = screen.getByTestId("measured");

    vi.spyOn(measured, "getBoundingClientRect").mockReturnValue(
      rectWithHeight(96),
    );

    act(() => {
      observer.callback([resizeEntry(measured)], observer);
    });

    expect(screen.getByTestId("height").textContent).toBe("96");
  });

  it("disconnects observers when the measured element changes or unmounts", () => {
    const view = render(<HeightHarness />);
    const firstObserver = ResizeObserverMock.instances[0];

    view.rerender(<HeightHarness version={1} />);

    expect(firstObserver.disconnect).toHaveBeenCalled();
    expect(ResizeObserverMock.instances).toHaveLength(2);

    const secondObserver = ResizeObserverMock.instances[1];

    view.unmount();

    expect(secondObserver.disconnect).toHaveBeenCalled();
  });

  it("keeps the initial measurement when ResizeObserver is unavailable", () => {
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;

    render(<HeightHarness />);

    expect(screen.getByTestId("height").textContent).toBe("40");
    expect(ResizeObserverMock.instances).toHaveLength(0);
  });
});
