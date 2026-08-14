// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Countdown } from "@/registry/base/ui/timer";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Countdown under reduced motion", () => {
  it("moves directly to the next digit without an intermediate transition", async () => {
    const { container } = render(<Countdown duration={8} />);

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    const activeLayer = container.querySelector<HTMLElement>(
      "[data-number='7']",
    );

    expect(screen.getByRole("timer").getAttribute("data-animated")).toBe(
      "false",
    );
    expect(activeLayer?.style.transform).toBe("");
  });
});
