// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { FeedbackPopover } from "@/registry/base/ui/feedback-popover";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("FeedbackPopover", () => {
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
});
