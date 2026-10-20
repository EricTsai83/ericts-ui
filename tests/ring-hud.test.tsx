// @vitest-environment jsdom
import { createRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RingHud, type RingHudControls } from "@/registry/base/ui/ring-hud";

vi.mock("@/registry/base/ui/ring-hud.css", () => ({}));

afterEach(cleanup);

function endAnimation(element: Element, animationName: string) {
  const event = new Event("webkitAnimationEnd", { bubbles: true });
  Object.defineProperty(event, "animationName", { value: animationName });
  fireEvent(element, event);
}

const root = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="ring-hud"]')!;

describe("RingHud", () => {
  it("keeps masks separate when multiple HUDs share a page", () => {
    const { container } = render(<><RingHud value={54} /><RingHud value={0} /></>);
    const masks = [...container.querySelectorAll("mask")];
    expect(masks).toHaveLength(2);
    expect(masks[0].id).not.toBe(masks[1].id);
    const paths = container.querySelectorAll(".ring-hud-path");
    expect(paths[1].getAttribute("visibility")).toBe("hidden");
  });

  it("walks enter, hold, exit, done and stays mounted afterwards", () => {
    const onPhaseChange = vi.fn();
    const onComplete = vi.fn();
    const { container } = render(
      <RingHud value={54} onPhaseChange={onPhaseChange} onComplete={onComplete} />,
    );
    const hud = root(container);
    expect(hud.dataset.phase).toBe("enter");

    endAnimation(hud, "ring-hud-enter");
    endAnimation(hud, "ring-hud-hold");
    endAnimation(hud, "ring-hud-exit");

    expect(onPhaseChange.mock.calls.map(([phase]) => phase)).toEqual(["hold", "exit", "done"]);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(root(container).dataset.phase).toBe("done");
  });

  it("ignores child and foreign animations", () => {
    const { container } = render(<RingHud value={54} />);
    endAnimation(container.querySelector(".ring-hud-path")!, "ring-hud-draw-in");
    endAnimation(root(container), "pulse");
    expect(root(container).dataset.phase).toBe("enter");
  });

  it("formats the caption and announces it once the ring settles", () => {
    const { container } = render(
      <RingHud value={53.6} label={(value) => `已充電 ${value}%`} />,
    );
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    expect(container.querySelector('[data-slot="ring-hud-label"]')?.textContent).toBe("已充電 54%");

    endAnimation(root(container), "ring-hud-enter");
    expect(status.textContent).toBe("已充電 54%");
  });

  it("omits the caption for a null label but still announces the level", () => {
    const { container } = render(<RingHud value={30} label={null} />);
    expect(container.querySelector('[data-slot="ring-hud-label"]')).toBeNull();
    endAnimation(root(container), "ring-hud-enter");
    expect(screen.getByRole("status").textContent).toBe("30%");
  });

  it("holds until dismissed when holdDuration is Infinity", () => {
    const controls = createRef<RingHudControls>();
    const { container } = render(
      <RingHud value={40} holdDuration={Infinity} controlsRef={controls} />,
    );
    endAnimation(root(container), "ring-hud-enter");
    expect(root(container).dataset.hold).toBe("manual");

    endAnimation(root(container), "ring-hud-hold");
    expect(root(container).dataset.phase).toBe("hold");

    act(() => controls.current?.dismiss());
    expect(root(container).dataset.phase).toBe("exit");
  });

  it("starts the countdown when holdDuration turns finite", () => {
    const { container, rerender } = render(<RingHud value={60} holdDuration={Infinity} />);
    endAnimation(root(container), "ring-hud-enter");
    rerender(<RingHud value={100} holdDuration={800} />);
    expect(root(container).dataset.hold).toBeUndefined();
    expect(root(container).style.getPropertyValue("--ring-hud-hold")).toBe("800ms");
    endAnimation(root(container), "ring-hud-hold");
    expect(root(container).dataset.phase).toBe("exit");
  });

  it("defers a dismiss during the entrance until the ring settles", () => {
    const controls = createRef<RingHudControls>();
    const { container } = render(<RingHud value={40} controlsRef={controls} />);
    act(() => controls.current?.dismiss());
    expect(root(container).dataset.phase).toBe("enter");
    endAnimation(root(container), "ring-hud-enter");
    expect(root(container).dataset.phase).toBe("exit");
  });

  it("pauses, resumes, and replays on the same root node", () => {
    const controls = createRef<RingHudControls>();
    const ref = createRef<HTMLDivElement>();
    const onComplete = vi.fn();
    const { container } = render(
      <RingHud ref={ref} value={40} controlsRef={controls} onComplete={onComplete} />,
    );

    act(() => controls.current?.pause());
    expect(root(container).hasAttribute("data-paused")).toBe(true);
    act(() => controls.current?.resume());
    expect(root(container).hasAttribute("data-paused")).toBe(false);

    for (const name of ["ring-hud-enter", "ring-hud-hold", "ring-hud-exit"]) {
      endAnimation(root(container), name);
    }
    const finished = ref.current;
    act(() => controls.current?.replay());

    expect(ref.current).toBe(finished);
    expect(ref.current?.dataset.phase).toBe("enter");
    expect(screen.getByRole("status").textContent).toBe("");
    for (const name of ["ring-hud-enter", "ring-hud-hold", "ring-hud-exit"]) {
      endAnimation(root(container), name);
    }
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("replays mid-entrance without leaving the entrance", () => {
    const controls = createRef<RingHudControls>();
    const onPhaseChange = vi.fn();
    const { container } = render(
      <RingHud value={40} controlsRef={controls} onPhaseChange={onPhaseChange} />,
    );
    const node = root(container);
    act(() => controls.current?.replay());
    expect(root(container)).toBe(node);
    expect(node.dataset.phase).toBe("enter");
    expect(onPhaseChange).toHaveBeenCalledWith("enter");
  });

  it("lets back-to-back control calls see the phase the previous call set", () => {
    const controls = createRef<RingHudControls>();
    const { container } = render(<RingHud value={40} controlsRef={controls} />);
    for (const name of ["ring-hud-enter", "ring-hud-hold", "ring-hud-exit"]) {
      endAnimation(root(container), name);
    }

    act(() => {
      controls.current?.replay();
      controls.current?.dismiss();
    });
    expect(root(container).dataset.phase).toBe("enter");
    endAnimation(root(container), "ring-hud-enter");
    expect(root(container).dataset.phase).toBe("exit");
  });

  it("maps size to the custom property", () => {
    const { container } = render(<RingHud value={10} size={96} />);
    expect(root(container).style.getPropertyValue("--ring-hud-size")).toBe("96px");
  });
});
