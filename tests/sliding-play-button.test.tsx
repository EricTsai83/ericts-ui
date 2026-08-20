// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SlidingPlayButton,
  slidingPlayPauseIconStyles,
  slidingPlayPauseIconTransitionStyles,
} from "@/registry/base/ui/sliding-play-button";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function scale(transform: string, axis: "X" | "Y") {
  return Number(transform.match(new RegExp(`scale${axis}\\(([^)]+)\\)`))?.[1]);
}

function translateX(transform: string) {
  const percent = Number(
    transform.match(/translateX\((-?[^)]+)%\)/)?.[1],
  );

  return (percent / 100) * 36;
}

function renderButton(
  props: Partial<React.ComponentProps<typeof SlidingPlayButton>> = {},
) {
  const utils = render(<SlidingPlayButton {...props} />);
  const button = screen.getByRole("button");
  const leftBar = button.querySelector(
    '[data-slot="sliding-play-button-left-bar"]',
  ) as SVGRectElement;
  const rightBar = button.querySelector(
    '[data-slot="sliding-play-button-right-bar"]',
  ) as SVGRectElement;
  const triangle = button.querySelector(
    '[data-slot="sliding-play-button-triangle"]',
  ) as SVGPathElement;

  return { ...utils, button, leftBar, rightBar, triangle };
}

