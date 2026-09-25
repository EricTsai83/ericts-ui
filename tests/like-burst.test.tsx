// @vitest-environment jsdom
import { createRef, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/ui/like-burst.css", () => ({}));

import { Button } from "@/components/ui/button";
import { LikeBurst } from "@/registry/base/ui/like-burst";

afterEach(cleanup);

const EFFECTS = '[data-slot="like-burst-effects"]';

/**
 * jsdom has no AnimationEvent constructor, so React falls back to listening
 * for the webkit-prefixed event name in this environment.
 */
function endAnimation(element: Element, animationName: string) {
  const animationEnd = new Event("webkitAnimationEnd", { bubbles: true });
  Object.assign(animationEnd, { animationName });
  fireEvent(element, animationEnd);
}

function settleBurst(container: HTMLElement) {
  for (const ring of container.querySelectorAll(".like-burst-ring")) {
    endAnimation(ring, "like-burst-ring");
  }

  for (const particle of container.querySelectorAll(".like-burst-particle")) {
    endAnimation(particle, "like-burst-particle");
  }
}

describe("LikeBurst", () => {
  it("configures the heart size and burst duration", () => {
    const { rerender } = render(<LikeBurst />);
    const control = screen.getByRole("button");

    // Defaults live in like-burst.css so CSS overrides stay possible — no
    // inline custom properties unless the props are provided.
    expect(control.style.getPropertyValue("--like-burst-size")).toBe("");
    expect(control.style.getPropertyValue("--like-burst-duration")).toBe("");

    rerender(<LikeBurst iconSize={40} duration={1000} />);
    expect(control.style.getPropertyValue("--like-burst-size")).toBe("40px");
    expect(control.style.getPropertyValue("--like-burst-duration")).toBe(
      "1000ms",
    );

    rerender(<LikeBurst iconSize="2.5rem" />);
    expect(control.style.getPropertyValue("--like-burst-size")).toBe("2.5rem");
  });

  it("toggles its uncontrolled state and plays the burst on like", () => {
    const { container } = render(<LikeBurst />);
    const control = screen.getByRole("button", { name: "Like" });

    expect(control.getAttribute("aria-pressed")).toBe("false");
    expect(control.getAttribute("data-liked")).toBe("false");
    expect(control.hasAttribute("data-bursting")).toBe(false);
    expect(container.querySelector(EFFECTS)).toBeNull();

    fireEvent.click(control);

    expect(
      screen.getByRole("button", { name: "Unlike" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(control.hasAttribute("data-bursting")).toBe(true);
    expect(container.querySelectorAll(".like-burst-ring")).toHaveLength(1);
    expect(container.querySelectorAll(".like-burst-particle")).toHaveLength(7);

    fireEvent.click(control);

    expect(
      screen.getByRole("button", { name: "Like" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
    expect(control.hasAttribute("data-bursting")).toBe(false);
    expect(container.querySelector(EFFECTS)).toBeNull();
  });

  it("reports controlled changes without latching", () => {
    const onLikedChange = vi.fn();
    render(<LikeBurst liked={false} onLikedChange={onLikedChange} />);

    const control = screen.getByRole("button", { name: "Like" });
    fireEvent.click(control);

    expect(onLikedChange).toHaveBeenCalledWith(true);
    expect(control.getAttribute("aria-pressed")).toBe("false");
    expect(control.getAttribute("data-liked")).toBe("false");
  });

  it("composes with another element and keeps both click handlers", () => {
    const onClick = vi.fn();
    const onLikedChange = vi.fn();

    render(
      <LikeBurst
        render={<Button variant="outline" data-testid="composed" />}
        onClick={onClick}
        onLikedChange={onLikedChange}
      >
        Save
      </LikeBurst>,
    );

    const control = screen.getByTestId("composed");
    fireEvent.click(control);

    expect(control.getAttribute("data-slot")).toBe("like-burst");
    expect(control.textContent).toContain("Save");
    expect(onClick).toHaveBeenCalledOnce();
    expect(onLikedChange).toHaveBeenCalledWith(true);
  });

  it("allows a consumer click handler to cancel the state change", () => {
    const onLikedChange = vi.fn();
    render(
      <LikeBurst
        onClick={(event) => event.preventDefault()}
        onLikedChange={onLikedChange}
      />,
    );

    const control = screen.getByRole("button", { name: "Like" });
    fireEvent.click(control);

    expect(control.getAttribute("aria-pressed")).toBe("false");
    expect(onLikedChange).not.toHaveBeenCalled();
  });

  it("forwards its ref to the rendered root", () => {
    const ref = createRef<HTMLElement>();
    render(<LikeBurst ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.dataset.slot).toBe("like-burst");
  });

  it("keeps the visible text as the accessible name when labeled", () => {
    render(<LikeBurst defaultLiked>Like</LikeBurst>);
    const control = screen.getByRole("button", { name: "Like" });

    // WCAG 2.5.3 — the state comes from aria-pressed, never from swapping
    // the accessible name away from the visible text.
    expect(control.getAttribute("aria-label")).toBeNull();
    expect(control.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(control);

    expect(screen.getByRole("button", { name: "Like" })).toBe(control);
    expect(control.getAttribute("aria-pressed")).toBe("false");
  });

  it("does not burst for an initially liked mount", () => {
    const { container } = render(<LikeBurst defaultLiked />);

    expect(screen.getByRole("button").hasAttribute("data-bursting")).toBe(
      false,
    );
    expect(container.querySelector(EFFECTS)).toBeNull();
  });

  it("unmounts the burst once the ring and every particle group finish", () => {
    const { container } = render(<LikeBurst />);
    const control = screen.getByRole("button", { name: "Like" });

    fireEvent.click(control);

    // The per-dot animations share the burst's clock and are not what it
    // waits on; the pop on the heart lives outside the burst layer.
    for (const particle of container.querySelectorAll(".like-burst-particle")) {
      endAnimation(particle, "like-burst-dot");
    }
    expect(container.querySelector(EFFECTS)).not.toBeNull();

    settleBurst(container);

    expect(container.querySelector(EFFECTS)).toBeNull();
    expect(control.hasAttribute("data-bursting")).toBe(false);
    expect(control.getAttribute("aria-pressed")).toBe("true");

    // Re-liking replays the burst from scratch.
    fireEvent.click(control);
    fireEvent.click(control);
    expect(container.querySelectorAll(".like-burst-particle")).toHaveLength(7);

    // The count restarts with each burst rather than carrying over.
    endAnimation(
      container.querySelector(".like-burst-ring") as Element,
      "like-burst-ring",
    );
    expect(container.querySelector(EFFECTS)).not.toBeNull();
  });

  it("does not burst when controlled state turns liked programmatically", () => {
    const { container, rerender } = render(<LikeBurst liked={false} />);

    // e.g. liked state arriving from a fetch or a realtime update.
    rerender(<LikeBurst liked />);

    expect(
      screen.getByRole("button", { name: "Unlike" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(container.querySelector(EFFECTS)).toBeNull();
  });

  it("bursts when a controlled parent accepts a click", () => {
    function ControlledLikeBurst() {
      const [liked, setLiked] = useState(false);
      return <LikeBurst liked={liked} onLikedChange={setLiked} />;
    }

    const { container } = render(<ControlledLikeBurst />);
    fireEvent.click(screen.getByRole("button", { name: "Like" }));

    expect(container.querySelectorAll(".like-burst-particle")).toHaveLength(7);
  });

  it("bursts when a non-optimistic parent commits the click later", () => {
    const { container, rerender } = render(<LikeBurst liked={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(container.querySelector(EFFECTS)).toBeNull();

    // e.g. the parent sets `liked` only after the API responds.
    rerender(<LikeBurst liked />);
    expect(container.querySelectorAll(".like-burst-particle")).toHaveLength(7);
  });

  it("drops an in-flight burst when unliked mid-burst", () => {
    function ControlledLikeBurst({ forced }: { forced?: boolean }) {
      const [liked, setLiked] = useState(false);
      return <LikeBurst liked={forced ?? liked} onLikedChange={setLiked} />;
    }

    const { container, rerender } = render(<ControlledLikeBurst />);
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(container.querySelectorAll(".like-burst-particle")).toHaveLength(7);

    rerender(<ControlledLikeBurst forced={false} />);
    expect(container.querySelector(EFFECTS)).toBeNull();

    // Returning to the parent's liked state is programmatic — no replay.
    rerender(<ControlledLikeBurst />);
    expect(
      screen.getByRole("button", { name: "Unlike" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(container.querySelector(EFFECTS)).toBeNull();
  });

  it("ignores clicks while disabled", () => {
    const onLikedChange = vi.fn();
    render(<LikeBurst disabled onLikedChange={onLikedChange} />);
    const control = screen.getByRole("button", { name: "Like" });

    fireEvent.click(control);

    expect(control.getAttribute("aria-pressed")).toBe("false");
    expect(onLikedChange).not.toHaveBeenCalled();
  });
});
