// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FloatingSelect } from "@/registry/base/ui/floating-select";

const options = [
  { value: "command", label: "Command" },
  { value: "design", label: "Design" },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("FloatingSelect", () => {
  it("only subscribes to Escape while open and preserves close behavior", async () => {
    const addEventListener = vi.spyOn(window, "addEventListener");
    const removeEventListener = vi.spyOn(window, "removeEventListener");

    render(
      <FloatingSelect
        placement="inline"
        label="Mode"
        options={options}
      />,
    );

    expect(
      addEventListener.mock.calls.filter(([type]) => type === "keydown"),
    ).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "ModeCommand" }));

    expect(
      addEventListener.mock.calls.filter(([type]) => type === "keydown"),
    ).toHaveLength(1);
    expect(screen.getByRole("listbox", { name: "Mode" })).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(
        removeEventListener.mock.calls.filter(([type]) => type === "keydown"),
      ).toHaveLength(1);
    });

    expect(screen.getByRole("button", { name: "ModeCommand" })).toBeTruthy();
  });
});
