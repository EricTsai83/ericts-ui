// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlayButton, playPauseIconPath } from "@/registry/base/ui/play-button";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Replaces every number with `#` so only the command template is compared. */
function commandTemplate(path: string) {
  return path.replace(/-?\d+(?:\.\d+)?/g, "#");
}

function renderButton(
  props: Partial<React.ComponentProps<typeof PlayButton>> = {},
) {
  const utils = render(<PlayButton {...props} />);
  const button = screen.getByRole("button");
  const path = button.querySelector("path") as SVGPathElement;

  return { ...utils, button, path };
}

describe("playPauseIconPath", () => {
  it("reproduces the player's own play-triangle geometry", () => {
    const play = playPauseIconPath(0);

    // Left half: the rounded top-left and bottom-left corners, verbatim from
    // the source path data the icon was reverse-engineered from.
    expect(play).toContain("C 9.39 4.11 7.5 5.19 7.5 6.93");
    expect(play).toContain("C 7.5 30.81 9.39 31.89 10.89 31");
    // The split edge at x=17 and the tip at (33, 18) stay sharp.
    expect(play).toContain("L 17 27.4 C 17 27.4 17 27.4 17 27.4");
    expect(play).toContain("L 33 18 C 33 18 33 18 33 18");
  });

  it("draws two separated bars at the end of the morph", () => {
    const pause = playPauseIconPath(1);

    expect(pause.match(/M /g)).toHaveLength(2);
    // Left bar spans x 8.5–15.5, right bar 20.5–27.5, both y 4.5–31.5.
    expect(pause).toContain("8.5 29");
    expect(pause).toContain("15.5 7");
    expect(pause).toContain("20.5 29");
    expect(pause).toContain("27.5 7");
  });

  it("keeps one command template across the whole morph", () => {
    const reference = commandTemplate(playPauseIconPath(0));

    for (const progress of [0.01, 0.25, 0.5, 0.75, 0.99, 1]) {
      expect(commandTemplate(playPauseIconPath(progress))).toBe(reference);
    }
  });

  it("never emits a non-finite coordinate, including at the degenerate tip", () => {
    for (let step = 0; step <= 100; step += 1) {
      expect(playPauseIconPath(step / 100)).not.toMatch(/NaN|Infinity/);
    }
  });

  it("clamps progress outside 0–1", () => {
    expect(playPauseIconPath(-2)).toBe(playPauseIconPath(0));
    expect(playPauseIconPath(3)).toBe(playPauseIconPath(1));
  });
});

describe("PlayButton", () => {
  it("mounts on the play glyph and names itself for the next action", () => {
    const { button, path } = renderButton();

    expect(button.dataset.state).toBe("paused");
    expect(button.getAttribute("aria-label")).toBe("Play");
    expect(path.getAttribute("d")).toBe(playPauseIconPath(0));
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

  it("reports controlled changes without mutating the state", () => {
    const onPlayingChange = vi.fn();
    const { button } = renderButton({ playing: false, onPlayingChange });

    fireEvent.click(button);

    expect(button.dataset.state).toBe("paused");
    expect(onPlayingChange).toHaveBeenCalledWith(true);
  });

  it("mounts already morphed when it starts playing", () => {
    const { path } = renderButton({ defaultPlaying: true });

    expect(path.getAttribute("d")).toBe(playPauseIconPath(1));
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

  it("stays free of the bezel pulse by default", () => {
    const { button } = renderButton();

    fireEvent.click(button);
    fireEvent.click(button);

    expect(
      button.querySelector("[data-slot='play-button-pulse']"),
    ).toBeNull();
  });

  it("emits one pulse per toggle once opted in, and none before the first", () => {
    const { button } = renderButton({ pulseOnToggle: true });
    const pulses = () =>
      button.querySelectorAll("[data-slot='play-button-pulse']").length;

    expect(pulses()).toBe(0);

    fireEvent.click(button);

    expect(pulses()).toBe(1);

    fireEvent.click(button);

    expect(pulses()).toBe(1);
  });

  it("publishes its diameter as a CSS variable so consumers need no magic number", () => {
    const { button } = renderButton();

    // Matches the expanding slider's 40px control box.
    expect(button.style.getPropertyValue("--play-button-size")).toBe("40px");
    expect(button.style.width).toBe("var(--play-button-size)");

    cleanup();

    expect(
      render(<PlayButton size={64} />)
        .getByRole("button")
        .style.getPropertyValue("--play-button-size"),
    ).toBe("64px");
  });

  it("defaults to the ghost surface and opts into the frosted one", () => {
    const { button } = renderButton();

    expect(button.className).not.toContain("backdrop-blur");
    expect(button.className).not.toContain("bg-ericts-media-control/30");

    cleanup();

    const frostedButton = render(
      <PlayButton surface="frosted" />,
    ).getByRole("button");

    expect(frostedButton.className).toContain("backdrop-blur");
    expect(frostedButton.className).toContain("bg-ericts-media-control/30");
    expect(frostedButton.className).toContain(
      "text-ericts-media-control-foreground",
    );
  });

  it("ignores clicks while disabled", () => {
    const onPlayingChange = vi.fn();
    const { button } = renderButton({ disabled: true, onPlayingChange });

    fireEvent.click(button);

    expect(button.dataset.state).toBe("paused");
    expect(onPlayingChange).not.toHaveBeenCalled();
  });
});
