// @vitest-environment jsdom
import { useCallback, useRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScrollProgress } from "@/registry/base/hooks/use-scroll-progress";

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
});

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalResizeObserver;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubPointer(coarse: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(
      (query: string) =>
        ({
          matches: query === "(pointer: coarse)" ? coarse : false,
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

function MeasureHarness({
  onMeasure,
}: {
  onMeasure: (viewportHeight: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;

    if (node) {
      Object.defineProperties(node, {
        clientWidth: { configurable: true, value: 390 },
        clientHeight: { configurable: true, value: 600 },
      });
    }
  }, []);

  useScrollProgress({
    containerRef,
    distance: 1,
    smoothing: 0,
    onProgress: () => {},
    onMeasure,
  });

  return <div ref={setContainerRef} data-testid="scroller" />;
}

function ProgressHarness({ enabled = true }: { enabled?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLOutputElement>(null);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;

    if (node) {
      Object.defineProperty(node, "clientHeight", {
        configurable: true,
        value: 200,
      });
    }
  }, []);

  const handleProgress = useCallback((progress: number) => {
    if (outputRef.current) {
      outputRef.current.value = progress.toFixed(2);
    }
  }, []);

  useScrollProgress({
    containerRef,
    distance: 1,
    smoothing: 0,
    enabled,
    disabledProgress: 1,
    onProgress: handleProgress,
  });

  return (
    <div ref={setContainerRef} data-testid="scroller">
      <output ref={outputRef}>unset</output>
    </div>
  );
}

describe("useScrollProgress", () => {
  it("maps container scroll to a clamped 0–1 value", () => {
    render(<ProgressHarness />);

    const scroller = screen.getByTestId("scroller");
    scroller.scrollTop = 100;
    fireEvent.scroll(scroller);

    expect(screen.getByText("0.50")).toBeTruthy();

    scroller.scrollTop = 500;
    fireEvent.scroll(scroller);

    expect(screen.getByText("1.00")).toBeTruthy();
  });

  it("emits disabledProgress and does not track scroll while gated", () => {
    render(<ProgressHarness enabled={false} />);

    const scroller = screen.getByTestId("scroller");
    expect(screen.getByText("1.00")).toBeTruthy();

    scroller.scrollTop = 40;
    fireEvent.scroll(scroller);

    expect(screen.getByText("1.00")).toBeTruthy();
  });

  it("ignores height-only viewport resizes on touch devices", () => {
    stubPointer(true);

    const onMeasure = vi.fn();
    render(<MeasureHarness onMeasure={onMeasure} />);

    const scroller = screen.getByTestId("scroller");
    expect(onMeasure).toHaveBeenCalledTimes(1);

    // Mobile browser chrome collapsing: the height changes mid-scroll, the
    // width does not. Re-measuring here would jump the track under the thumb.
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 540,
    });
    fireEvent(window, new Event("resize"));

    expect(onMeasure).toHaveBeenCalledTimes(1);

    // A rotation changes the width, which is a real layout change.
    Object.defineProperties(scroller, {
      clientWidth: { configurable: true, value: 844 },
      clientHeight: { configurable: true, value: 390 },
    });
    fireEvent(window, new Event("resize"));

    expect(onMeasure).toHaveBeenCalledTimes(2);
    expect(onMeasure).toHaveBeenLastCalledWith(390);
  });

  it("still re-measures height-only resizes on pointer-precise viewports", () => {
    stubPointer(false);

    const onMeasure = vi.fn();
    render(<MeasureHarness onMeasure={onMeasure} />);

    const scroller = screen.getByTestId("scroller");
    Object.defineProperty(scroller, "clientHeight", {
      configurable: true,
      value: 540,
    });
    fireEvent(window, new Event("resize"));

    expect(onMeasure).toHaveBeenCalledTimes(2);
    expect(onMeasure).toHaveBeenLastCalledWith(540);
  });
});
