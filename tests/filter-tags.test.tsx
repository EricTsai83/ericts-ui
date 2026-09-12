// @vitest-environment jsdom
import { createRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterTags } from "@/registry/base/ui/filter-tags";

const motionPreference = vi.hoisted(() => ({ reduce: false }));
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return { ...actual, useReducedMotion: () => motionPreference.reduce };
});

const items = [
  { value: "a", label: "Romance" },
  { value: "b", label: "Pop" },
  { value: "c", label: "Jazz" },
  { value: "d", label: "Unavailable", disabled: true },
];
const scrollTo = vi.fn();
const scrollBy = vi.fn();
const disconnect = vi.fn();
let resize: () => void;
const names = () => screen.getAllByRole("button").filter((node) =>
  node.hasAttribute("aria-pressed"),
).map((node) => node.textContent);
/** Pointer clicks carry a non-zero `detail`; jsdom defaults to 0, which reads as keyboard activation. */
const click = (node: Element) => fireEvent.click(node, { detail: 1 });
const tag = (name: string) => screen.getByRole("button", { name });
const viewport = () => screen.getByRole("group", { name: "Filters" }).parentElement!;

beforeEach(() => {
  motionPreference.reduce = false;
  vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockReturnValue(4);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(80);
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect = disconnect;
  });
  Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });
  Object.defineProperty(HTMLElement.prototype, "scrollBy", { configurable: true, value: scrollBy });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
  Reflect.deleteProperty(HTMLElement.prototype, "scrollBy");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function scrollPastSelection() {
  viewport().scrollLeft = 200;
}

