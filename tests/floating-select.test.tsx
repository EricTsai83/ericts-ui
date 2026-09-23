// @vitest-environment jsdom
import {
  act,
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

  it("ignores Escape when focus is outside the select", () => {
    const onOpenChange = vi.fn();

    render(
      <FloatingSelect
        placement="inline"
        label="Mode"
        options={options}
        defaultOpen
        onOpenChange={onOpenChange}
      />,
    );

    // Focus drops to the body (e.g. a click on non-focusable page content),
    // which leaves the panel open but means the Escape is not the select's.
    act(() => {
      (document.activeElement as HTMLElement).blur();
    });
    expect(document.activeElement).toBe(document.body);

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    document.body.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox", { name: "Mode" })).toBeTruthy();
  });

  it("claims Escape pressed inside it so a surrounding layer stays open", () => {
    const outerEscape = vi.fn();

    document.addEventListener("keydown", outerEscape);

    try {
      render(
        <FloatingSelect
          placement="inline"
          label="Mode"
          options={options}
          defaultOpen
        />,
      );

      const option = screen.getByRole("option", { name: "Command" });
      expect(document.activeElement).toBe(option);

      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      act(() => {
        option.dispatchEvent(event);
      });

      expect(event.defaultPrevented).toBe(true);
      expect(outerEscape).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener("keydown", outerEscape);
    }
  });

  it("leaves an Escape another handler already claimed", () => {
    const onOpenChange = vi.fn();

    render(
      <FloatingSelect
        placement="inline"
        label="Mode"
        options={options}
        defaultOpen
        onOpenChange={onOpenChange}
      />,
    );

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    screen.getByRole("option", { name: "Command" }).dispatchEvent(event);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("keeps a single option in the tab order and moves it with the arrows", () => {
    render(
      <FloatingSelect
        placement="inline"
        label="Mode"
        options={[...options, { value: "review", label: "Review" }]}
        defaultValue="design"
        defaultOpen
      />,
    );

    const tabIndexes = () =>
      screen.getAllByRole("option").map((option) => option.tabIndex);

    expect(tabIndexes()).toEqual([-1, 0, -1]);
    expect(document.activeElement).toBe(
      screen.getByRole("option", { name: "Design" }),
    );

    const listbox = screen.getByRole("listbox", { name: "Mode" });

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(document.activeElement).toBe(
      screen.getByRole("option", { name: "Review" }),
    );
    expect(tabIndexes()).toEqual([-1, -1, 0]);

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(document.activeElement).toBe(
      screen.getByRole("option", { name: "Command" }),
    );
    expect(tabIndexes()).toEqual([0, -1, -1]);

    fireEvent.keyDown(listbox, { key: "End" });
    fireEvent.keyDown(listbox, { key: "ArrowUp" });
    expect(document.activeElement).toBe(
      screen.getByRole("option", { name: "Design" }),
    );
    expect(tabIndexes()).toEqual([-1, 0, -1]);
  });

  it("closes when focus moves outside the select", () => {
    const onOpenChange = vi.fn();

    render(
      <>
        <FloatingSelect
          placement="inline"
          label="Mode"
          options={options}
          defaultOpen
          onOpenChange={onOpenChange}
        />
        <button type="button">Next field</button>
      </>,
    );

    fireEvent.blur(screen.getByRole("option", { name: "Command" }), {
      relatedTarget: screen.getByRole("button", { name: "Next field" }),
    });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("stays open when focus moves between options or to nowhere", () => {
    const onOpenChange = vi.fn();

    render(
      <FloatingSelect
        placement="inline"
        label="Mode"
        options={options}
        defaultOpen
        onOpenChange={onOpenChange}
      />,
    );

    const command = screen.getByRole("option", { name: "Command" });

    fireEvent.blur(command, {
      relatedTarget: screen.getByRole("option", { name: "Design" }),
    });
    // A press on the panel's padding, or the window losing focus.
    fireEvent.blur(command, { relatedTarget: null });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox", { name: "Mode" })).toBeTruthy();
  });

  it("selects the pressed option before any focus-driven close", () => {
    const onValueChange = vi.fn();

    render(
      <FloatingSelect
        placement="inline"
        label="Mode"
        options={options}
        defaultOpen
        onValueChange={onValueChange}
      />,
    );

    const design = screen.getByRole("option", { name: "Design" });

    fireEvent.pointerDown(design);
    fireEvent.blur(screen.getByRole("option", { name: "Command" }), {
      relatedTarget: design,
    });
    fireEvent.click(design);

    expect(onValueChange).toHaveBeenCalledWith("design", options[1]);
  });
});
