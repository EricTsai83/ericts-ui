// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/registry/base/ui/like.css", () => ({}));

import Preview from "@/components/previews/like";

afterEach(cleanup);

describe("Like preview", () => {
  it("shows only the icon-only example", () => {
    render(<Preview />);

    const iconOnly = screen.getByRole("button", { name: "Like" });
    fireEvent.click(iconOnly);

    expect(iconOnly.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});
