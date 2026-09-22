// @vitest-environment jsdom
import { createRef } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DemoTabs,
  type DemoTabsItem,
  type DemoTabsScene,
} from "@/registry/base/blocks/demo-tabs";

let scene: DemoTabsScene;
let now = 0;
let frameId = 0;
let frames: Map<number, FrameRequestCallback>;
let intersect: (visible: boolean, ratio?: number) => void;
const disconnect = vi.fn();
let reduced = false;
const items: DemoTabsItem[] = ["First", "Second", "Third"].map((label) => ({
  value: label.toLowerCase(),
  label,
  duration: 1000,
  render: (state) => {
    scene = state;
    return (
      <div>
        {label} scene <button>Inspect {label}</button>
      </div>
    );
  },
}));

function advance(ms: number) {
  act(() => {
    now += ms;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(now));
  });
}
function enter() {
  act(() => intersect(true));
}

beforeEach(() => {
  now = 0;
  frameId = 0;
  reduced = false;
  frames = new Map();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduced,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersect = (visible, ratio = visible ? 1 : 0) =>
          callback(
            [{ isIntersecting: visible, intersectionRatio: ratio } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
      }
      observe() {}
      disconnect = disconnect;
    },
  );
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  disconnect.mockClear();
});

describe("DemoTabs", () => {
  it("starts at 20% visibility and pauses below the threshold", () => {
    render(<DemoTabs items={items} />);
    act(() => intersect(true, 0.19));
    advance(250);
    expect(scene.progress.get()).toBe(0);
    act(() => intersect(true, 0.2));
    advance(250);
    expect(scene.progress.get()).toBeCloseTo(0.25);
    act(() => intersect(true, 0.19));
    advance(500);
    expect(scene.progress.get()).toBeCloseTo(0.25);
    act(() => intersect(true, 0.2));
    advance(250);
    expect(scene.progress.get()).toBeCloseTo(0.5);
  });

  it("plays a manually selected tab inside an outer tabpanel without playback buttons", () => {
    render(
      <div role="tabpanel">
        <DemoTabs items={items} />
      </div>,
    );
    enter();
    const tab = screen.getByRole("tab", { name: "Second" });
    act(() => tab.focus());
    fireEvent.click(tab);
    advance(250);
    expect(scene.isPlaying).toBe(true);
    expect(scene.progress.get()).toBeCloseTo(0.25);
    expect(screen.queryByRole("button", { name: /demo/i })).toBeNull();
    advance(1000);
    expect(scene.progress.get()).toBe(1);
    expect(scene.isPlaying).toBe(false);
    advance(2000);
    expect(tab.getAttribute("aria-selected")).toBe("true");
  });

  it("starts only in view and uses one continuous clock across pauses", () => {
    render(<DemoTabs items={items} />);
    advance(400);
    expect(scene.progress.get()).toBe(0);
    enter();
    advance(300);
    expect(scene.progress.get()).toBeCloseTo(0.3);
    act(() => intersect(false));
    advance(500);
    expect(scene.progress.get()).toBeCloseTo(0.3);
    enter();
    advance(200);
    expect(scene.progress.get()).toBeCloseTo(0.5);
  });
  it("advances automatically and loops", () => {
    render(<DemoTabs items={items} />);
    enter();
    advance(1000);
    expect(
      screen.getByRole("tab", { name: "Second" }).getAttribute("aria-selected"),
    ).toBe("true");
    advance(1000);
    advance(1000);
    expect(
      screen.getByRole("tab", { name: "First" }).getAttribute("aria-selected"),
    ).toBe("true");
  });
  it("manual selection resets both consumers and stops automatic advancement", () => {
    render(<DemoTabs items={items} />);
    enter();
    advance(400);
    const oldClock = scene.progress;
    fireEvent.click(screen.getByRole("tab", { name: "Second" }));
    expect(scene.progress).not.toBe(oldClock);
    expect(scene.progress.get()).toBe(0);
    advance(1000);
    advance(1000);
    expect(
      screen.getByRole("tab", { name: "Second" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(scene.progress.get()).toBe(1);
    expect(scene.isPlaying).toBe(false);
    fireEvent.click(screen.getByRole("tab", { name: "Second" }));
    expect(scene.progress.get()).toBe(0);
    advance(250);
    expect(scene.progress.get()).toBeCloseTo(0.25);
  });
  it("freezes offscreen and in a hidden document without catch-up", () => {
    render(<DemoTabs items={items} />);
    enter();
    advance(250);
    act(() => intersect(false));
    advance(4000);
    expect(scene.progress.get()).toBeCloseTo(0.25);
    enter();
    advance(250);
    expect(scene.progress.get()).toBeCloseTo(0.5);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    advance(5000);
    expect(scene.progress.get()).toBeCloseTo(0.5);
    vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    advance(100);
    expect(scene.progress.get()).toBeCloseTo(0.6);
  });
  it("pauses while someone interacts with panel content", () => {
    render(<DemoTabs items={items} />);
    enter();
    advance(200);
    const inspect = screen.getByRole("button", { name: "Inspect First" });
    fireEvent.focus(inspect);
    advance(600);
    expect(scene.progress.get()).toBeCloseTo(0.2);
    fireEvent.blur(inspect, { relatedTarget: null });
    advance(100);
    expect(scene.progress.get()).toBeCloseTo(0.3);
  });
  it("does not latch a rejected controlled selection or repeatedly request advancement", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <DemoTabs items={items} value="first" onValueChange={onValueChange} />,
    );
    enter();
    advance(1000);
    advance(1000);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("tab", { name: "First" }).getAttribute("aria-selected"),
    ).toBe("true");
    rerender(
      <DemoTabs items={items} value="second" onValueChange={onValueChange} />,
    );
    expect(scene.progress.get()).toBe(0);
    fireEvent.click(screen.getByRole("tab", { name: "Third" }));
    expect(
      screen.getByRole("tab", { name: "Second" }).getAttribute("aria-selected"),
    ).toBe("true");
    rerender(<DemoTabs items={items} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Third" }));
    expect(
      screen.getByRole("tab", { name: "Third" }).getAttribute("aria-selected"),
    ).toBe("true");
  });
  it("shows the final static frame for reduced motion, including after selection", () => {
    reduced = true;
    render(<DemoTabs items={items} />);
    enter();
    advance(2000);
    expect(scene.progress.get()).toBe(1);
    expect(scene.isPlaying).toBe(false);
    fireEvent.click(screen.getByRole("tab", { name: "Second" }));
    expect(scene.progress.get()).toBe(1);
    expect(
      screen.getByRole("tab", { name: "Second" }).getAttribute("aria-selected"),
    ).toBe("true");
  });
  it("honors autoPlay=false and loop=false", () => {
    const { rerender } = render(
      <DemoTabs
        items={items}
        defaultValue="third"
        autoPlay={false}
        loop={false}
      />,
    );
    enter();
    advance(1000);
    expect(scene.progress.get()).toBe(0);
    rerender(
      <DemoTabs items={items} defaultValue="third" autoPlay loop={false} />,
    );
    advance(1000);
    expect(scene.progress.get()).toBe(1);
    expect(scene.isPlaying).toBe(false);
    expect(
      screen.getByRole("tab", { name: "Third" }).getAttribute("aria-selected"),
    ).toBe("true");
  });
  it("forwards the root ref, handles changing items, and cleans up playback", () => {
    const ref = createRef<HTMLElement>();
    const { rerender, unmount } = render(
      <DemoTabs ref={ref} items={items} defaultValue="third" />,
    );
    enter();
    advance(100);
    expect(ref.current?.dataset.slot).toBe("demo-tabs");
    rerender(<DemoTabs ref={ref} items={items.slice(0, 1)} />);
    expect(
      screen.getByRole("tab", { name: "First" }).getAttribute("aria-selected"),
    ).toBe("true");
    const clock = scene.progress;
    unmount();
    advance(1000);
    expect(clock.get()).toBe(0);
    expect(disconnect).toHaveBeenCalled();
  });
  it("has linked tab semantics and an empty state", () => {
    const { rerender } = render(<DemoTabs items={items} />);
    const tab = screen.getByRole("tab", { name: "First" });
    const panel = screen.getByRole("tabpanel");
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab.id);
    rerender(<DemoTabs items={[]} emptyLabel="No demos yet" />);
    expect(screen.getByText("No demos yet")).toBeTruthy();
  });
});
