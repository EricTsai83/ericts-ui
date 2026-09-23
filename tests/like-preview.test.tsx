// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/ui/like.css", () => ({}));

import Preview from "@/components/previews/like";

afterEach(cleanup);

describe("Like preview", () => {
  it("compares fill origins and toggles them together", () => {
    render(<Preview />);

    const center = screen.getByRole("button", {
      name: "Like, fill from center",
    });
    const bottom = screen.getByRole("button", {
      name: "Like, fill from bottom",
    });

    expect(center.style.getPropertyValue("--like-fill-origin")).toBe("");
    expect(bottom.style.getPropertyValue("--like-fill-origin")).toBe(
      "50% 100%",
    );

    fireEvent.click(center);
    expect(center.getAttribute("aria-pressed")).toBe("true");
    expect(bottom.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(screen.getByRole("button", { name: "Like all" }));
    const hearts = screen.getAllByRole("button", { pressed: true });
    expect(hearts).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Unlike all" }));
    expect(screen.queryAllByRole("button", { pressed: true })).toHaveLength(0);
  });
});
