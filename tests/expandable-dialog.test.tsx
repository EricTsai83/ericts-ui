// @vitest-environment jsdom
import { act } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ExpandableDialog,
  type ExpandableDialogItem,
} from "@/registry/base/ui/expandable-dialog";

const items: ExpandableDialogItem[] = [
  {
    id: "alpha",
    title: "Alpha",
    description: "First item",
    content: (
      <select aria-label="Nested select">
        <option>One</option>
      </select>
    ),
    image: "/alpha.png",
  },
];

afterEach(cleanup);

function getList(container: HTMLElement) {
  const list = container.querySelector(
    '[data-slot="expandable-dialog-list"]',
  );
  if (!list) throw new Error("list not found");
  return list;
}

describe("ExpandableDialog", () => {
  it("makes the list inert while open and returns focus to the trigger on close", () => {
    const onValueChange = vi.fn();
    const { container, rerender } = render(
      <ExpandableDialog
        items={items}
        value={null}
        onValueChange={onValueChange}
      />,
    );
    const list = getList(container);
    const trigger = screen.getByRole("button", { name: "Open Alpha" });

    trigger.focus();
    rerender(
      <ExpandableDialog
        items={items}
        value="alpha"
        onValueChange={onValueChange}
      />,
    );

    expect(list.hasAttribute("inert")).toBe(true);
    // inert already hides the subtree; aria-hidden over focusable buttons is
    // exactly the axe violation this replaces.
    expect(list.hasAttribute("aria-hidden")).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole("dialog"));

    rerender(
      <ExpandableDialog
        items={items}
        value={null}
        onValueChange={onValueChange}
      />,
    );

    expect(list.hasAttribute("inert")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on Escape and marks the event handled", () => {
    const onValueChange = vi.fn();

    render(
      <ExpandableDialog
        items={items}
        defaultValue="alpha"
        onValueChange={onValueChange}
      />,
    );

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      screen.getByRole("dialog").dispatchEvent(event);
    });

    expect(event.defaultPrevented).toBe(true);
    expect(onValueChange).toHaveBeenCalledWith(null, null);
  });

  it("ignores an Escape a nested overlay already handled", () => {
    const onValueChange = vi.fn();

    render(
      <ExpandableDialog
        items={items}
        defaultValue="alpha"
        onValueChange={onValueChange}
      />,
    );

    const select = screen.getByRole("combobox", { name: "Nested select" });
    select.addEventListener("keydown", (event) => event.preventDefault());

    fireEvent.keyDown(select, { key: "Escape" });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
