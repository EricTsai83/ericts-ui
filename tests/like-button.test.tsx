// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/ui/like.css", () => ({}));

import { LikeButton } from "@/registry/base/ui/like-button";

afterEach(cleanup);

describe("LikeButton", () => {
  it("provides an independently stateful labeled button", () => {
    render(<LikeButton />);

    const control = screen.getByRole("button", { name: "Like" });
    const icon = control.querySelector('[data-icon="inline-start"]');

    expect(control.classList.contains("border-border")).toBe(true);
    expect(control.classList.contains("h-8")).toBe(true);
    expect(icon).not.toBeNull();
    expect(control.textContent).toContain("Like");

    fireEvent.click(control);

    // The accessible name stays the visible label; only the state flips.
    expect(screen.getByRole("button", { name: "Like" })).toBe(control);
    expect(control.getAttribute("aria-label")).toBeNull();
    expect(control.getAttribute("aria-pressed")).toBe("true");
  });

  it("supports the shadcn Button variants and sizes", () => {
    render(<LikeButton variant="secondary" size="sm" iconSize={20} />);

    const control = screen.getByRole("button", { name: "Like" });
    const icon = control.querySelector<HTMLElement>("[data-slot=like-icon]");

    expect(control.classList.contains("bg-secondary")).toBe(true);
    expect(control.classList.contains("h-7")).toBe(true);
    expect(icon).not.toBeNull();
    expect(control.style.getPropertyValue("--like-size")).toBe("20px");
  });
});
