// @vitest-environment jsdom
import { createRef } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Countdown,
  CountUp,
  type TimerHandle,
} from "@/registry/base/ui/timer";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Countdown", () => {
  it("renders a complete time value with customizable slots", () => {
    const { container } = render(
      <Countdown
        duration={3661}
        autoStart={false}
        className="text-lg"
        valueClassName="gap-1"
        digitClassName="rounded-md"
        separatorClassName="text-foreground"
      />,
    );

    const timer = screen.getByLabelText(
      "1 hour, 1 minute, 1 second remaining",
    );

    expect(timer.getAttribute("datetime")).toBe("PT1H1M1S");
    expect(timer.getAttribute("data-state")).toBe("idle");
    expect(timer.getAttribute("data-value")).toBe("3661");
    expect(timer.className).toContain("text-lg");
    expect(container.querySelectorAll("[data-slot='timer-segment']")).toHaveLength(
      3,
    );
    expect(container.querySelectorAll("[data-slot='timer-digit']")).toHaveLength(
      6,
    );
    expect(
      container.querySelector("[data-slot='timer-digit']")?.className,
    ).toContain("rounded-md");
    expect(
      container.querySelector("[data-slot='timer-separator']")?.className,
    ).toContain("text-foreground");
  });

  it("supports pause, resume, reset, and restart through its handle", () => {
    const ref = createRef<TimerHandle>();
    render(<Countdown controlsRef={ref} duration={3} />);

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("timer").getAttribute("data-value")).toBe("2");

    act(() => ref.current?.pause());
    expect(screen.getByRole("timer").getAttribute("data-state")).toBe("paused");

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("timer").getAttribute("data-value")).toBe("2");

    act(() => ref.current?.resume());
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("timer").getAttribute("data-value")).toBe("1");

    act(() => ref.current?.reset());
    expect(screen.getByRole("timer").getAttribute("data-value")).toBe("3");
    expect(screen.getByRole("timer").getAttribute("data-state")).toBe("idle");

    act(() => ref.current?.restart());
    expect(screen.getByRole("timer").getAttribute("data-state")).toBe("running");
  });

  it("forwards ref to the rendered <time> element, not the control handle", () => {
    const domRef = createRef<HTMLTimeElement>();
    const controlsRef = createRef<TimerHandle>();

    render(<Countdown ref={domRef} controlsRef={controlsRef} duration={3} />);

    expect(domRef.current).toBeInstanceOf(HTMLTimeElement);
    expect(domRef.current).toBe(screen.getByRole("timer"));
    expect(typeof controlsRef.current?.restart).toBe("function");
  });

  it("can be paused declaratively or disabled", () => {
    const { rerender } = render(<Countdown duration={5} paused />);

    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("timer").getAttribute("data-value")).toBe("5");

    rerender(<Countdown duration={5} paused={false} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("timer").getAttribute("data-value")).toBe("4");

    rerender(<Countdown duration={5} paused={false} disabled />);
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("timer").getAttribute("data-value")).toBe("4");
    expect(screen.getByRole("timer").getAttribute("data-disabled")).toBe(
      "true",
    );
  });

  it("calls onComplete once", () => {
    const onComplete = vi.fn();
    render(<Countdown duration={1} onComplete={onComplete} />);

    act(() => vi.advanceTimersByTime(2000));

    expect(screen.getByRole("timer").getAttribute("data-state")).toBe(
      "completed",
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("can update digits without creating motion layers", () => {
    const { container } = render(
      <Countdown duration={2} animated={false} />,
    );

    expect(screen.getByRole("timer").getAttribute("data-animated")).toBe(
      "false",
    );
    expect(container.querySelectorAll("[data-number]")).toHaveLength(6);

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByRole("timer").getAttribute("data-value")).toBe("1");
    expect(container.querySelectorAll("[data-number]")).toHaveLength(6);
    expect(
      container.querySelector<HTMLElement>("[data-number='1']")?.style
        .transform,
    ).toBe("");
  });
});

describe("CountUp", () => {
  it("counts upward and stops at an optional boundary", () => {
    const onComplete = vi.fn();
    render(<CountUp startAt={2} endAt={4} onComplete={onComplete} />);

    act(() => vi.advanceTimersByTime(2000));

    const timer = screen.getByLabelText(
      "0 hours, 0 minutes, 4 seconds elapsed",
    );
    expect(timer.getAttribute("data-value")).toBe("4");
    expect(timer.getAttribute("data-state")).toBe("completed");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
