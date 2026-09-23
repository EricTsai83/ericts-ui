// @vitest-environment jsdom
import { act } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CopyButton as CssOnlyCopyButton } from "@/registry/base/css-only/copy-button";
import { CopyButton } from "@/registry/base/ui/copy-button";

vi.mock("@/registry/base/css-only/icon-swap.css", () => ({}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function mockClipboard(writeText: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe.each([
  ["motion", CopyButton],
  ["css-only", CssOnlyCopyButton],
])("CopyButton (%s)", (_name, Component) => {
  it("flips into the copied state and resets after copiedDuration", async () => {
    vi.useFakeTimers();

    try {
      mockClipboard(() => Promise.resolve());
      const onCopy = vi.fn();

      render(<Component value="hello" copiedDuration={500} onCopy={onCopy} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button"));
        await Promise.resolve();
      });

      expect(onCopy).toHaveBeenCalledWith("hello");
      expect(screen.getByRole("button").getAttribute("data-copied")).toBe(
        "true",
      );

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(screen.getByRole("button").getAttribute("data-copied")).toBe(
        "false",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not schedule the reset timer when the write resolves after unmount", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const deferred = createDeferred<void>();
    mockClipboard(() => deferred.promise);
    const onCopy = vi.fn();

    const { unmount } = render(
      <Component value="hello" copiedDuration={12345} onCopy={onCopy} />,
    );

    fireEvent.click(screen.getByRole("button"));

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    unmount();
    deferred.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // The copy itself succeeded, so the callback still reports it.
    expect(onCopy).toHaveBeenCalledWith("hello");
    expect(
      setTimeoutSpy.mock.calls.some(([, delay]) => delay === 12345),
    ).toBe(false);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
