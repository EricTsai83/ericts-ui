// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { StatusButton } from "@/registry/base/ui/status-button";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("StatusButton", () => {
  it("does not schedule timers or update state after unmount mid-click", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const deferred = createDeferred<void>();
    const onClick = vi.fn(() => deferred.promise);

    const { unmount } = render(<StatusButton onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    unmount();

    deferred.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    setTimeoutSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("moves idle -> loading -> success -> idle on the happy path", async () => {
    vi.useFakeTimers();

    try {
      const deferred = createDeferred<void>();
      const onClick = vi.fn(() => deferred.promise);

      render(
        <StatusButton
          onClick={onClick}
          idleLabel="Idle label"
          loadingLabel="Loading label"
          successLabel="Success label"
          loadingDuration={100}
          successDuration={200}
        />
      );

      expect(screen.getByText("Idle label")).toBeTruthy();

      fireEvent.click(screen.getByRole("button"));

      await act(async () => {
        deferred.resolve();
        await Promise.resolve();
      });

      expect(screen.queryByText("Success label")).toBeNull();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(screen.getByText("Success label")).toBeTruthy();

      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByText("Idle label")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
