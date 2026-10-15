// @vitest-environment jsdom
import { createRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DownloadButton, type DownloadButtonContext } from "@/registry/base/ui/download-button";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(),
  })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function deferred() {
  let context: DownloadButtonContext | undefined;
  let finish: () => void = () => {};
  let fail: (error: unknown) => void = () => {};
  const onDownload = vi.fn((next: DownloadButtonContext) => {
    context = next;
    return new Promise<void>((resolve, reject) => { finish = resolve; fail = reject; });
  });
  return { onDownload, context: () => context!, finish: () => finish(), fail: (error: unknown) => fail(error) };
}

it("uses lucide's ArrowDownToLine, and draws the default done icon itself", () => {
  const { container } = render(<DownloadButton onDownload={() => {}} />);
  expect(container.querySelector('[data-slot="download-button-icon"] .lucide-arrow-down-to-line')).toBeTruthy();
  // The landed ring and its arrowhead are the RotateCw glyph; no separate icon
  // is swapped in, so the finish cannot shift by a half pixel.
  expect(container.querySelector('[data-slot="download-button-done-icon"]')).toBeNull();
  expect(container.querySelector('[data-slot="download-button-arrowhead"]')).toBeTruthy();
});

it("ignores presses while loading, keeps focus, and offers to download again", async () => {
  const request = deferred();
  const ref = createRef<HTMLButtonElement>();
  render(<DownloadButton ref={ref} onDownload={request.onDownload} />);
  const button = screen.getByRole("button", { name: "Download" });
  act(() => button.focus());
  fireEvent.click(button);
  fireEvent.click(button);
  expect(request.onDownload).toHaveBeenCalledTimes(1);
  expect(button.dataset.state).toBe("loading");
  expect(button.getAttribute("aria-label")).toBe("Downloading…");
  expect(button.getAttribute("aria-disabled")).toBe("true");
  expect(document.activeElement).toBe(button);
  await act(async () => request.finish());
  expect(ref.current).toBe(button);
  expect(button.dataset.state).toBe("done");
  expect(screen.getByRole("status").textContent).toBe("Download complete");
  fireEvent.click(screen.getByRole("button", { name: "Download again" }));
  expect(request.onDownload).toHaveBeenCalledTimes(2);
});

it("batches progress to one render a frame, clamps it, and ignores non-finite and late reports", async () => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
  try {
    const request = deferred();
    render(<DownloadButton onDownload={request.onDownload} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button.dataset.progress).toBeUndefined();
    act(() => {
      request.context().setProgress(0.2);
      request.context().setProgress(0.6);
      request.context().setProgress(1.5);
    });
    // Nothing renders until the frame; then only the latest report lands.
    expect(button.dataset.progress).toBeUndefined();
    act(() => vi.advanceTimersToNextFrame());
    expect(button.dataset.progress).toBe("1");
    act(() => {
      request.context().setProgress(Number.NaN);
      vi.advanceTimersToNextFrame();
    });
    expect(button.dataset.progress).toBe("1");
    await act(async () => request.finish());
    act(() => {
      request.context().setProgress(0.1);
      vi.advanceTimersToNextFrame();
    });
    expect(button.dataset.state).toBe("done");
    expect(button.dataset.progress).toBeUndefined();
  } finally {
    vi.useRealTimers();
  }
});

it("returns to idle and reports the error when the download rejects", async () => {
  const request = deferred();
  const onError = vi.fn();
  render(<DownloadButton onDownload={request.onDownload} onError={onError} />);
  fireEvent.click(screen.getByRole("button"));
  const error = new Error("offline");
  await act(async () => request.fail(error));
  expect(onError).toHaveBeenCalledWith(error);
  expect(screen.getByRole("button", { name: "Download" }).dataset.state).toBe("idle");
});

it("aborts an in-flight download on unmount and does not start while disabled", () => {
  const request = deferred();
  const { unmount, rerender } = render(<DownloadButton disabled onDownload={request.onDownload} />);
  fireEvent.click(screen.getByRole("button"));
  expect(request.onDownload).not.toHaveBeenCalled();
  rerender(<DownloadButton onDownload={request.onDownload} />);
  fireEvent.click(screen.getByRole("button"));
  const { signal } = request.context();
  unmount();
  expect(signal.aborted).toBe(true);
});

