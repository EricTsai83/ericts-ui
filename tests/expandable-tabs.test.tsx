// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ExpandableTabs,
  type ExpandableTabItem,
} from "@/registry/base/ui/expandable-tabs";

class ResizeObserverMock implements ResizeObserver {
  static instances: ResizeObserverMock[] = [];

  readonly observe = vi.fn<(target: Element) => void>();
  readonly unobserve = vi.fn<(target: Element) => void>();
  readonly disconnect = vi.fn<() => void>();

  constructor() {
    ResizeObserverMock.instances.push(this);
  }

  takeRecords() {
    return [];
  }
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
  ResizeObserverMock.instances = [];
  globalThis.ResizeObserver = ResizeObserverMock;
});

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalResizeObserver;
  vi.restoreAllMocks();
});

const items: ExpandableTabItem[] = [
  {
    id: "create",
    label: "Create",
    icon: <span aria-hidden="true">+</span>,
    items: [
      { id: "file", label: "New file" },
      { id: "folder", label: "New folder" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <span aria-hidden="true">S</span>,
    content: <div>Settings panel</div>,
  },
];

describe("ExpandableTabs", () => {
  it("shares measurement observers without changing panel interaction", () => {
    render(<ExpandableTabs items={items} aria-label="Quick actions" />);

    expect(ResizeObserverMock.instances).toHaveLength(2);
    expect(
      ResizeObserverMock.instances.reduce(
        (count, observer) => count + observer.observe.mock.calls.length,
        0,
      ),
    ).toBe(6);

    const createTab = screen.getByRole("button", { name: "Create" });

    expect(createTab.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(createTab);

    expect(createTab.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("menu", { name: "Create" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "New file" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "New folder" })).toBeTruthy();
  });
});
