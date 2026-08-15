// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  type UseSwipeNavigationOptions,
  useSwipeNavigation,
} from "@/registry/base/hooks/use-swipe-navigation";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function SwipeHarness(options: UseSwipeNavigationOptions<HTMLDivElement>) {
  const swipeRef = useSwipeNavigation<HTMLDivElement>(options);

  return (
    <div ref={swipeRef} data-testid="swipe-surface">
      <button type="button" data-custom-swipe-ignore>
        Ignore custom gesture
      </button>
      <div
        role="slider"
        aria-label="Owned slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
      />
    </div>
  );
}

function createOptions(
  overrides: Partial<UseSwipeNavigationOptions<HTMLDivElement>> = {},
) {
  return {
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    ...overrides,
  } satisfies UseSwipeNavigationOptions<HTMLDivElement>;
}

function RerenderingProgressHarness({ onNext }: { onNext: () => void }) {
  const [progress, setProgress] = useState(0);
  const swipeRef = useSwipeNavigation<HTMLDivElement>({
    onPrevious: () => {},
    onNext,
    onSwipeProgress: (swipe) => {
      if (swipe) setProgress(swipe.progress);
    },
  });

  return (
    <div ref={swipeRef} data-testid="rerendering-swipe-surface">
      <output>{progress}</output>
    </div>
  );
}