it("returns to idle after doneDuration and clears the timer on unmount", async () => {
  vi.useFakeTimers();
  try {
    const { unmount } = render(<DownloadButton doneDuration={1000} onDownload={() => {}} />);
    await act(async () => fireEvent.click(screen.getByRole("button")));
    expect(screen.getByRole("button").dataset.state).toBe("done");
    act(() => vi.advanceTimersByTime(999));
    expect(screen.getByRole("button").dataset.state).toBe("done");
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("button", { name: "Download" }).dataset.state).toBe("idle");
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    await act(async () => fireEvent.click(screen.getByRole("button")));
    const resetTimer = setTimeoutSpy.mock.results[
      setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === 1000)
    ]?.value;
    expect(resetTimer).toBeDefined();
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(resetTimer);
  } finally {
    vi.useRealTimers();
  }
});

it("runs onDoneClick instead of downloading again, with a custom done icon", async () => {
  const onDownload = vi.fn();
  const onDoneClick = vi.fn();
  const { container } = render(
    <DownloadButton onDownload={onDownload} onDoneClick={onDoneClick} doneLabel="Open file" doneIcon={<svg data-testid="open" />} />,
  );
  expect(container.querySelector(".lucide-rotate-cw")).toBeNull();
  await act(async () => fireEvent.click(screen.getByRole("button")));
  fireEvent.click(screen.getByRole("button", { name: "Open file" }));
  expect(onDoneClick).toHaveBeenCalledTimes(1);
  expect(onDownload).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("open")).toBeTruthy();
});

it("cancels on press when cancelable, aborting the request and ignoring its result", async () => {
  const request = deferred();
  const onCancel = vi.fn();
  render(<DownloadButton cancelable onCancel={onCancel} onDownload={request.onDownload} />);
  fireEvent.click(screen.getByRole("button"));
  const button = screen.getByRole("button", { name: "Cancel download" });
  expect(button.getAttribute("aria-disabled")).toBeNull();
  const { signal } = request.context();
  fireEvent.click(button);
  expect(signal.aborted).toBe(true);
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(button.dataset.state).toBe("idle");
  await act(async () => request.finish());
  expect(button.dataset.state).toBe("idle");
  fireEvent.click(button);
  expect(request.onDownload).toHaveBeenCalledTimes(2);
});

it("shows a progress cursor only while a non-cancelable download is busy", () => {
  const request = deferred();
  render(<>
    <DownloadButton onDownload={request.onDownload} label="Locked" />
    <DownloadButton cancelable onDownload={request.onDownload} label="Cancelable" />
  </>);
  const locked = screen.getByRole("button", { name: "Locked" });
  const cancelable = screen.getByRole("button", { name: "Cancelable" });
  expect(locked.className).toContain("cursor-pointer");
  fireEvent.click(locked);
  fireEvent.click(cancelable);
  // `aria-disabled` drives the `aria-disabled:cursor-progress` variant.
  expect(locked.getAttribute("aria-disabled")).toBe("true");
  expect(cancelable.getAttribute("aria-disabled")).toBeNull();
  expect(cancelable.dataset.cancelable).toBe("true");
});

it("omits the check badge when badge is false", async () => {
  const { container } = render(<DownloadButton badge={false} onDownload={() => {}} />);
  await act(async () => fireEvent.click(screen.getByRole("button")));
  expect(screen.getByRole("button").dataset.state).toBe("done");
  expect(container.querySelector('[data-slot="download-button-badge"]')).toBeNull();
  expect(screen.getByRole("status").textContent).toBe("Download complete");
});

it("calls onClick first and skips its own action when the event is prevented", () => {
  const onDownload = vi.fn();
  const onClick = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
  const { rerender } = render(<DownloadButton onClick={onClick} onDownload={onDownload} />);
  fireEvent.click(screen.getByRole("button"));
  expect(onClick).toHaveBeenCalledTimes(1);
  expect(onDownload).not.toHaveBeenCalled();
  const track = vi.fn();
  rerender(<DownloadButton onClick={track} onDownload={onDownload} />);
  fireEvent.click(screen.getByRole("button"));
  expect(track).toHaveBeenCalledTimes(1);
  expect(onDownload).toHaveBeenCalledTimes(1);
});

it("lets the badge follow the button's colour and an ancestor's surface variable", () => {
  const { container } = render(<DownloadButton onDownload={() => {}} />);
  const badge = container.querySelector('[data-slot="download-button-badge"]')!;
  // No colour or variable of its own, so both inherit.
  expect(badge.getAttribute("class")).toBeNull();
  const [gap, disc] = badge.querySelectorAll("circle");
  expect(gap.getAttribute("fill")).toBe("var(--download-button-surface, var(--background))");
  expect(disc.getAttribute("fill")).toBe("currentColor");
  expect(badge.querySelector("path")!.getAttribute("stroke")).toBe(
    "var(--download-button-surface, var(--background))",
  );
});
