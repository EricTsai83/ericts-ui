// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ExpandableSlider,
  ExpandableSliderRail,
  ExpandableSliderRange,
  ExpandableSliderThumb,
  ExpandableSliderTrack,
  ExpandableSliderTrigger,
  type ExpandableSliderProps,
} from "@/registry/base/ui/expandable-slider";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const TRACK_WIDTH = 72;
const THUMB_SIZE = 12;
const COLLAPSE_DELAY = 300;
/** Track width plus its lead and tail insets. */
const PANEL_WIDTH = "88px";
const PANEL_WIDTH_PROPERTY = "--expandable-slider-panel-width";

function advanceTimers(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function renderSlider(
  props: Partial<ExpandableSliderProps> = {},
  children?: React.ReactNode,
) {
  const utils = render(
    <ExpandableSlider label="Volume" defaultValue={50} {...props}>
      <ExpandableSliderTrigger aria-label="Mute">
        <span>icon</span>
      </ExpandableSliderTrigger>
      {children ?? <ExpandableSliderTrack />}
    </ExpandableSlider>,
  );
  const slider = screen.getByRole("slider", { name: "Volume" });
  const root = slider.closest("[data-slot='expandable-slider']") as HTMLElement;
  const query = (slot: string) =>
    root.querySelector(`[data-slot='expandable-slider-${slot}']`) as HTMLElement;

  return {
    ...utils,
    slider,
    root,
    panel: query("panel"),
    // Events land on the full-height track; the value is measured off the rail.
    rail: query("rail"),
    thumb: query("thumb"),
  };
}

/** jsdom reports a zero-size rect, so the rail needs a measurable box. */
function stubRailRect(rail: HTMLElement, left = 100) {
  vi.spyOn(rail, "getBoundingClientRect").mockReturnValue({
    x: left,
    y: 0,
    left,
    top: 0,
    right: left + TRACK_WIDTH,
    bottom: 3,
    width: TRACK_WIDTH,
    height: 3,
    toJSON: () => ({}),
  } as DOMRect);

  // Pointer values are measured from the thumb center, not the rail edge.
  return (value: number) =>
    left + THUMB_SIZE / 2 + (value / 100) * (TRACK_WIDTH - THUMB_SIZE);
}

describe("ExpandableSlider", () => {
  it("stays collapsed until the group is hovered", () => {
    vi.useFakeTimers();

    const onExpandedChange = vi.fn();
    const { root, panel } = renderSlider({ onExpandedChange });

    expect(root.dataset.expanded).toBe("false");
    expect(panel.style.getPropertyValue(PANEL_WIDTH_PROPERTY)).toBe(PANEL_WIDTH);
    expect(panel.className).toContain("sm:w-0");

    fireEvent.pointerOver(root);

    expect(root.dataset.expanded).toBe("true");
    expect(onExpandedChange).toHaveBeenCalledWith(true);

    fireEvent.pointerOut(root);

    // The grace period keeps it open before it shrinks back to the icon.
    advanceTimers(COLLAPSE_DELAY - 1);
    expect(root.dataset.expanded).toBe("true");

    advanceTimers(1);
    expect(root.dataset.expanded).toBe("false");
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
  });

  it("stays visually expanded below the sm breakpoint from first paint", () => {
    const { root, panel, thumb } = renderSlider();

    expect(root.dataset.expanded).toBe("false");
    expect(root.className).toContain("border-border");
    expect(root.className).toContain("bg-background");
    expect(root.className).toContain("shadow-xs");
    expect(root.className).toContain("sm:border-transparent");
    expect(panel.className).toContain("w-(--expandable-slider-panel-width)");
    expect(panel.className).toContain(
      "sm:group-data-[expanded=true]/expandable-slider:w-(--expandable-slider-panel-width)",
    );
    expect(thumb.className).toContain(
      "sm:group-data-[expanded=false]/expandable-slider:scale-0",
    );
  });

  it("cancels a pending collapse when the pointer comes back", () => {
    vi.useFakeTimers();

    const onExpandedChange = vi.fn();
    const { root } = renderSlider({ onExpandedChange });

    fireEvent.pointerOver(root);
    fireEvent.pointerOut(root);
    advanceTimers(COLLAPSE_DELAY - 50);

    fireEvent.pointerOver(root);
    advanceTimers(COLLAPSE_DELAY);

    expect(root.dataset.expanded).toBe("true");
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
  });

  it("collapses immediately when the grace period is disabled", () => {
    vi.useFakeTimers();

    const { root } = renderSlider({ collapseDelay: 0 });

    fireEvent.pointerOver(root);
    fireEvent.pointerOut(root);

    expect(root.dataset.expanded).toBe("false");
  });

  it("re-arms a pending collapse against a changed delay", () => {
    vi.useFakeTimers();

    const { root, rerender } = renderSlider({ collapseDelay: 1000 });

    fireEvent.pointerOver(root);
    fireEvent.pointerOut(root);
    advanceTimers(200);
    expect(root.dataset.expanded).toBe("true");

    // Shortening mid-countdown re-targets the time already elapsed.
    rerender(
      <ExpandableSlider label="Volume" defaultValue={50} collapseDelay={500}>
        <ExpandableSliderTrigger aria-label="Mute">
          <span>icon</span>
        </ExpandableSliderTrigger>
        <ExpandableSliderTrack />
      </ExpandableSlider>,
    );

    advanceTimers(299);
    expect(root.dataset.expanded).toBe("true");

    advanceTimers(1);
    expect(root.dataset.expanded).toBe("false");
  });

  it("collapses at once when the delay drops below the elapsed time", () => {
    vi.useFakeTimers();

    const { root, rerender } = renderSlider({ collapseDelay: 1000 });

    fireEvent.pointerOver(root);
    fireEvent.pointerOut(root);
    advanceTimers(400);
    expect(root.dataset.expanded).toBe("true");

    rerender(
      <ExpandableSlider label="Volume" defaultValue={50} collapseDelay={100}>
        <ExpandableSliderTrigger aria-label="Mute">
          <span>icon</span>
        </ExpandableSliderTrigger>
        <ExpandableSliderTrack />
      </ExpandableSlider>,
    );

    advanceTimers(0);
    expect(root.dataset.expanded).toBe("false");
  });

  it("drops a pending collapse when it unmounts", () => {
    vi.useFakeTimers();

    const { root, unmount } = renderSlider();

    fireEvent.pointerOver(root);
    fireEvent.pointerOut(root);
    unmount();

    expect(() => advanceTimers(COLLAPSE_DELAY)).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("expands while any control inside it holds focus", () => {
    const { root, slider } = renderSlider();

    fireEvent.focus(slider);
    expect(root.dataset.expanded).toBe("true");

    fireEvent.blur(slider, { relatedTarget: document.body });
    expect(root.dataset.expanded).toBe("false");
  });

  it("exposes the value through slider semantics", () => {
    const { slider } = renderSlider({
      defaultValue: 70,
      formatValueText: (value) => `${value}%`,
    });

    expect(slider.getAttribute("aria-valuemin")).toBe("0");
    expect(slider.getAttribute("aria-valuemax")).toBe("100");
    expect(slider.getAttribute("aria-valuenow")).toBe("70");
    expect(slider.getAttribute("aria-valuetext")).toBe("70%");
    expect(slider.getAttribute("aria-orientation")).toBe("horizontal");
  });

  it("keeps the desktop surface transparent until it expands", () => {
    const { root } = renderSlider();

    expect(root.className).toContain("sm:border-transparent");
    expect(root.className).toContain("sm:bg-transparent");
    expect(root.className).toContain("sm:shadow-none");
    expect(root.className).toContain("sm:data-[expanded=true]:bg-background");
    expect(root.className).toContain("sm:data-[expanded=true]:border-border");
    expect(root.className).toContain("sm:data-[expanded=true]:shadow-xs");
  });

  it("puts the slider on the full-height region, not the hairline rail", () => {
    const { slider, rail } = renderSlider();

    expect(slider).not.toBe(rail);
    expect(slider.contains(rail)).toBe(true);
    expect(slider.className).toContain("h-full");
    expect(rail.getAttribute("aria-hidden")).toBe("true");
  });

  it("steps and clamps with the keyboard", () => {
    const onValueChange = vi.fn();
    const { slider } = renderSlider({ defaultValue: 50, step: 5, onValueChange });

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("aria-valuenow")).toBe("55");

    fireEvent.keyDown(slider, { key: "ArrowDown" });
    expect(slider.getAttribute("aria-valuenow")).toBe("50");

    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");

    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider.getAttribute("aria-valuenow")).toBe("0");

    fireEvent.keyDown(slider, { key: "End" });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");

    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      55, 50, 100, 0, 100,
    ]);
  });

  it("snaps fractional steps without floating point drift", () => {
    const { slider } = renderSlider({
      defaultValue: 0,
      min: 0,
      max: 1,
      step: 0.1,
    });

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(slider.getAttribute("aria-valuenow")).toBe("0.3");
  });

  it("maps a pointer drag onto the rail and keeps the panel expanded", () => {
    const onValueChange = vi.fn();
    const { slider, root, rail } = renderSlider({
      defaultValue: 0,
      collapseDelay: 0,
      onValueChange,
    });
    const clientXFor = stubRailRect(rail);

    fireEvent.pointerDown(slider, {
      button: 0,
      pointerId: 1,
      clientX: clientXFor(25),
    });
    expect(slider.getAttribute("aria-valuenow")).toBe("25");
    expect(root.dataset.expanded).toBe("true");

    fireEvent.pointerMove(slider, { pointerId: 1, clientX: clientXFor(80) });
    expect(slider.getAttribute("aria-valuenow")).toBe("80");

    // Dragging past the end clamps instead of overshooting.
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: clientXFor(400) });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");

    // The press focuses the track, so the panel stays open past the pointer.
    fireEvent.pointerUp(slider, { pointerId: 1 });
    fireEvent.pointerOut(root);
    expect(root.dataset.expanded).toBe("true");

    fireEvent.blur(slider, { relatedTarget: document.body });
    expect(root.dataset.expanded).toBe("false");

    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      25, 80, 100,
    ]);
  });

  it("reports controlled changes without mutating the value", () => {
    const onValueChange = vi.fn();
    const { slider } = renderSlider({ value: 40, onValueChange });

    fireEvent.keyDown(slider, { key: "ArrowRight" });

    expect(slider.getAttribute("aria-valuenow")).toBe("40");
    expect(onValueChange).toHaveBeenCalledWith(41);
  });

  it("honours a controlled expanded state over hover", () => {
    const { root, panel } = renderSlider({ expanded: true });

    expect(panel.style.getPropertyValue(PANEL_WIDTH_PROPERTY)).toBe(PANEL_WIDTH);

    fireEvent.pointerOut(root);

    expect(root.dataset.expanded).toBe("true");
  });

  it("routes trigger clicks to the consumer", () => {
    const onClick = vi.fn();

    render(
      <ExpandableSlider label="Volume">
        <ExpandableSliderTrigger aria-label="Mute" onClick={onClick}>
          <span>icon</span>
        </ExpandableSliderTrigger>
        <ExpandableSliderTrack />
      </ExpandableSlider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mute" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ignores interaction and stays collapsed while disabled", () => {
    const onValueChange = vi.fn();
    const { root, slider } = renderSlider({ disabled: true, onValueChange });

    expect(slider.tabIndex).toBe(-1);
    expect(slider.getAttribute("aria-disabled")).toBe("true");
    expect(
      (screen.getByRole("button", { name: "Mute" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.pointerOver(root);
    expect(root.dataset.expanded).toBe("false");

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("anchors the track to the trailing edge when it precedes the trigger", () => {
    render(
      <ExpandableSlider label="Volume" expanded>
        <ExpandableSliderTrack align="end" />
        <ExpandableSliderTrigger aria-label="Mute">
          <span>icon</span>
        </ExpandableSliderTrigger>
      </ExpandableSlider>,
    );

    const slider = screen.getByRole("slider", { name: "Volume" });
    const panel = slider.parentElement as HTMLElement;

    expect(panel.className).toContain("justify-end");
    // The lead inset sits beside the trigger, so the sides swap.
    expect(slider.style.marginLeft).toBe("12px");
    expect(slider.style.marginRight).toBe("4px");
    expect(panel.style.getPropertyValue(PANEL_WIDTH_PROPERTY)).toBe(PANEL_WIDTH);
  });

  describe("composition", () => {
    it("publishes rail geometry as CSS variables for replacement parts", () => {
      const { rail } = renderSlider({ defaultValue: 50 });
      const travel = TRACK_WIDTH - THUMB_SIZE;

      expect(rail.style.getPropertyValue("--expandable-slider-thumb-size")).toBe(
        `${THUMB_SIZE}px`,
      );
      expect(
        rail.style.getPropertyValue("--expandable-slider-thumb-offset"),
      ).toBe(`${travel / 2}px`);
      expect(rail.style.getPropertyValue("--expandable-slider-fill")).toBe(
        `${travel / 2 + THUMB_SIZE / 2}px`,
      );
    });

    it("lets the rail, range, and thumb be replaced", () => {
      const { slider, rail, thumb } = renderSlider(
        {},
        <ExpandableSliderTrack>
          <ExpandableSliderRail className="bg-red-500">
            <ExpandableSliderRange className="bg-blue-500" />
            <ExpandableSliderThumb className="rounded-none" />
          </ExpandableSliderRail>
        </ExpandableSliderTrack>,
      );

      expect(rail.className).toContain("bg-red-500");
      expect(thumb.className).toContain("rounded-none");
      // Replacing the parts must not cost the slider its semantics.
      expect(slider.getAttribute("aria-valuenow")).toBe("50");
    });

    it("keeps custom track content measurable through the rail", () => {
      const { slider, rail } = renderSlider(
        { defaultValue: 0, collapseDelay: 0 },
        <ExpandableSliderTrack>
          <ExpandableSliderRail>
            <span>custom</span>
            <ExpandableSliderThumb />
          </ExpandableSliderRail>
        </ExpandableSliderTrack>,
      );
      const clientXFor = stubRailRect(rail);

      expect(screen.getByText("custom")).toBeTruthy();

      fireEvent.pointerDown(slider, {
        button: 0,
        pointerId: 1,
        clientX: clientXFor(60),
      });

      expect(slider.getAttribute("aria-valuenow")).toBe("60");
    });

    it("fails loudly when a part is rendered outside the root", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => render(<ExpandableSliderTrack />)).toThrow(
        /must be rendered inside <ExpandableSlider>/,
      );

      consoleError.mockRestore();
    });
  });

  describe("rtl", () => {
    it("mirrors pointer mapping and horizontal arrow keys when direction is rtl", () => {
      const onValueChange = vi.fn();
      const { slider, rail } = renderSlider({
        defaultValue: 50,
        collapseDelay: 0,
        onValueChange,
      });

      // The component reads the resolved writing direction, so stub the
      // computed style rather than relying on jsdom inheriting `dir`.
      const realGetComputedStyle = window.getComputedStyle;
      vi.spyOn(window, "getComputedStyle").mockImplementation(
        ((element: Element, pseudo?: string | null) => {
          const style = realGetComputedStyle(element, pseudo ?? undefined);

          return element === rail || element === slider
            ? ({ ...style, direction: "rtl" } as CSSStyleDeclaration)
            : style;
        }) as typeof window.getComputedStyle,
      );

      const clientXFor = stubRailRect(rail);

      // A pointer 25% from the physical left is 75% along an RTL track.
      fireEvent.pointerDown(slider, {
        button: 0,
        pointerId: 1,
        clientX: clientXFor(25),
      });
      expect(slider.getAttribute("aria-valuenow")).toBe("75");

      // ArrowLeft advances in RTL; the vertical pair keeps absolute meaning.
      fireEvent.keyDown(slider, { key: "ArrowLeft" });
      expect(slider.getAttribute("aria-valuenow")).toBe("76");

      fireEvent.keyDown(slider, { key: "ArrowRight" });
      expect(slider.getAttribute("aria-valuenow")).toBe("75");

      fireEvent.keyDown(slider, { key: "ArrowUp" });
      expect(slider.getAttribute("aria-valuenow")).toBe("76");
    });

    it("keeps ltr behavior untouched", () => {
      const { slider, rail } = renderSlider({
        defaultValue: 50,
        collapseDelay: 0,
      });
      const clientXFor = stubRailRect(rail);

      fireEvent.pointerDown(slider, {
        button: 0,
        pointerId: 1,
        clientX: clientXFor(25),
      });
      expect(slider.getAttribute("aria-valuenow")).toBe("25");

      fireEvent.keyDown(slider, { key: "ArrowRight" });
      expect(slider.getAttribute("aria-valuenow")).toBe("26");
    });
  });
});
