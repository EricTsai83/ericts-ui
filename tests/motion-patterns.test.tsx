// @vitest-environment jsdom
import { createRef } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChangeHighlight } from "@/registry/base/ui/change-highlight";
import { ScanReveal } from "@/registry/base/ui/scan-reveal";
import { TextDecode } from "@/registry/base/ui/text-decode";

vi.mock("@/registry/base/ui/scan-reveal.css", () => ({}));

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: () => preference.reduced,
}));

let frames: Map<number, FrameRequestCallback>;
let time: number;
let nextId: number;
const cancel = vi.fn();
type FakeAnimation = {
  cancel: typeof cancel;
  currentTime: number;
  playState: AnimationPlayState;
};
const animate = vi.fn<
  (frames: Keyframe[], options: KeyframeAnimationOptions) => FakeAnimation
>(() => ({ cancel, currentTime: 0, playState: "running" }));
const animationAt = (call: number) =>
  animate.mock.results[call]!.value as FakeAnimation;

beforeEach(() => {
  preference.reduced = false;
  frames = new Map();
  time = 0;
  nextId = 0;
  vi.spyOn(performance, "now").mockImplementation(() => time);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: animate,
  });
  animate.mockClear();
  cancel.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
});

function advance(now: number) {
  time = now;
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach((callback) => callback(now)));
}

describe("motion patterns", () => {
  it("keeps the starting scan layer inert and forwards the root ref", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ScanReveal ref={ref} before={<button>Old action</button>}>
        <button>New action</button>
      </ScanReveal>,
    );
    expect(ref.current?.dataset.slot).toBe("scan-reveal");
    expect(ref.current?.dataset.direction).toBe("horizontal");
    expect(
      screen.getByText("Old action").parentElement?.hasAttribute("inert"),
    ).toBe(true);
    expect(
      screen.getByText("Old action").parentElement?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(screen.getByRole("button", { name: "New action" })).toBeTruthy();
  });

  it("can switch scan direction without replacing the accessible result", () => {
    const ref = createRef<HTMLDivElement>();
    const view = render(
      <ScanReveal ref={ref} before="Source">
        Result
      </ScanReveal>,
    );
    const result = screen.getByText("Result");
    view.rerender(
      <ScanReveal ref={ref} direction="vertical" before="Source">
        Result
      </ScanReveal>,
    );
    expect(ref.current?.dataset.direction).toBe("vertical");
    expect(screen.getByText("Result")).toBe(result);
    expect(result.closest('[aria-hidden="true"]')).toBeNull();
  });

  it("settles every grapheme at completion, even between throttled frames", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <TextDecode ref={ref} duration={101}>
        完成 👩‍💻
      </TextDecode>,
    );
    const visual = ref.current?.lastElementChild;
    // 100ms and 101ms share the same 40ms text-update interval.
    advance(100);
    advance(101);
    expect(visual?.textContent).toBe("完成 👩‍💻");
    expect(frames.size).toBe(0);
    expect(ref.current?.querySelector(".sr-only")?.textContent).toBe("完成 👩‍💻");
  });

  it("cancels an interrupted decode and settles the new message", () => {
    const view = render(<TextDecode duration={200}>Old</TextDecode>);
    expect(frames.size).toBe(1);
    view.rerender(<TextDecode duration={200}>新訊息 ✨</TextDecode>);
    expect(frames.size).toBe(1);
    advance(200);
    expect(
      view.container.querySelector('[aria-hidden="true"]:last-child')
        ?.textContent,
    ).toBe("新訊息 ✨");
    view.rerender(
      <TextDecode duration={200} replayKey={1}>
        新訊息 ✨
      </TextDecode>,
    );
    expect(frames.size).toBe(1);
    view.unmount();
    expect(frames.size).toBe(0);
  });

  it("shows final text without a clock when motion is reduced or duration is zero", () => {
    preference.reduced = true;
    const view = render(<TextDecode>Hello</TextDecode>);
    expect(frames.size).toBe(0);
    expect(view.container.lastElementChild?.lastElementChild?.textContent).toBe(
      "Hello",
    );
    preference.reduced = false;
    view.rerender(<TextDecode duration={0}>Instant</TextDecode>);
    expect(frames.size).toBe(0);
  });

  it("highlights only changes and resumes from the interrupted brightness without reading styles", () => {
    const getComputedStyleSpy = vi.spyOn(window, "getComputedStyle");
    const ref = createRef<HTMLSpanElement>();
    const view = render(
      <ChangeHighlight ref={ref} value={24}>
        $24
      </ChangeHighlight>,
    );
    expect(animate).not.toHaveBeenCalled();
    view.rerender(
      <ChangeHighlight ref={ref} value={25}>
        $25
      </ChangeHighlight>,
    );
    expect(animate).toHaveBeenCalledTimes(1);
    expect(animate.mock.calls[0]?.[0][0]).toMatchObject({
      opacity: 0,
      offset: 0,
    });
    // Interrupt during the fade: default hold 180 ms, fade 600 ms, so 120 + 180 + 300 is mid-fade.
    animationAt(0).currentTime = 600;
    view.rerender(
      <ChangeHighlight ref={ref} value={26}>
        $26
      </ChangeHighlight>,
    );
    expect(cancel).toHaveBeenCalledTimes(1);
    const resumed = Number(animate.mock.calls[1]?.[0][0]?.opacity);
    expect(resumed).toBeGreaterThan(0);
    expect(resumed).toBeLessThan(1);
    expect(getComputedStyleSpy).not.toHaveBeenCalled();
    expect(ref.current?.dataset.slot).toBe("change-highlight");
    view.unmount();
    expect(cancel).toHaveBeenCalledTimes(2);
  });

  it("starts from full brightness when interrupted during the hold", () => {
    const view = render(<ChangeHighlight value={1}>One</ChangeHighlight>);
    view.rerender(<ChangeHighlight value={2}>Two</ChangeHighlight>);
    animationAt(0).currentTime = 200;
    view.rerender(<ChangeHighlight value={3}>Three</ChangeHighlight>);
    expect(animate.mock.calls[1]?.[0][0]).toMatchObject({
      opacity: 1,
      offset: 0,
    });
  });

  it("applies new timing from the next highlight without interrupting the current one", () => {
    const view = render(<ChangeHighlight value={1}>One</ChangeHighlight>);
    view.rerender(<ChangeHighlight value={2}>Two</ChangeHighlight>);
    view.rerender(
      <ChangeHighlight value={2} duration={900} holdDuration={300}>
        Two
      </ChangeHighlight>,
    );
    expect(cancel).not.toHaveBeenCalled();
    expect(animate).toHaveBeenCalledTimes(1);
    view.rerender(
      <ChangeHighlight value={3} duration={900} holdDuration={300}>
        Three
      </ChangeHighlight>,
    );
    expect(animate.mock.calls[1]?.[1]).toMatchObject({
      duration: 120 + 300 + 900,
    });
  });

  it("cancels a running highlight when reduced motion is enabled", () => {
    const view = render(<ChangeHighlight value={1}>One</ChangeHighlight>);
    view.rerender(<ChangeHighlight value={2}>Two</ChangeHighlight>);
    preference.reduced = true;
    view.rerender(<ChangeHighlight value={3}>Three</ChangeHighlight>);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledTimes(1);
  });
});