describe("slidingPlayPauseIconStyles", () => {
  it("starts as one triangle with both rectangles hidden underneath", () => {
    const play = slidingPlayPauseIconStyles(0);

    expect(play.leftBar).toEqual({ transform: "scaleY(0.5)", opacity: 0 });
    expect(play.rightBar).toEqual({
      transform: "translateX(-36.1111%) scaleX(0.5)",
      opacity: 0,
    });
    expect(play.triangle).toEqual({
      transform: "scaleX(1) scaleY(1)",
      opacity: 1,
    });
  });

  it("compresses the same triangle into the right pause rectangle", () => {
    const pause = slidingPlayPauseIconStyles(1);

    expect(pause.leftBar).toEqual({ transform: "scaleY(1)", opacity: 1 });
    expect(pause.rightBar).toEqual({
      transform: "translateX(0%) scaleX(1)",
      opacity: 1,
    });
    expect(scale(pause.triangle.transform, "X")).toBeCloseTo(7 / 25.5, 4);
    expect(scale(pause.triangle.transform, "Y")).toBe(0.9);
    expect(pause.triangle.opacity).toBe(1);
  });

  it("uses a softer left-bar rebound and settles both bars together", () => {
    const samples = Array.from({ length: 201 }, (_, step) =>
      slidingPlayPauseIconStyles(step / 200),
    );
    const rightTranslations = samples.map(({ rightBar }) =>
      translateX(rightBar.transform),
    );
    const rightScales = samples.map(({ rightBar }) =>
      scale(rightBar.transform, "X"),
    );
    const leftScales = samples.map(({ leftBar }) =>
      scale(leftBar.transform, "Y"),
    );
    const rightPeak = Math.max(...rightTranslations);
    const leftPeak = Math.max(...leftScales);
    const rightScalePeak = Math.max(...rightScales);

    expect(rightPeak).toBeGreaterThan(3.2);
    expect(rightPeak).toBeLessThan(3.3);
    expect(leftPeak).toBe(1.2);
    expect(rightScalePeak).toBe(1.25);
    expect(rightTranslations[120]).toBe(rightPeak);
    expect(leftScales[120]).toBe(leftPeak);
    for (let step = 120; step < samples.length; step += 1) {
      expect(rightScales[step] - 1).toBeCloseTo(
        rightTranslations[step] / 13,
        3,
      );
      expect((leftScales[step] - 1) / 0.2).toBeCloseTo(
        (rightScales[step] - 1) / 0.25,
        3,
      );
    }
    expect(leftScales.at(-1)).toBe(1);
    expect(rightTranslations.at(-1)).toBe(0);
  });

  it("rebounds left then right when returning from pause to play", () => {
    const samples = Array.from({ length: 201 }, (_, step) =>
      slidingPlayPauseIconTransitionStyles(step / 200, false),
    );
    const rightTranslations = samples.map(({ rightBar }) =>
      translateX(rightBar.transform),
    );
    const triangleScales = samples.map(({ triangle }) =>
      scale(triangle.transform, "X"),
    );
    const rightScales = samples.map(({ rightBar }) =>
      scale(rightBar.transform, "X"),
    );
    const leftmost = Math.min(...rightTranslations);

    expect(rightTranslations[0]).toBe(0);
    expect(leftmost).toBeGreaterThan(-16.3);
    expect(leftmost).toBeLessThan(-16.2);
    expect(rightTranslations[120]).toBe(leftmost);
    expect(rightTranslations.at(-1)).toBeCloseTo(-13, 3);
    expect(rightScales[120]).toBeCloseTo(0.375, 3);
    expect(rightScales.at(-1)).toBe(0.5);
    expect(triangleScales[120]).toBeGreaterThan(1.15);
    expect(triangleScales.at(-1)).toBe(1);
  });

  it("turns around smoothly at the rebound peak in both directions", () => {
    const peak = 0.6;
    const offset = 0.005;

    for (const playing of [true, false]) {
      const before = slidingPlayPauseIconTransitionStyles(
        peak - offset,
        playing,
      );
      const atPeak = slidingPlayPauseIconTransitionStyles(peak, playing);
      const after = slidingPlayPauseIconTransitionStyles(
        peak + offset,
        playing,
      );
      const beforeX = translateX(before.rightBar.transform);
      const peakX = translateX(atPeak.rightBar.transform);
      const afterX = translateX(after.rightBar.transform);

      expect(Math.abs(peakX - beforeX)).toBeLessThan(0.01);
      expect(Math.abs(afterX - peakX)).toBeLessThan(0.01);
    }
  });

  it("leaves the rebound peak without visually lingering", () => {
    const forward = slidingPlayPauseIconTransitionStyles(0.75, true);
    const reverse = slidingPlayPauseIconTransitionStyles(0.75, false);

    expect(translateX(forward.rightBar.transform)).toBeLessThan(2.7);
    expect(translateX(reverse.rightBar.transform)).toBeGreaterThan(-15.6);
  });

  it("starts pause to play immediately instead of waiting for a reversed window", () => {
    const start = slidingPlayPauseIconTransitionStyles(0, false);
    const firstBeat = slidingPlayPauseIconTransitionStyles(0.05, false);

    expect(scale(firstBeat.triangle.transform, "X")).toBeGreaterThan(
      scale(start.triangle.transform, "X"),
    );
    expect(scale(firstBeat.leftBar.transform, "Y")).toBeLessThan(
      scale(start.leftBar.transform, "Y"),
    );
    expect(firstBeat.leftBar.opacity).toBeLessThan(start.leftBar.opacity);
  });

  it("clamps progress and never emits non-finite transforms", () => {
    expect(slidingPlayPauseIconStyles(-2)).toEqual(
      slidingPlayPauseIconStyles(0),
    );
    expect(slidingPlayPauseIconStyles(3)).toEqual(
      slidingPlayPauseIconStyles(1),
    );

    for (let step = 0; step <= 100; step += 1) {
      expect(JSON.stringify(slidingPlayPauseIconStyles(step / 100))).not.toMatch(
        /NaN|Infinity/,
      );
    }
  });
});

