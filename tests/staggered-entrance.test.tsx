// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// Stub the component's own stylesheet import: Vitest/Vite's default CSS
// pipeline resolves this project's `postcss` config, which is only valid
// inside the Next.js build; the stylesheet's contents are irrelevant here.
vi.mock("@/registry/base/ui/staggered-entrance.css", () => ({}));

import { StaggeredEntrance } from "@/registry/base/ui/staggered-entrance";

afterEach(cleanup);

describe("StaggeredEntrance", () => {
  it("renders all items with distinct fallback keys and no console.error", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <StaggeredEntrance
        items={["a", "b", "c"]}
        renderItem={(item) => <span>{item}</span>}
      />
    );

    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText("b")).toBeTruthy();
    expect(screen.getByText("c")).toBeTruthy();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("renders all items with a function getItemKey and no console.error", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <StaggeredEntrance
        items={["a", "b", "c"]}
        renderItem={(item) => <span>{item}</span>}
        getItemKey={(item) => String(item)}
      />
    );

    expect(screen.getByText("a")).toBeTruthy();
    expect(screen.getByText("b")).toBeTruthy();
    expect(screen.getByText("c")).toBeTruthy();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