describe("FilterTags", () => {
  it("keeps multiple selections in selection order and restores deselected source order", () => {
    render(<FilterTags items={items} />);
    scrollPastSelection();
    click(tag("Jazz"));
    click(tag("Pop"));
    expect(names()).toEqual(["Jazz", "Pop", "Romance", "Unavailable"]);
    expect(tag("Jazz").getAttribute("aria-pressed")).toBe("true");
    click(tag("Jazz"));
    expect(names()).toEqual(["Pop", "Romance", "Jazz", "Unavailable"]);
    expect(tag("Jazz").getAttribute("aria-pressed")).toBe("false");
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "smooth" });
    click(tag("Jazz"));
    expect(names()).toEqual(["Pop", "Jazz", "Romance", "Unavailable"]);
  });

  it("reports the toggled item alongside the next value", () => {
    const onValueChange = vi.fn();
    render(<FilterTags items={items} onValueChange={onValueChange} />);
    click(tag("Jazz"));
    expect(onValueChange).toHaveBeenCalledWith(["c"], items[2]);
  });

  it("waits for controlled acceptance before reordering or scrolling and allows clearing", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<FilterTags items={items} value={[]} onValueChange={onValueChange} />);
    scrollPastSelection();
    click(tag("Jazz"));
    expect(onValueChange).toHaveBeenCalledWith(["c"], items[2]);
    expect(names()[0]).toBe("Romance");
    expect(scrollTo).not.toHaveBeenCalled();
    rerender(<FilterTags items={items} value={["c"]} onValueChange={onValueChange} />);
    expect(names()[0]).toBe("Jazz");
    expect(scrollTo).toHaveBeenCalled();
    rerender(<FilterTags items={items} value={[]} onValueChange={onValueChange} />);
    expect(names()[0]).toBe("Romance");
    expect(tag("Jazz").getAttribute("aria-pressed")).toBe("false");
  });

  it("retains focus on a moved tag and uses immediate scrolling for keyboard activation", () => {
    render(<FilterTags items={items} />);
    scrollPastSelection();
    const jazz = tag("Jazz");
    jazz.focus();
    fireEvent.keyDown(jazz, { key: "Enter" });
    fireEvent.click(jazz, { detail: 0 });
    expect(document.activeElement).toBe(jazz);
    expect(names()[0]).toBe("Jazz");
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "instant" });
  });

  it("reveals selections immediately when reduced motion is requested", () => {
    motionPreference.reduce = true;
    render(<FilterTags items={items} />);
    scrollPastSelection();
    click(tag("Jazz"));
    expect(names()[0]).toBe("Jazz");
    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: "instant" });
  });

  it("leaves visible selections and deselections at the current scroll position", () => {
    render(<FilterTags items={items} defaultValue={["c"]} />);
    click(tag("Pop"));
    expect(names()).toEqual(["Jazz", "Pop", "Romance", "Unavailable"]);
    expect(scrollTo).not.toHaveBeenCalled();
    scrollPastSelection();
    click(tag("Jazz"));
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("raises a selected mover above the row and lowers a deselected one beneath it", () => {
    render(<FilterTags items={items} defaultValue={["b"]} />);
    click(tag("Jazz"));
    expect(tag("Jazz").parentElement?.className).toContain("z-20");
    expect(tag("Pop").parentElement?.className).toContain("z-10");
    click(tag("Pop"));
    expect(tag("Pop").parentElement?.className).toContain("-z-10");
    expect(tag("Jazz").parentElement?.className).toContain("z-10");
    expect(tag("Jazz").parentElement?.className).not.toContain("z-20");
  });

  it("leaves the raised layer alone when a toggle does not change the order", () => {
    render(<FilterTags items={items} defaultValue={["b"]} />);
    click(tag("Romance"));
    expect(names()).toEqual(["Pop", "Romance", "Jazz", "Unavailable"]);
    expect(tag("Romance").parentElement?.className).not.toContain("z-20");
    click(tag("Romance"));
    expect(tag("Romance").parentElement?.className).not.toContain("-z-10");
  });

  it("skips the raised layer when motion is reduced or activation is by keyboard", () => {
    motionPreference.reduce = true;
    render(<FilterTags items={items} />);
    click(tag("Jazz"));
    expect(tag("Jazz").parentElement?.className).not.toContain("z-20");
  });

  it("enables arrows from the scroll edges and pages by most of the viewport", () => {
    render(<FilterTags items={items} showArrows />);
    const backward = screen.getByRole("button", { name: "Scroll tags left" });
    const forward = screen.getByRole("button", { name: "Scroll tags right" });
    expect(backward.hasAttribute("disabled")).toBe(true);
    expect(forward.hasAttribute("disabled")).toBe(true);

    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(400);
    fireEvent.scroll(viewport());
    expect(backward.hasAttribute("disabled")).toBe(true);
    expect(forward.hasAttribute("disabled")).toBe(false);

    click(forward);
    expect(scrollBy).toHaveBeenLastCalledWith({ left: 80, behavior: "smooth" });

    viewport().scrollLeft = 300;
    fireEvent.scroll(viewport());
    expect(backward.hasAttribute("disabled")).toBe(false);
    expect(forward.hasAttribute("disabled")).toBe(true);

    fireEvent.click(backward, { detail: 0 });
    expect(scrollBy).toHaveBeenLastCalledWith({ left: -80, behavior: "instant" });
  });

  it("toggles scroll controls independently without losing selection", () => {
    const { container, rerender } = render(<FilterTags items={items} defaultValue={["c"]} />);
    const viewportNode = container.querySelector('[data-slot="filter-tags-viewport"]');
    expect(viewportNode?.getAttribute("data-scrollbar")).toBe("hidden");
    expect(container.querySelector('[data-slot="filter-tags-forward-control"]')?.className).toContain("pointer-fine:flex");
    rerender(<FilterTags items={items} showScrollbar showArrows={false} />);
    expect(viewportNode?.getAttribute("data-scrollbar")).toBe("visible");
    expect(screen.queryByRole("button", { name: "Scroll tags left" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Scroll tags right" })).toBeNull();
    expect(names()[0]).toBe("Jazz");
    rerender(
      <FilterTags
        items={items}
        showArrows
        arrows={{ backwardIcon: <span>Back</span>, forwardIcon: <span>Next</span>, variant: "outline", backwardLabel: "Previous" }}
        classNames={{ arrow: "custom-arrow", list: "custom-list", tag: "custom-tag" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous" }).textContent).toBe("Back");
    expect(screen.getByRole("button", { name: "Scroll tags right" }).className).toContain("custom-arrow");
    expect(container.querySelector('[data-slot="filter-tags-forward-control"]')?.className).not.toContain("pointer-fine:flex");
    expect(screen.getByRole("group").className).toContain("custom-list");
    expect(tag("Jazz").className).toContain("custom-tag");
  });

  it("labels the group from aria-labelledby when provided", () => {
    render(
      <>
        <h2 id="heading">Mood</h2>
        <FilterTags items={items} aria-labelledby="heading" />
      </>,
    );
    expect(screen.getByRole("group", { name: "Mood" }).hasAttribute("aria-label")).toBe(false);
  });

  it("sizes arrow alignment from the list when content height changes", () => {
    const { container } = render(<FilterTags items={items} showScrollbar showArrows />);
    const list = screen.getByRole("group");
    vi.spyOn(list, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, width: 400, height: 80, top: 0, left: 0, right: 400, bottom: 80, toJSON: () => ({}) });
    act(() => resize());
    const backward = container.querySelector<HTMLElement>('[data-slot="filter-tags-backward-control"]');
    const forward = container.querySelector<HTMLElement>('[data-slot="filter-tags-forward-control"]');
    expect(backward?.style.height).toBe("80px");
    expect(forward?.style.height).toBe("80px");
  });

  it("ignores disabled tags and missing values, handles changed items, and forwards its root ref", () => {
    const ref = createRef<HTMLDivElement>();
    const onValueChange = vi.fn();
    const { rerender, unmount } = render(<FilterTags ref={ref} items={items} defaultValue={["missing", "c", "c"]} onValueChange={onValueChange} />);
    expect(ref.current?.dataset.slot).toBe("filter-tags");
    expect(names()).toEqual(["Jazz", "Romance", "Pop", "Unavailable"]);
    click(tag("Unavailable"));
    expect(onValueChange).not.toHaveBeenCalled();
    rerender(<FilterTags items={items.slice(0, 2)} onValueChange={onValueChange} />);
    expect(names()).toEqual(["Romance", "Pop"]);
    click(tag("Pop"));
    expect(onValueChange).toHaveBeenCalledWith(["b"], items[1]);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