describe("SlidingPlayButton", () => {
  it("renders exactly three overlapping icon elements with the triangle on top", () => {
    const { button, leftBar, rightBar, triangle } = renderButton();
    const layers = button.querySelectorAll(
      '[data-slot^="sliding-play-button-"]:not(svg)',
    );

    expect(layers).toHaveLength(3);
    expect([...layers]).toEqual([leftBar, rightBar, triangle]);
    expect(leftBar.style.opacity).toBe("0");
    expect(rightBar.style.opacity).toBe("0");
    expect(triangle.style.transform).toBe("scaleX(1) scaleY(1)");
    expect(triangle.style.transformOrigin).not.toBe("50% 50%");
  });

  it("leaves six view-box units between the pause bars", () => {
    const { leftBar, rightBar } = renderButton({ defaultPlaying: true });
    const leftEdge = Number(leftBar.getAttribute("x"));
    const leftWidth = Number(leftBar.getAttribute("width"));
    const rightEdge = Number(rightBar.getAttribute("x"));

    expect(rightEdge - (leftEdge + leftWidth)).toBe(6);
  });

  it("mounts on the play state and names itself for the next action", () => {
    const { button } = renderButton();

    expect(button.dataset.state).toBe("paused");
    expect(button.getAttribute("aria-label")).toBe("Play");
  });

  it("toggles state and accessible name uncontrolled", () => {
    const onPlayingChange = vi.fn();
    const { button } = renderButton({ onPlayingChange });

    fireEvent.click(button);

    expect(button.dataset.state).toBe("playing");
    expect(button.getAttribute("aria-label")).toBe("Pause");
    expect(onPlayingChange).toHaveBeenCalledWith(true);

    fireEvent.click(button);

    expect(button.dataset.state).toBe("paused");
    expect(onPlayingChange).toHaveBeenLastCalledWith(false);
  });

  it("changes the glyph instantly for keyboard and assistive activation", () => {
    const { button, leftBar, rightBar, triangle } = renderButton();

    fireEvent.click(button, { detail: 0 });

    const pause = slidingPlayPauseIconStyles(1);
    expect(button.dataset.state).toBe("playing");
    expect(leftBar.style.transform).toBe(pause.leftBar.transform);
    expect(rightBar.style.transform).toBe(pause.rightBar.transform);
    expect(triangle.style.transform).toBe(pause.triangle.transform);
  });

  it("lets consumers disable the morph with a zero-duration transition", () => {
    const { button, leftBar, rightBar, triangle } = renderButton({
      transition: { duration: 0 },
    });

    fireEvent.click(button, { detail: 1 });

    const pause = slidingPlayPauseIconStyles(1);
    expect(leftBar.style.transform).toBe(pause.leftBar.transform);
    expect(rightBar.style.transform).toBe(pause.rightBar.transform);
    expect(triangle.style.transform).toBe(pause.triangle.transform);
  });

  it("reports controlled changes without mutating the state", () => {
    const onPlayingChange = vi.fn();
    const { button } = renderButton({ playing: false, onPlayingChange });

    fireEvent.click(button);

    expect(button.dataset.state).toBe("paused");
    expect(onPlayingChange).toHaveBeenCalledWith(true);
  });

  it("mounts already composed as pause when it starts playing", () => {
    const { leftBar, rightBar, triangle } = renderButton({
      defaultPlaying: true,
    });
    const pause = slidingPlayPauseIconStyles(1);

    expect(leftBar.style.transform).toBe(pause.leftBar.transform);
    expect(rightBar.style.transform).toBe(pause.rightBar.transform);
    expect(triangle.style.transform).toBe(pause.triangle.transform);
  });

  it("lets a consumer cancel the toggle from onClick", () => {
    const onPlayingChange = vi.fn();
    const { button } = renderButton({
      onPlayingChange,
      onClick: (event) => event.preventDefault(),
    });

    fireEvent.click(button);

    expect(button.dataset.state).toBe("paused");
    expect(onPlayingChange).not.toHaveBeenCalled();
  });

  it("publishes its diameter as a CSS variable", () => {
    const { button } = renderButton();

    expect(button.style.getPropertyValue("--sliding-play-button-size")).toBe(
      "40px",
    );
    expect(button.style.width).toBe("var(--sliding-play-button-size)");

    cleanup();

    expect(
      render(<SlidingPlayButton size={64} />)
        .getByRole("button")
        .style.getPropertyValue("--sliding-play-button-size"),
    ).toBe("64px");
  });

  it("defaults to ghost, opts into frosted, and ignores disabled clicks", () => {
    const onPlayingChange = vi.fn();
    const { button } = renderButton({ disabled: true, onPlayingChange });

    expect(button.className).not.toContain("backdrop-blur");
    fireEvent.click(button);
    expect(onPlayingChange).not.toHaveBeenCalled();

    cleanup();

    const frostedButton = render(
      <SlidingPlayButton surface="frosted" />,
    ).getByRole("button");
    expect(frostedButton.className).toContain("backdrop-blur");
    expect(frostedButton.className).toContain("bg-ericts-media-control/30");
  });

  it("uses restrained press feedback and preserves reduced-motion fades", () => {
    const { button, leftBar, rightBar } = renderButton();

    expect(button.className).toContain("active:scale-[0.97]");
    expect(button.className).not.toContain("active:scale-[0.94]");
    expect(button.className).toContain("motion-reduce:transition-colors");
    expect(leftBar.className.baseVal).toContain(
      "motion-reduce:transition-opacity",
    );
    expect(rightBar.className.baseVal).toContain(
      "motion-reduce:transition-opacity",
    );
  });
});
