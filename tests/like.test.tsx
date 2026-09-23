// @vitest-environment jsdom
import { createRef, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/ui/like.css", () => ({}));

import { Button } from "@/components/ui/button";
import { Like } from "@/registry/base/ui/like";

afterEach(cleanup);

describe("Like", () => {
  it("configures the heart size, particle duration, and fill origin", () => {
    const { rerender } = render(<Like />);
    const control = screen.getByRole("button");

    // Defaults live in like.css so CSS overrides stay possible — no inline
    // custom properties unless the props are provided.
    expect(control.style.getPropertyValue("--like-size")).toBe("");
    expect(control.style.getPropertyValue("--like-duration")).toBe("");
    expect(control.style.getPropertyValue("--like-fill-origin")).toBe("");

    rerender(<Like iconSize={40} duration={500} />);
    expect(control.style.getPropertyValue("--like-size")).toBe("40px");
    expect(control.style.getPropertyValue("--like-duration")).toBe("500ms");

    rerender(<Like iconSize="2.5rem" />);
    expect(control.style.getPropertyValue("--like-size")).toBe("2.5rem");

    rerender(<Like fillOrigin="50% 100%" />);
    expect(control.style.getPropertyValue("--like-fill-origin")).toBe(
      "50% 100%",
    );
  });

  it("toggles its uncontrolled state and accessible action", () => {
    const { container } = render(<Like />);
    const control = screen.getByRole("button", { name: "Like" });

    expect(control.getAttribute("aria-pressed")).toBe("false");
    expect(control.getAttribute("data-liked")).toBe("false");
    expect(container.querySelector('[data-slot="like-burst"]')).toBeNull();

    fireEvent.click(control);

    expect(
      screen.getByRole("button", { name: "Unlike" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(container.querySelectorAll(".like-particle")).toHaveLength(8);
    expect(container.querySelectorAll(".like-particle-heart")).toHaveLength(8);

    fireEvent.click(control);

    expect(
      screen.getByRole("button", { name: "Like" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("false");
    expect(container.querySelector('[data-slot="like-burst"]')).toBeNull();
  });

  it("reports controlled changes without latching", () => {
    const onLikedChange = vi.fn();
    render(<Like liked={false} onLikedChange={onLikedChange} />);

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
      <Like
        render={<Button variant="outline" data-testid="composed" />}
        onClick={onClick}
        onLikedChange={onLikedChange}
      >
        Save
      </Like>,
    );

    const control = screen.getByTestId("composed");
    fireEvent.click(control);

    expect(control.getAttribute("data-slot")).toBe("like");
    expect(control.textContent).toContain("Save");
    expect(onClick).toHaveBeenCalledOnce();
    expect(onLikedChange).toHaveBeenCalledWith(true);
  });

  it("allows a consumer click handler to cancel the state change", () => {
    const onLikedChange = vi.fn();
    render(
      <Like
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
    render(<Like ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.dataset.slot).toBe("like");
  });

  it("keeps the visible text as the accessible name when labeled", () => {
    render(<Like defaultLiked>Like</Like>);
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
    const { container } = render(<Like defaultLiked />);

    expect(container.querySelector('[data-slot="like-burst"]')).toBeNull();
  });

  it("unmounts the burst once every particle has finished", () => {
    const { container } = render(<Like />);
    const control = screen.getByRole("button", { name: "Like" });

    fireEvent.click(control);

    const particles = container.querySelectorAll(".like-particle");
    expect(particles).toHaveLength(8);

    // jsdom has no AnimationEvent constructor, so React falls back to
    // listening for the webkit-prefixed event name in this environment.
    for (const particle of particles) {
      const animationEnd = new Event("webkitAnimationEnd", { bubbles: true });
      Object.assign(animationEnd, { animationName: "like-particle" });
      fireEvent(particle, animationEnd);
    }

    expect(container.querySelector('[data-slot="like-burst"]')).toBeNull();
    expect(control.getAttribute("aria-pressed")).toBe("true");

    // Re-liking replays the burst from scratch.
    fireEvent.click(control);
    fireEvent.click(control);
    expect(container.querySelectorAll(".like-particle")).toHaveLength(8);
  });

  it("does not burst when controlled state turns liked programmatically", () => {
    const { container, rerender } = render(<Like liked={false} />);

    // e.g. liked state arriving from a fetch or a realtime update.
    rerender(<Like liked />);

    expect(
      screen.getByRole("button", { name: "Unlike" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(container.querySelector('[data-slot="like-burst"]')).toBeNull();
  });

  it("bursts when a controlled parent accepts a click", () => {
    function ControlledLike() {
      const [liked, setLiked] = useState(false);
      return <Like liked={liked} onLikedChange={setLiked} />;
    }

    const { container } = render(<ControlledLike />);
    fireEvent.click(screen.getByRole("button", { name: "Like" }));

    expect(container.querySelectorAll(".like-particle")).toHaveLength(8);
  });

  it("bursts when a non-optimistic parent commits the click later", () => {
    const { container, rerender } = render(<Like liked={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(container.querySelector('[data-slot="like-burst"]')).toBeNull();

    // e.g. the parent sets `liked` only after the API responds.
    rerender(<Like liked />);
    expect(container.querySelectorAll(".like-particle")).toHaveLength(8);
  });

  it("drops an in-flight burst when unliked mid-burst", () => {
    function ControlledLike({ forced }: { forced?: boolean }) {
      const [liked, setLiked] = useState(false);
      return <Like liked={forced ?? liked} onLikedChange={setLiked} />;
    }

    const { container, rerender } = render(<ControlledLike />);
    fireEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(container.querySelectorAll(".like-particle")).toHaveLength(8);

    rerender(<ControlledLike forced={false} />);
    expect(container.querySelector('[data-slot="like-burst"]')).toBeNull();

    // Returning to the parent's liked state is programmatic — no replay.
    rerender(<ControlledLike />);
    expect(
      screen.getByRole("button", { name: "Unlike" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    expect(container.querySelector('[data-slot="like-burst"]')).toBeNull();
  });

  it("ignores clicks while disabled", () => {
    const onLikedChange = vi.fn();
    render(<Like disabled onLikedChange={onLikedChange} />);
    const control = screen.getByRole("button", { name: "Like" });

    fireEvent.click(control);

    expect(control.getAttribute("aria-pressed")).toBe("false");
    expect(onLikedChange).not.toHaveBeenCalled();
  });
});
