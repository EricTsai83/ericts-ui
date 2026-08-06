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
  vi.restoreAllMocks();
});

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
});
