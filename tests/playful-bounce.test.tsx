// @vitest-environment jsdom
import { createRef } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import {
  PlayfulBounce,
  type PlayfulBounceControls,
} from "@/registry/base/ui/playful-bounce";

vi.mock("@/registry/base/ui/playful-bounce.css", () => ({}));

let reduced = false;
const listeners = new Set<() => void>();
function setup() {
  reduced = false;
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return query.includes("reduced-motion") ? reduced : true;
      },
      addEventListener: (_: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        listeners.delete(listener),
    })),
  );
}
afterEach(() => {
  cleanup();
  listeners.clear();
  vi.unstubAllGlobals();
});

it("replays without remounting children and forwards the root ref", () => {
  setup();
  const ref = createRef<HTMLSpanElement>();
  const controls = createRef<PlayfulBounceControls>();
  const { container } = render(
    <PlayfulBounce ref={ref} controlsRef={controls} trigger="click">
      <button>Celebrate</button>
    </PlayfulBounce>,
  );
  const target = container.querySelector<HTMLElement>(
    '[data-slot="playful-bounce-sway"]',
  )!;
  const button = container.querySelector("button")!;
  expect(ref.current?.dataset.slot).toBe("playful-bounce");
  fireEvent.click(button);
  expect(target.dataset.playing).toBe("true");
  act(() => controls.current?.play());
  expect(container.querySelector("button")).toBe(button);
  // jsdom lacks AnimationEvent; React listens for the prefixed event.
  fireEvent(target, new Event("webkitAnimationEnd", { bubbles: true }));
  expect(target.dataset.playing).toBeUndefined();
  act(() => controls.current?.play());
  expect(target.dataset.playing).toBe("true");
});

it("cancels playback when reduced motion changes and cleans up subscriptions", () => {
  setup();
  const controls = createRef<PlayfulBounceControls>();
  const { container, unmount } = render(
    <PlayfulBounce autoPlay controlsRef={controls}>
      Star
    </PlayfulBounce>,
  );
  const target = container.querySelector<HTMLElement>(
    '[data-slot="playful-bounce-sway"]',
  )!;
  expect(target.dataset.playing).toBe("true");
  reduced = true;
  act(() => listeners.forEach((listener) => listener()));
  expect(target.dataset.playing).toBeUndefined();
  act(() => controls.current?.play());
  expect(target.dataset.playing).toBeUndefined();
  unmount();
  expect(listeners.size).toBe(0);
});

it("honors a prevented click", () => {
  setup();
  const { container, getByText } = render(
    <PlayfulBounce trigger="click" onClick={(event) => event.preventDefault()}>
      <button>Celebrate</button>
    </PlayfulBounce>,
  );
  fireEvent.click(getByText("Celebrate"));
  expect(container.querySelector("[data-playing]")).toBeNull();
});
