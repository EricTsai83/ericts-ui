// @vitest-environment jsdom
import { createRef, StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StrokeTracePreview from "@/components/previews/stroke-trace";
import {
  StrokeTrace,
  StrokeTraceBorder,
} from "@/registry/base/ui/stroke-trace";

vi.mock("@/registry/base/ui/stroke-trace.css", () => ({}));

const observers: {
  callback: ResizeObserverCallback;
  disconnected: boolean;
  observe: ReturnType<typeof vi.fn<ResizeObserver["observe"]>>;
}[] = [];
const animations: {
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
  cancel: ReturnType<typeof vi.fn>;
  onfinish: (() => void) | null;
}[] = [];
let reduced = false;
const mediaListeners = new Set<() => void>();

beforeEach(() => {
  observers.length = 0;
  animations.length = 0;
  reduced = false;
  mediaListeners.clear();
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return reduced;
    },
    addEventListener: (_event: string, listener: () => void) =>
      mediaListeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) =>
      mediaListeners.delete(listener),
  }));
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: (frames: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = { frames, options, cancel: vi.fn(), onfinish: null };
      animations.push(animation);
      return animation;
    },
  });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      entry: (typeof observers)[number];
      constructor(callback: ResizeObserverCallback) {
        this.entry = { callback, disconnected: false, observe: vi.fn() };
        observers.push(this.entry);
      }
      observe(target: Element, options?: ResizeObserverOptions) {
        this.entry.observe(target, options);
      }
      unobserve() {}
      disconnect() {
        this.entry.disconnected = true;
      }
    },
  );
});

afterEach(() => {
  cleanup();
  delete (Element.prototype as Partial<Element>).animate;
  vi.unstubAllGlobals();
});

