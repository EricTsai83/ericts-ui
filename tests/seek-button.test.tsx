// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SeekButton,
  nextSeekRotation,
} from "@/registry/base/ui/seek-button";

beforeEach(() => {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderButton(
  props: Partial<React.ComponentProps<typeof SeekButton>> = {},
) {
  const utils = render(<SeekButton {...props} />);
  const button = screen.getByRole("button");
  const icon = button.querySelector(
    "[data-slot='seek-button-icon']",
  ) as HTMLElement;

  return { ...utils, button, icon };
}

describe("nextSeekRotation", () => {
  it("adds a whole turn in the direction of the seek", () => {
    expect(nextSeekRotation(0, "forward")).toBe(360);
    expect(nextSeekRotation(0, "backward")).toBe(-360);
  });

  it("stacks turns instead of restarting, so a burst keeps spinning", () => {
    let rotation = 0;

    for (let press = 0; press < 3; press += 1) {
      rotation = nextSeekRotation(rotation, "forward");
    }

    expect(rotation).toBe(1080);
  });

  it("unwinds a forward turn when the direction flips", () => {
    expect(nextSeekRotation(360, "backward")).toBe(0);
  });
});

describe("SeekButton", () => {
  it("names itself by direction and amount, and publishes both", () => {
    const { button } = renderButton();

    expect(button.dataset.slot).toBe("seek-button");
    expect(button.dataset.direction).toBe("forward");
    expect(button.getAttribute("aria-label")).toBe("Forward 10 seconds");

    cleanup();

    const backward = render(
      <SeekButton direction="backward" seconds={30} />,
    ).getByRole("button");

    expect(backward.dataset.direction).toBe("backward");
    expect(backward.getAttribute("aria-label")).toBe("Back 30 seconds");
  });

  it("lets a consumer replace the generated accessible name", () => {
    const { button } = renderButton({ "aria-label": "快進 10 秒" });

    expect(button.getAttribute("aria-label")).toBe("快進 10 秒");
  });

  it("reports the seek as a signed offset in seconds", () => {
    const onSeek = vi.fn();
    const { button } = renderButton({ onSeek });

    fireEvent.click(button);

    expect(onSeek).toHaveBeenCalledWith(10);

    cleanup();

    const backward = render(
      <SeekButton direction="backward" seconds={15} onSeek={onSeek} />,
    ).getByRole("button");

    fireEvent.click(backward);

    expect(onSeek).toHaveBeenLastCalledWith(-15);
  });

  it("prints the amount inside the ring, and drops it on request", () => {
    const { button } = renderButton({ seconds: 15 });

    expect(
      button.querySelector("[data-slot='seek-button-seconds']")?.textContent,
    ).toBe("15");

    cleanup();

    expect(
      render(<SeekButton showSeconds={false} />)
        .getByRole("button")
        .querySelector("[data-slot='seek-button-seconds']"),
    ).toBeNull();
  });

  it("keeps the amount upright: it sits outside the element that spins", () => {
    const { button, icon } = renderButton();

    expect(
      icon.querySelector("[data-slot='seek-button-seconds']"),
    ).toBeNull();
    expect(
      button.querySelector("[data-slot='seek-button-seconds']"),
    ).not.toBeNull();
  });

  it("spins whatever icon it is given in place of the default ring", () => {
    const { icon } = renderButton({
      icon: <span data-testid="custom-icon" />,
    });

    expect(icon.querySelector("[data-testid='custom-icon']")).not.toBeNull();
    expect(icon.querySelector("path")).toBeNull();
  });

  it("mirrors the default ring for the backward direction", () => {
    const forward = renderButton().icon.querySelector("g");

    cleanup();

    const backward = render(<SeekButton direction="backward" />)
      .getByRole("button")
      .querySelector("[data-slot='seek-button-icon'] g");

    expect(forward?.getAttribute("transform")).toBeNull();
    expect(backward?.getAttribute("transform")).toBe(
      "translate(36 0) scale(-1 1)",
    );
  });

  it("turns the glyph on press", async () => {
    const { button, icon } = renderButton({ transition: { duration: 0.01 } });

    fireEvent.click(button);

    await waitFor(() => {
      expect(icon.style.transform).toContain("rotate(360deg)");
    });
  });

  it("leaves the glass itself still while the glyph turns", async () => {
    const { button, icon } = renderButton({ transition: { duration: 0.01 } });
    const sheen = button.querySelector(
      "[data-slot='seek-button-sheen']",
    ) as HTMLElement;

    fireEvent.click(button);

    await waitFor(() => {
      expect(icon.style.transform).toContain("rotate(360deg)");
    });

    // The pane is fixed to the page, so its light cannot drift with the spin.
    expect(sheen.style.transform).toBe("");
  });

  it("publishes its diameter as a CSS variable so consumers need no magic number", () => {
    const { button } = renderButton();

    expect(button.style.getPropertyValue("--seek-button-size")).toBe("40px");
    expect(button.style.width).toBe("var(--seek-button-size)");

    cleanup();

    expect(
      render(<SeekButton size={64} />)
        .getByRole("button")
        .style.getPropertyValue("--seek-button-size"),
    ).toBe("64px");
  });

  it("defaults to glass: a refracting, tinted disc with a hairline edge", () => {
    const { button } = renderButton();

    expect(button.className).toContain("backdrop-blur-md");
    expect(button.className).toContain("backdrop-saturate-150");
    expect(button.className).toContain("bg-background/25");
    expect(button.className).toContain("inset-ring-foreground/12");
    // Achromatic light lives in the component, not in a theme variable.
    expect(button.className).toContain("oklch(1_0_0_/_55%)");
  });

  it("lifts the scrim in the dark instead of scrimming dark with more dark", () => {
    const { button } = renderButton();
    const sheen = button.querySelector(
      "[data-slot='seek-button-sheen']",
    ) as HTMLElement;

    expect(button.className).toContain("dark:bg-foreground/10");
    expect(button.className).toContain("dark:inset-ring-foreground/20");
    // Once the pane separates on its own, the specular stops carrying it.
    expect(sheen.className).toContain("dark:opacity-40");
  });

  it("stacks the glass: a rim lens and a specular sheen under the glyph", () => {
    const { button, icon } = renderButton();
    const lens = button.querySelector(
      "[data-slot='seek-button-lens']",
    ) as HTMLElement;
    const sheen = button.querySelector(
      "[data-slot='seek-button-sheen']",
    ) as HTMLElement;

    expect(lens.style.maskImage).toContain("radial-gradient");
    expect(sheen.style.backgroundImage).toContain("conic-gradient");
    // Both are decoration behind the glyph, never in the accessibility tree.
    expect(lens.getAttribute("aria-hidden")).toBe("true");
    expect(sheen.getAttribute("aria-hidden")).toBe("true");
    expect(
      sheen.compareDocumentPosition(icon) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("leaves the ghost surface with nothing but its glyph", () => {
    const { button } = renderButton({ surface: "ghost" });

    expect(button.querySelector("[data-slot='seek-button-lens']")).toBeNull();
    expect(button.querySelector("[data-slot='seek-button-sheen']")).toBeNull();
  });

  it("drops the disc for the ghost surface and repaints it for over-video glass", () => {
    const ghost = renderButton({ surface: "ghost" }).button;

    expect(ghost.className).not.toContain("bg-background/25");
    expect(ghost.className).not.toContain("backdrop-blur");
    expect(ghost.className).not.toContain("inset-ring");

    cleanup();

    const frosted = render(<SeekButton surface="frosted" />).getByRole(
      "button",
    );

    expect(frosted.className).not.toContain("bg-background/25");
    expect(frosted.className).toContain("backdrop-blur-[16px]");
    expect(frosted.className).toContain("bg-ericts-media-control/30");
    expect(frosted.className).toContain("text-ericts-media-control-foreground");
    expect(frosted.className).toContain(
      "inset-ring-ericts-media-control-foreground/20",
    );
  });

  it("lets a consumer cancel the seek from onClick", () => {
    const onSeek = vi.fn();
    const { button } = renderButton({
      onSeek,
      onClick: (event) => event.preventDefault(),
    });

    fireEvent.click(button);

    expect(onSeek).not.toHaveBeenCalled();
  });

  it("ignores clicks while disabled", () => {
    const onSeek = vi.fn();
    const { button } = renderButton({ disabled: true, onSeek });

    fireEvent.click(button);

    expect(onSeek).not.toHaveBeenCalled();
  });

  it("forwards a ref to the button node", () => {
    const ref = createRef<HTMLButtonElement>();

    render(<SeekButton ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.dataset.slot).toBe("seek-button");
  });
});
