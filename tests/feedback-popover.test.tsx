// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { FeedbackPopover } from "@/registry/base/ui/feedback-popover";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("FeedbackPopover", () => {
  afterEach(cleanup);

  it("keeps shared-layout measurement enabled for production transitions", () => {
    // jsdom has no layout engine, so guard the source of the production-only
    // regression: a static layoutDependency prevented Motion from taking the
    // trigger snapshot that the shared layout transition needs.
    const source = readFileSync(
      path.join(
        process.cwd(),
        "registry/base/ui/feedback-popover.tsx",
      ),
      "utf8",
    );

    expect(source).not.toContain("layoutDependency=");
  });

  it("does not invoke onOpenChange after unmount mid-submit", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();

    try {
      const deferred = createDeferred<void>();
      const onSubmit = vi.fn(() => deferred.promise);
      const onOpenChange = vi.fn();

      const { unmount } = render(
        <FeedbackPopover
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
          loadingDuration={0}
          successDuration={0}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Feedback" }));
      expect(onOpenChange).toHaveBeenCalledWith(true);
      onOpenChange.mockClear();

      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Great tool!" } });

      fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

      unmount();

      deferred.resolve();

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
      consoleErrorSpy.mockRestore();
    }
  });
  it("ignores a submission that settles after its session was closed", async () => {
    vi.useFakeTimers();

    try {
      const deferred = createDeferred<void>();
      const onSubmit = vi.fn(() => deferred.promise);
      const onOpenChange = vi.fn();

      render(
        <FeedbackPopover
          onSubmit={onSubmit}
          onOpenChange={onOpenChange}
          loadingDuration={0}
          successDuration={100}
        />,
      );

      const trigger = screen.getByRole("button", { name: "Feedback" });
      fireEvent.click(trigger);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "First session" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

      // Close mid-flight, then reopen a fresh session.
      fireEvent.keyDown(window, { key: "Escape" });
      fireEvent.click(trigger);
      onOpenChange.mockClear();

      const textarea = screen.getByRole("textbox");
      textarea.focus();

      await act(async () => {
        deferred.resolve();
        await vi.runAllTimersAsync();
      });

      expect(screen.queryByText("Feedback received!")).toBeNull();
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(textarea);
    } finally {
      vi.useRealTimers();
    }
  });

  it("still reports a stale submission failure without resetting the new session", async () => {
    vi.useFakeTimers();

    try {
      let reject!: (error: unknown) => void;
      const onSubmit = vi
        .fn<(feedback: string) => Promise<void>>()
        .mockImplementationOnce(
          () =>
            new Promise<void>((_, rej) => {
              reject = rej;
            }),
        )
        .mockImplementationOnce(() => new Promise<void>(() => {}));
      const onError = vi.fn();

      render(
        <FeedbackPopover
          onSubmit={onSubmit}
          onError={onError}
          loadingDuration={0}
        />,
      );

      const trigger = screen.getByRole("button", { name: "Feedback" });
      fireEvent.click(trigger);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "First" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
      fireEvent.keyDown(window, { key: "Escape" });

      fireEvent.click(trigger);
      const secondTextarea = screen.getByRole("textbox");
      fireEvent.change(secondTextarea, { target: { value: "Second" } });
      secondTextarea.focus();
      fireEvent.keyDown(secondTextarea, { key: "Enter", metaKey: true });
      expect(onSubmit).toHaveBeenCalledTimes(2);

      await act(async () => {
        reject(new Error("boom"));
        await vi.runAllTimersAsync();
      });

      expect(onError).toHaveBeenCalledTimes(1);
      // The second submission is still loading.
      expect(screen.getByRole("status").textContent).toBe("Sending feedback");
    } finally {
      vi.useRealTimers();
    }
  });

  it("leaves Escape alone when a nested overlay already handled it", () => {
    const onOpenChange = vi.fn();

    render(<FeedbackPopover defaultOpen onOpenChange={onOpenChange} />);

    const textarea = screen.getByRole("textbox");
    const nestedHandler = (event: KeyboardEvent) => event.preventDefault();
    textarea.addEventListener("keydown", nestedHandler);

    fireEvent.keyDown(textarea, { key: "Escape" });
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalled();

    textarea.removeEventListener("keydown", nestedHandler);

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      textarea.dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("announces loading and success through a persistent live region and keeps focus while loading", async () => {
    vi.useFakeTimers();

    try {
      const deferred = createDeferred<void>();

      render(
        <FeedbackPopover
          defaultOpen
          onSubmit={() => deferred.promise}
          loadingDuration={0}
          successDuration={1000}
        />,
      );

      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "Nice" } });
      textarea.focus();
      fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

      expect(screen.getByRole("status")).toBe(status);
      expect(status.textContent).toBe("Sending feedback");
      expect(textarea.disabled).toBe(false);
      expect(textarea.readOnly).toBe(true);
      expect(textarea.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(textarea);

      await act(async () => {
        deferred.resolve();
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(screen.getByRole("status")).toBe(status);
      expect(status.textContent).toBe("Feedback received!");
    } finally {
      vi.useRealTimers();
    }
  });
});