describe("StrokeTrace", () => {
  it("preserves semantic classes when callers provide stroke utilities", () => {
    const view = render(
      <StrokeTrace track className="stroke-current">
        <path d="M0 0H10" className="stroke-current" />
      </StrokeTrace>,
    );
    const svg = view.container.querySelector("svg")!;
    expect(svg.classList.contains("stroke-trace")).toBe(true);
    expect(svg.classList.contains("stroke-current")).toBe(true);
    const track = svg.querySelector(".stroke-trace-track");
    expect(track).not.toBeNull();
    expect(track!.classList.contains("stroke-current")).toBe(true);
    expect(track!.hasAttribute("pathLength")).toBe(false);
  });
  it("keeps repeated dashes beyond an open path's endpoint throughout drawing", () => {
    render(
      <StrokeTrace>
        <path d="M0 0H100" strokeLinecap="round" />
      </StrokeTrace>,
    );
    const animation = animations.at(-1)!;
    const from = animation.frames[0];
    const to = animation.frames.at(-1)!;
    expect(from.strokeDasharray).toBe("0 2");
    expect(to.strokeDasharray).toBe("1 1");
    const fromPattern = String(from.strokeDasharray).split(" ").map(Number);
    const toPattern = String(to.strokeDasharray).split(" ").map(Number);
    // SVG repeats the pattern: its next start must remain beyond pathLength=1,
    // including intermediate frames, even though the pen uses round linecaps.
    for (const progress of [0, 0.01, 0.25, 0.5, 0.99, 1]) {
      const length =
        fromPattern[0]! + (toPattern[0]! - fromPattern[0]!) * progress;
      const gap =
        fromPattern[1]! + (toPattern[1]! - fromPattern[1]!) * progress;
      expect(length + gap).toBeGreaterThan(1);
    }
  });

  it("does not remove caller-owned styles in CSS-driven modes", () => {
    const view = render(
      <StrokeTrace mode="orbit">
        <path
          d="M0 0H10"
          style={{ opacity: 0.6, strokeDasharray: "0.2 0.8" }}
        />
      </StrokeTrace>,
    );
    const shape = view.container.querySelector("path")!;
    expect(shape.style.opacity).toBe("0.6");
    expect(shape.style.strokeDasharray).toBe("0.2 0.8");
    expect(animations).toHaveLength(0);
  });
  it("defaults to reverse and scales the default exit time with the visible length", () => {
    const ref = createRef<SVGSVGElement>();
    const children = <path d="M0 0H10" />;
    const view = render(
      <StrokeTrace ref={ref} duration={1000}>
        {children}
      </StrokeTrace>,
    );
    expect(ref.current!.dataset.exitDirection).toBe("reverse");
    Object.assign(ref.current!.querySelector("path")!.style, {
      strokeDasharray: "0.5 1.5",
      strokeDashoffset: "0",
      opacity: "1",
    });
    view.rerender(
      <StrokeTrace ref={ref} active={false} duration={1000}>
        {children}
      </StrokeTrace>,
    );
    expect(animations.at(-1)!.options.duration).toBe(300);
  });

  it("applies a zero-duration exit immediately without creating an animation", () => {
    const ref = createRef<SVGSVGElement>();
    const children = <path d="M0 0H10" />;
    const view = render(<StrokeTrace ref={ref}>{children}</StrokeTrace>);
    const shape = ref.current!.querySelector("path")!;
    Object.assign(shape.style, {
      strokeDasharray: "0.5 1.5",
      strokeDashoffset: "0",
      opacity: "1",
    });
    const count = animations.length;
    view.rerender(
      <StrokeTrace ref={ref} active={false} exitDuration={0}>
        {children}
      </StrokeTrace>,
    );
    expect(animations).toHaveLength(count);
    expect(shape.style.strokeDasharray).toBe("0 2");
    expect(shape.style.opacity).toBe("0");
  });

  it.each(["reverse", "forward"] as const)(
    "continues a partial %s exit and re-entry without resetting",
    (exitDirection) => {
      const ref = createRef<SVGSVGElement>();
      const children = <path d="M0 0H10" />;
      const trace = (active: boolean) => (
        <StrokeTrace
          ref={ref}
          active={active}
          duration={1000}
          exitDuration={400}
          exitDirection={exitDirection}
        >
          {children}
        </StrokeTrace>
      );
      const view = render(trace(true));
      const shape = ref.current!.querySelector("path")!;
      // Sample an interrupted frame; jsdom does not advance browser animations.
      Object.assign(shape.style, {
        strokeDasharray: "0.35 1.65",
        strokeDashoffset: "-0.2",
        opacity: "1",
      });
      const entry = animations.at(-1)!;
      view.rerender(trace(false));
      const exit = animations.at(-1)!;
      expect(entry.cancel).toHaveBeenCalled();
      expect(exit.frames[0]).toMatchObject({
        strokeDasharray: "0.35 1.65",
        strokeDashoffset: "-0.2",
      });
      expect(exit.frames.at(-1)).toMatchObject({
        strokeDasharray: "0 2",
        strokeDashoffset: exitDirection === "forward" ? "-0.55" : "-0.2",
      });
      expect(exit.options.duration).toBeCloseTo(140);
      Object.assign(shape.style, {
        strokeDasharray: "0.1 1.9",
        strokeDashoffset: "-0.45",
        opacity: "0.8",
      });
      view.rerender(trace(true));
      const resumed = animations.at(-1)!;
      expect(exit.cancel).toHaveBeenCalled();
      expect(resumed.frames[0]).toMatchObject({
        strokeDasharray: "0.1 1.9",
        strokeDashoffset: "-0.45",
        opacity: "0.8",
      });
      expect(resumed.frames.at(-1)).toMatchObject({
        strokeDasharray: "1 1",
        strokeDashoffset: "0",
      });
      const start = resumed.frames[0];
      const end = resumed.frames.at(-1)!;
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        const startLength = Number.parseFloat(String(start.strokeDasharray));
        const endLength = Number.parseFloat(String(end.strokeDasharray));
        const length = startLength + (endLength - startLength) * progress;
        const startTail = -Number(start.strokeDashoffset);
        const endTail = -Number(end.strokeDashoffset);
        const tail = startTail + (endTail - startTail) * progress;
        expect(tail).toBeGreaterThanOrEqual(0);
        expect(tail + length).toBeLessThanOrEqual(1);
      }
      expect(resumed.options.duration).toBe(900);
      resumed.onfinish!();
      expect(shape.style.strokeDasharray).toBe("1 1");
      view.unmount();
      expect(resumed.cancel).toHaveBeenCalled();
      expect(mediaListeners.size).toBe(0);
    },
  );

  it("uses opacity only under reduced motion and responds to preference changes", () => {
    const view = render(
      <StrokeTrace>
        <path d="M0 0H10" />
      </StrokeTrace>,
    );
    const entry = animations.at(-1)!;
    view.container.querySelector("path")!.style.opacity = "0.4";
    act(() => {
      reduced = true;
      mediaListeners.forEach((listener) => listener());
    });
    expect(entry.cancel).toHaveBeenCalled();
    const fade = animations.at(-1)!;
    expect(fade.frames).toEqual([{ opacity: "0.4" }, { opacity: "1" }]);
    expect(fade.options.duration).toBe(150);
    view.unmount();
    expect(fade.cancel).toHaveBeenCalled();
    expect(mediaListeners.size).toBe(0);
  });

  it("clears draw styles when switching to a CSS-driven mode", () => {
    const children = <path d="M0 0H10" />;
    const view = render(<StrokeTrace>{children}</StrokeTrace>);
    const shape = view.container.querySelector("path")!;
    Object.assign(shape.style, {
      strokeDasharray: "0.5 1.5",
      strokeDashoffset: "-0.1",
      opacity: "1",
    });
    view.rerender(<StrokeTrace mode="orbit">{children}</StrokeTrace>);
    expect(shape.style.strokeDasharray).toBe("");
    expect(shape.style.strokeDashoffset).toBe("");
    expect(shape.style.opacity).toBe("");
    expect(mediaListeners.size).toBe(0);
  });

  it("normalises every shape, including those in groups and fragments", () => {
    const ref = createRef<SVGSVGElement>();
    render(
      <StrokeTrace ref={ref} viewBox="0 0 10 10" stagger={100}>
        <circle r="4" />
        <g>
          <>
            <path d="M0 0H10" />
          </>
        </g>
        <path d="M0 5H10" pathLength={2} />
        <text>Not a stroke</text>
      </StrokeTrace>,
    );
    const svg = ref.current!;
    expect(svg.dataset.slot).toBe("stroke-trace");
    expect(svg.getAttribute("aria-hidden")).toBe("true");
    const shapes = svg.querySelectorAll("[pathLength]");
    expect([...shapes].map((s) => s.getAttribute("pathLength"))).toEqual([
      "1",
      "1",
      "1",
    ]);
    expect(
      [...shapes].map((s) =>
        (s as SVGElement).style.getPropertyValue("--stroke-trace-index"),
      ),
    ).toEqual(["0", "1", "2"]);
    expect(svg.querySelector("text")?.hasAttribute("pathLength")).toBe(false);
    expect(svg.style.getPropertyValue("--stroke-trace-stagger")).toBe("100ms");
  });

  it("keeps the track untraced even when the original shape has a custom pathLength", () => {
    const ref = createRef<SVGSVGElement>();
    render(
      <StrokeTrace ref={ref} track>
        <circle r="4" pathLength={100} />
      </StrokeTrace>,
    );
    const [track, shape] = ref.current!.querySelectorAll("circle");
    expect(track?.classList.contains("stroke-trace-track")).toBe(true);
    expect(track?.hasAttribute("pathLength")).toBe(false);
    expect(shape?.getAttribute("pathLength")).toBe("1");
  });

  it("plays an exit only after it has been active", () => {
    const ref = createRef<SVGSVGElement>();
    const view = render(
      <StrokeTrace ref={ref} active={false}>
        <path d="M0 0H1" />
      </StrokeTrace>,
    );
    expect(ref.current!.dataset.state).toBe("idle");
    view.rerender(
      <StrokeTrace ref={ref} active>
        <path d="M0 0H1" />
      </StrokeTrace>,
    );
    expect(ref.current!.dataset.state).toBe("on");
    view.rerender(
      <StrokeTrace ref={ref} active={false}>
        <path d="M0 0H1" />
      </StrokeTrace>,
    );
    expect(ref.current!.dataset.state).toBe("off");
  });

  it("keeps durations finite and non-negative", () => {
    const ref = createRef<SVGSVGElement>();
    const view = render(<StrokeTrace ref={ref} duration={-5} />);
    expect(ref.current!.style.getPropertyValue("--stroke-trace-duration")).toBe(
      "0ms",
    );
    view.rerender(<StrokeTrace ref={ref} mode="orbit" duration={Number.NaN} />);
    expect(ref.current!.style.getPropertyValue("--stroke-trace-duration")).toBe(
      "1200ms",
    );
  });
});

