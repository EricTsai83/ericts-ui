// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTimer } from "@/registry/base/hooks/use-timer";

function TimerValue({
  direction,
  initialSeconds,
  endSeconds,
}: {
  direction: "down" | "up";
  initialSeconds: number;
  endSeconds?: number;
}) {
  const timer = useTimer({ direction, initialSeconds, endSeconds });

  return <output data-state={timer.status}>{timer.seconds}</output>;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useTimer", () => {
  it("uses a deadline instead of counting ticks", () => {
    render(
      <TimerValue direction="down" initialSeconds={10} endSeconds={0} />,
    );

    act(() => {
      vi.setSystemTime(new Date("2026-01-01T00:00:07Z"));
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("2")).toBeTruthy();
  });

  it("keeps fractional-second precision internally", () => {
    render(
      <TimerValue direction="down" initialSeconds={1.5} endSeconds={0} />,
    );

    expect(screen.getByText("2")).toBeTruthy();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText("1")).toBeTruthy();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("counts upward without requiring an end boundary", () => {
    render(<TimerValue direction="up" initialSeconds={0} />);

    act(() => vi.advanceTimersByTime(3000));

    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("3").getAttribute("data-state")).toBe("running");
  });
});