describe("useSwipeNavigation", () => {
  it("applies grouped feedback settings and reports live gesture metrics", () => {
    vi.useFakeTimers();
    const onSwipeProgress = vi.fn();
    const options = createOptions({
      distanceThreshold: 100,
      velocityThreshold: 10_000,
      feedback: {
        distance: 30,
        resistance: 0.5,
        resetDuration: 120,
        resetEasing: "linear",
      },
      onSwipeProgress,
    });
    render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    startSwipe(surface, [100, 20]);
    moveSwipe(surface, [40, 22]);

    expect(surface.style.transform).toBe("translate3d(-30px, 0, 0)");
    expect(onSwipeProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({
        direction: "next",
        deltaX: -60,
        deltaY: 2,
        progress: 0.6,
        feedbackX: -30,
        available: true,
        reduceMotion: false,
      }),
    );

    endSwipe(surface, [40, 22]);

    expect(options.onNext).not.toHaveBeenCalled();
    expect(onSwipeProgress).toHaveBeenLastCalledWith(null);
    expect(surface.style.transition).toBe("transform 120ms linear");
    expect(surface.style.transform).toBe("translate3d(0, 0, 0)");

    vi.advanceTimersByTime(140);
    expect(surface.style.transition).toBe("");
    expect(surface.style.transform).toBe("");
  });

  it("lets consumers disable built-in transforms without losing progress", () => {
    const onSwipeProgress = vi.fn();
    const options = createOptions({
      feedback: {
        enabled: false,
        distance: 40,
        resistance: 0.5,
      },
      onSwipeProgress,
    });
    render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    startSwipe(surface, [180, 20]);
    moveSwipe(surface, [96, 22]);

    expect(surface.style.transform).toBe("");
    expect(surface.style.willChange).toBe("");
    expect(onSwipeProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({
        direction: "next",
        progress: 1,
        feedbackX: -40,
      }),
    );

    endSwipe(surface, [96, 22]);

    expect(options.onNext).toHaveBeenCalledTimes(1);
    expect(onSwipeProgress).toHaveBeenLastCalledWith(null);
  });

  it("customizes resistance at unavailable edges without navigating", () => {
    const onSwipeProgress = vi.fn();
    const options = createOptions({
      hasNext: false,
      feedback: {
        edgeDistance: 20,
        edgeResistance: 0.5,
      },
      onSwipeProgress,
    });
    render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    startSwipe(surface, [180, 20]);
    moveSwipe(surface, [80, 20]);

    expect(surface.style.transform).toBe("translate3d(-20px, 0, 0)");
    expect(onSwipeProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ available: false, feedbackX: -20 }),
    );

    endSwipe(surface, [80, 20]);
    expect(options.onNext).not.toHaveBeenCalled();
  });

  it("supports a stricter horizontal direction lock", () => {
    const onSwipeProgress = vi.fn();
    const options = createOptions({
      directionLockRatio: 2,
      onSwipeProgress,
    });
    render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    startSwipe(surface, [100, 20]);
    moveSwipe(surface, [70, 40]);
    endSwipe(surface, [70, 40]);

    expect(surface.style.transform).toBe("");
    expect(onSwipeProgress).not.toHaveBeenCalled();
    expect(options.onNext).not.toHaveBeenCalled();
  });

  it("adds app-specific ignored targets without replacing built-in ownership", () => {
    const shouldIgnoreTarget = vi.fn(
      (target: EventTarget | null) =>
        target instanceof Element &&
        Boolean(target.closest("[data-custom-swipe-ignore]")),
    );
    const options = createOptions({
      ignoreOwnedGestures: true,
      shouldIgnoreTarget,
    });
    render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    const customTarget = screen.getByRole("button", {
      name: "Ignore custom gesture",
    });
    const ownedSlider = screen.getByRole("slider", { name: "Owned slider" });

    swipe(customTarget, { from: [180, 20], to: [96, 20] });
    swipe(ownedSlider, { from: [180, 20], to: [96, 20] });

    expect(shouldIgnoreTarget).toHaveBeenCalledWith(customTarget, surface);
    expect(options.onNext).not.toHaveBeenCalled();
  });

  it("keeps the deprecated flat feedback options working", () => {
    const options = createOptions({
      feedbackDistance: 40,
      feedbackResistance: 0.5,
    });
    render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    startSwipe(surface, [180, 20]);
    moveSwipe(surface, [96, 20]);

    expect(surface.style.transform).toBe("translate3d(-40px, 0, 0)");
  });

  it("reports reduced motion while keeping navigation available", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }) as MediaQueryList),
    );
    const onSwipeProgress = vi.fn();
    const options = createOptions({ onSwipeProgress });
    render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    startSwipe(surface, [180, 20]);
    moveSwipe(surface, [96, 20]);

    expect(surface.style.transform).toBe("");
    expect(onSwipeProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ reduceMotion: true, feedbackX: 0 }),
    );

    endSwipe(surface, [96, 20]);
    expect(options.onNext).toHaveBeenCalledTimes(1);
  });

  it("cancels active progress when a second touch appears", () => {
    vi.useFakeTimers();
    const onSwipeProgress = vi.fn();
    const options = createOptions({ onSwipeProgress });
    render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    startSwipe(surface, [180, 20]);
    moveSwipe(surface, [140, 20]);

    const firstTouch = createTouch(1, 140, 20);
    const secondTouch = createTouch(2, 150, 30);
    fireEvent(
      surface,
      createTouchEvent("touchstart", {
        touches: [firstTouch, secondTouch],
        changedTouches: [secondTouch],
      }),
    );

    expect(onSwipeProgress).toHaveBeenLastCalledWith(null);
    expect(surface.style.transform).toBe("translate3d(0, 0, 0)");
    expect(options.onNext).not.toHaveBeenCalled();
  });

  it("cleans up feedback styles and progress when unmounted mid-swipe", () => {
    const onSwipeProgress = vi.fn();
    const options = createOptions({ onSwipeProgress });
    const view = render(<SwipeHarness {...options} />);

    const surface = screen.getByTestId("swipe-surface");
    startSwipe(surface, [180, 20]);
    moveSwipe(surface, [140, 20]);
    expect(surface.style.transform).not.toBe("");

    view.unmount();

    expect(onSwipeProgress).toHaveBeenLastCalledWith(null);
    expect(surface.style.transform).toBe("");
    expect(surface.style.transition).toBe("");
    expect(surface.style.willChange).toBe("");
  });

  it("keeps tracking when progress causes a consumer re-render", () => {
    const onNext = vi.fn();
    render(<RerenderingProgressHarness onNext={onNext} />);

    const surface = screen.getByTestId("rerendering-swipe-surface");
    startSwipe(surface, [180, 20]);
    moveSwipe(surface, [150, 20]);
    expect(screen.getByText((30 / 52).toString())).toBeTruthy();

    moveSwipe(surface, [96, 20]);
    endSwipe(surface, [96, 20]);

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

function swipe(
  element: Element,
  { from, to }: { from: [number, number]; to: [number, number] },
) {
  startSwipe(element, from);
  moveSwipe(element, to);
  endSwipe(element, to);
}

function startSwipe(element: Element, point: [number, number]) {
  const touch = createTouch(1, point[0], point[1]);

  fireEvent(
    element,
    createTouchEvent("touchstart", {
      touches: [touch],
      changedTouches: [touch],
    }),
  );
}

function moveSwipe(element: Element, point: [number, number]) {
  const touch = createTouch(1, point[0], point[1]);

  fireEvent(
    element,
    createTouchEvent("touchmove", {
      touches: [touch],
      changedTouches: [touch],
    }),
  );
}

function endSwipe(element: Element, point: [number, number]) {
  const touch = createTouch(1, point[0], point[1]);

  fireEvent(
    element,
    createTouchEvent("touchend", {
      touches: [],
      changedTouches: [touch],
    }),
  );
}

function createTouch(identifier: number, clientX: number, clientY: number) {
  return { identifier, clientX, clientY };
}

function createTouchEvent(
  type: string,
  properties: {
    touches: Array<ReturnType<typeof createTouch>>;
    changedTouches: Array<ReturnType<typeof createTouch>>;
  },
) {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    touches: { value: createTouchList(properties.touches) },
    changedTouches: { value: createTouchList(properties.changedTouches) },
  });

  return event;
}

function createTouchList(touches: Array<ReturnType<typeof createTouch>>) {
  return {
    ...touches,
    length: touches.length,
    item: (index: number) => touches[index] ?? null,
  };
}