describe("StrokeTrace capability preview", () => {
  it("lets visitors compare modes, remove the track, and replay", () => {
    const view = render(<StrokeTracePreview />);
    fireEvent.click(screen.getByRole("button", { name: "Orbit" }));
    expect(
      [...view.container.querySelectorAll('svg[data-slot="stroke-trace"]')].map(
        (svg) => svg.getAttribute("data-mode"),
      ),
    ).toEqual(["orbit", "orbit"]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Show track" }));
    expect(view.container.querySelector(".stroke-trace-track")).toBeNull();
    const previous = view.container.querySelector(
      'svg[data-slot="stroke-trace"]',
    );
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(
      view.container.querySelector('svg[data-slot="stroke-trace"]'),
    ).not.toBe(previous);
  });

  it("shows both border exit directions and lets visitors activate them together", () => {
    const view = render(<StrokeTracePreview />);
    fireEvent.click(screen.getByRole("tab", { name: "Interactive borders" }));
    const borders = [
      ...view.container.querySelectorAll(
        'svg[data-slot="stroke-trace-border"]',
      ),
    ];
    expect(
      borders.map((svg) => svg.getAttribute("data-exit-direction")),
    ).toEqual(["reverse", "forward"]);
    fireEvent.click(screen.getByRole("button", { name: "Draw borders" }));
    expect(
      borders.every((svg) => svg.getAttribute("data-state") === "on"),
    ).toBe(true);
    fireEvent.change(screen.getByRole("slider", { name: "Exit duration" }), {
      target: { value: "400" },
    });
    expect(screen.getByText("400 ms")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear borders" }));
    expect(
      borders.every((svg) => svg.getAttribute("data-state") === "off"),
    ).toBe(true);
  });
});

describe("StrokeTraceBorder", () => {
  it("keeps both base and border styling classes alongside stroke utilities", () => {
    const view = render(
      <div>
        <StrokeTraceBorder className="stroke-current" />
      </div>,
    );
    const svg = view.container.querySelector("svg")!;
    expect(svg.classList.contains("stroke-trace")).toBe(true);
    expect(svg.classList.contains("stroke-trace-border")).toBe(true);
    expect(svg.classList.contains("stroke-current")).toBe(true);
  });
  it("updates the explicit radius without resize or observer recreation", () => {
    const ref = createRef<SVGSVGElement>();
    const renderBorder = (radius?: number) => (
      <div style={{ borderRadius: "30px" }}>
        <StrokeTraceBorder ref={ref} radius={radius} />
      </div>
    );
    const view = render(renderBorder());
    const host = ref.current!.parentElement!;
    Object.defineProperty(host, "offsetWidth", {
      value: 120,
      configurable: true,
    });
    Object.defineProperty(host, "offsetHeight", {
      value: 40,
      configurable: true,
    });
    act(() => observers[0]!.callback([], {} as ResizeObserver));
    const rect = ref.current!.querySelector("rect")!;
    expect(rect.getAttribute("rx")).toBe("0");
    view.rerender(renderBorder(12));
    expect(rect.getAttribute("rx")).toBe("12");
    expect(ref.current!.hasAttribute("radius")).toBe(false);
    expect(observers).toHaveLength(1);

    Object.defineProperty(host, "offsetHeight", { value: 16 });
    act(() => observers[0]!.callback([], {} as ResizeObserver));
    expect(rect.getAttribute("rx")).toBe("8");
    for (const radius of [-5, Number.NaN, Number.POSITIVE_INFINITY]) {
      view.rerender(renderBorder(radius));
      expect(rect.getAttribute("rx")).toBe("0");
    }
    expect(observers).toHaveLength(1);
  });

  it("cleans up callback refs on replacement and unmount without passing null", () => {
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();
    const firstRef = vi
      .fn<(node: SVGSVGElement | null) => () => void>()
      .mockReturnValue(firstCleanup);
    const secondRef = vi
      .fn<(node: SVGSVGElement | null) => () => void>()
      .mockReturnValue(secondCleanup);
    const view = render(
      <div>
        <StrokeTraceBorder ref={firstRef} />
      </div>,
    );
    const svg = view.container.querySelector("svg");
    expect(firstRef).toHaveBeenCalledExactlyOnceWith(svg);
    view.rerender(
      <div>
        <StrokeTraceBorder ref={secondRef} />
      </div>,
    );
    expect(firstCleanup).toHaveBeenCalledTimes(1);
    expect(firstRef).toHaveBeenCalledTimes(1);
    expect(secondRef).toHaveBeenCalledExactlyOnceWith(svg);
    expect(secondCleanup).not.toHaveBeenCalled();
    view.unmount();
    expect(secondCleanup).toHaveBeenCalledTimes(1);
    expect(secondRef).toHaveBeenCalledTimes(1);
  });

  it("detaches callbacks without cleanup and clears object refs when replaced", () => {
    const callback = vi.fn<(node: SVGSVGElement | null) => void>();
    const objectRef = createRef<SVGSVGElement>();
    const view = render(
      <div>
        <StrokeTraceBorder ref={callback} />
      </div>,
    );
    const svg = view.container.querySelector("svg");
    view.rerender(
      <div>
        <StrokeTraceBorder ref={objectRef} />
      </div>,
    );
    expect(callback.mock.calls.map(([node]) => node)).toEqual([svg, null]);
    expect(objectRef.current).toBe(svg);
    view.rerender(
      <div>
        <StrokeTraceBorder />
      </div>,
    );
    expect(objectRef.current).toBeNull();
    expect(view.container.querySelector("rect")).not.toBeNull();
    view.unmount();
  });

  it("balances callback resources and observers in StrictMode", () => {
    let resources = 0;
    const callback = vi.fn((node: SVGSVGElement | null) => {
      expect(node).toBeInstanceOf(SVGSVGElement);
      resources++;
      return () => {
        resources--;
      };
    });
    const view = render(
      <StrictMode>
        <div>
          <StrokeTraceBorder ref={callback} />
        </div>
      </StrictMode>,
    );
    expect(callback.mock.calls.length).toBeGreaterThan(1);
    expect(
      callback.mock.calls.every(([node]) => node instanceof SVGSVGElement),
    ).toBe(true);
    expect(resources).toBe(1);
    view.unmount();
    expect(resources).toBe(0);
    expect(observers.every((observer) => observer.disconnected)).toBe(true);
  });

  it("follows the parent's border box, clamps the explicit radius, and cleans up", () => {
    const ref = createRef<SVGSVGElement>();
    const view = render(
      <div
        style={{
          borderTopLeftRadius: "999px",
          borderTopWidth: "1px",
          borderTopStyle: "solid",
        }}
      >
        <StrokeTraceBorder ref={ref} radius={999} />
      </div>,
    );
    const host = ref.current!.parentElement!;
    expect(ref.current!.dataset.slot).toBe("stroke-trace-border");
    expect(observers[0]!.observe).toHaveBeenCalledExactlyOnceWith(host, {
      box: "border-box",
    });

    Object.defineProperty(host, "offsetWidth", { value: 120 });
    Object.defineProperty(host, "offsetHeight", { value: 40 });
    act(() => observers[0]!.callback([], {} as ResizeObserver));

    const rect = ref.current!.querySelector("rect")!;
    expect(rect.getAttribute("width")).toBe("120");
    expect(rect.getAttribute("height")).toBe("40");
    expect(rect.getAttribute("rx")).toBe("20");
    expect(rect.getAttribute("pathLength")).toBe("1");
    expect(ref.current!.style.top).toBe("-1px");

    view.unmount();
    expect(observers[0]!.disconnected).toBe(true);
    expect(ref.current).toBeNull();
  });
});
