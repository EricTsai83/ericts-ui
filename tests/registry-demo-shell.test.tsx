// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FullscreenSessionProvider } from "@/components/fullscreen-session";
import {
  RegistryDemoShell,
  type RegistryDemoNavigation,
} from "@/components/registry-demo-shell";
import type { RegistryDisplayItem } from "@/lib/registry-display";

const router = vi.hoisted(() => ({
  prefetch: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

vi.mock("@/components/registry-demo-shell.module.css", () => ({
  default: new Proxy(
    {},
    {
      get: (_target, property) => String(property),
    },
  ),
}));

vi.mock("fumadocs-ui/provider/base", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/components/registry-preview", () => ({
  PreviewCornerSlotProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  RegistryPreview: () => (
    <div data-testid="preview-content">
      <div
        role="slider"
        aria-label="Demo slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
      />
    </div>
  ),
}));

const item = createDisplayItem("current", "Current Preview");
const previous = createDisplayItem("previous", "Previous Preview");
const next = createDisplayItem("next", "Next Preview");
const afterNext = createDisplayItem("after-next", "After Next Preview");
const navigation: RegistryDemoNavigation = { previous, next };

afterEach(() => {
  fireEvent.blur(window);
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  router.prefetch.mockClear();
  router.replace.mockClear();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("RegistryDemoShell preview navigation", () => {
  it("exposes previous and next links with their keyboard shortcuts", () => {
    renderDemo();

    const previousLink = screen.getByRole("link", {
      name: "Previous preview: Previous Preview",
    });
    const nextLink = screen.getByRole("link", {
      name: "Next preview: Next Preview",
    });
    expect(previousLink.getAttribute("href")).toBe(previous.viewHref);
    expect(previousLink.getAttribute("aria-keyshortcuts")).toBe("ArrowLeft");
    expect(nextLink.getAttribute("href")).toBe(next.viewHref);
    expect(nextLink.getAttribute("aria-keyshortcuts")).toBe("ArrowRight");
  });

  it("keeps the visible controls aligned with the global arrow shortcuts", () => {
    renderDemo();

    const previousLink = screen.getByRole("link", {
      name: "Previous preview: Previous Preview",
    });
    const nextLink = screen.getByRole("link", {
      name: "Next preview: Next Preview",
    });
    const previousIcon = previousLink.querySelector("svg");
    const nextIcon = nextLink.querySelector("svg");

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(router.replace).toHaveBeenCalledWith(previous.viewHref, {
      scroll: false,
    });
    expect(previousLink.getAttribute("data-active")).toBe("true");
    expect(nextLink.hasAttribute("data-active")).toBe(false);
    expect(previousIcon?.classList.contains("-translate-x-px")).toBe(true);
    expect(previousIcon?.classList.contains("duration-0")).toBe(true);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(router.replace).toHaveBeenLastCalledWith(next.viewHref, {
      scroll: false,
    });
    expect(previousLink.hasAttribute("data-active")).toBe(false);
    expect(nextLink.getAttribute("data-active")).toBe("true");
    expect(previousIcon?.classList.contains("-translate-x-px")).toBe(false);
    expect(nextIcon?.classList.contains("translate-x-px")).toBe(true);
  });

  it("ties keyboard feedback to key release and ignores key repeat", () => {
    renderDemo();

    const nextLink = screen.getByRole("link", {
      name: "Next preview: Next Preview",
    });
    const nextIcon = nextLink.querySelector("svg");

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(nextLink.getAttribute("data-active")).toBe("true");
    expect(router.replace).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "ArrowRight", repeat: true });
    expect(nextLink.getAttribute("data-active")).toBe("true");
    expect(router.replace).toHaveBeenCalledTimes(1);

    fireEvent.keyUp(window, { key: "ArrowRight" });
    expect(nextLink.hasAttribute("data-active")).toBe(false);
    expect(nextIcon?.classList.contains("translate-x-px")).toBe(false);
    expect(nextIcon?.classList.contains("duration-[130ms]")).toBe(true);
  });

  it("keeps the pressed state through a preview route remount until keyup", () => {
    const view = renderDemo();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    view.rerender(
      createDemoElement(next, {
        previous: item,
        next: afterNext,
      }),
    );

    const nextLink = screen.getByRole("link", {
      name: "Next preview: After Next Preview",
    });
    expect(nextLink.getAttribute("data-active")).toBe("true");

    fireEvent.keyUp(window, { key: "ArrowRight" });
    expect(nextLink.hasAttribute("data-active")).toBe(false);
  });

  it("keeps the navigation map in the independent top-right menu", () => {
    renderDemo();

    const menuTrigger = screen.getByRole("button", {
      name: "Open navigation map",
    });

    expect(menuTrigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(menuTrigger);
    expect(menuTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Current Preview" })).toBeTruthy();
    fireEvent.click(menuTrigger);
    expect(menuTrigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps the navigation map open while browsing inside fullscreen", () => {
    const view = renderDemo();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation map" }));
    swipe(screen.getByRole("navigation", { name: "Preview navigation" }), {
      from: [180, 24],
      to: [96, 26],
    });

    // Landing on the next preview remounts the shell inside the same session.
    view.rerender(createDemoElement(next, { previous: item, next: afterNext }));

    expect(
      screen
        .getByRole("button", { name: "Collapse navigation map" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("collapses the navigation map on the next entry into fullscreen", () => {
    const view = renderDemo();

    fireEvent.click(screen.getByRole("button", { name: "Open navigation map" }));

    view.unmount();
    renderDemo();

    expect(
      screen
        .getByRole("button", { name: "Open navigation map" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("shows the current preview title as a non-interactive dock label", () => {
    renderDemo();

    const title = within(
      screen.getByRole("navigation", { name: "Preview navigation" }),
    ).getByText("Current Preview");

    expect(title.closest("a, button")).toBeNull();
  });

  it("switches to the next preview when the mobile dock is swiped left", () => {
    renderDemo();

    const switcher = screen.getByRole("navigation", {
      name: "Preview navigation",
    });

    swipe(switcher, { from: [180, 24], to: [96, 26] });

    expect(router.replace).toHaveBeenCalledWith(next.viewHref, {
      scroll: false,
    });
  });

  it("switches previews when the fullscreen canvas is swiped horizontally", () => {
    renderDemo();

    const canvas = screen.getByRole("region", {
      name: "Fullscreen preview canvas",
    });

    swipe(canvas, { from: [180, 120], to: [96, 122] });
    expect(router.replace).toHaveBeenLastCalledWith(next.viewHref, {
      scroll: false,
    });

    router.replace.mockClear();
    swipe(canvas, { from: [96, 120], to: [180, 118] });
    expect(router.replace).toHaveBeenLastCalledWith(previous.viewHref, {
      scroll: false,
    });
  });

  it("shows a swipe hint on coarse mobile viewports", () => {
    vi.useFakeTimers();
    stubCoarseMobileViewport();
    renderDemo();

    expect(screen.queryByText("Swipe to browse")).toBeNull();

    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByText("Swipe to browse")).toBeTruthy();

    fireEvent.touchStart(
      screen.getByRole("region", { name: "Fullscreen preview canvas" }),
    );
    expect(getSwipeHint()?.classList.contains("opacity-0")).toBe(true);

    act(() => vi.advanceTimersByTime(150));
    expect(getSwipeHint()).toBeNull();
  });

  it("leaves the swipe hint up long enough to be read, then fades it out", () => {
    vi.useFakeTimers();
    stubCoarseMobileViewport();
    renderDemo();

    act(() => vi.advanceTimersByTime(600));
    act(() => vi.advanceTimersByTime(4499));
    expect(getSwipeHint()?.classList.contains("opacity-100")).toBe(true);

    // The hint stays mounted at zero opacity for the length of its fade-out.
    act(() => vi.advanceTimersByTime(1));
    expect(getSwipeHint()?.classList.contains("opacity-0")).toBe(true);

    act(() => vi.advanceTimersByTime(150));
    expect(getSwipeHint()).toBeNull();
  });

  it("shows the swipe hint again on the next entry into fullscreen", () => {
    vi.useFakeTimers();
    stubCoarseMobileViewport();
    const view = renderDemo();

    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByText("Swipe to browse")).toBeTruthy();

    view.unmount();
    renderDemo();

    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByText("Swipe to browse")).toBeTruthy();
  });

  it("keeps the swipe hint quiet while browsing inside fullscreen", () => {
    vi.useFakeTimers();
    stubCoarseMobileViewport();
    const view = renderDemo();

    act(() => vi.advanceTimersByTime(600));
    expect(screen.getByText("Swipe to browse")).toBeTruthy();

    swipe(screen.getByRole("region", { name: "Fullscreen preview canvas" }), {
      from: [180, 120],
      to: [96, 122],
    });
    expect(router.replace).toHaveBeenCalledWith(next.viewHref, {
      scroll: false,
    });

    // Landing on the next preview remounts the shell inside the same session.
    view.rerender(createDemoElement(next, { previous: item, next: afterNext }));

    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByText("Swipe to browse")).toBeNull();
  });

  it("tracks a fullscreen swipe further and navigates immediately on release", () => {
    renderDemo();
    const canvas = screen.getByRole("region", {
      name: "Fullscreen preview canvas",
    });
    const start = createTouch(1, 180, 120);
    const end = createTouch(1, 96, 122);

    fireEvent(
      canvas,
      createTouchEvent("touchstart", {
        touches: [start],
        changedTouches: [start],
      }),
    );
    fireEvent(
      canvas,
      createTouchEvent("touchmove", {
        touches: [end],
        changedTouches: [end],
      }),
    );
    expect(canvas.style.transform).toBe("translate3d(-42px, 0, 0)");
    expect(router.replace).not.toHaveBeenCalled();

    fireEvent(
      canvas,
      createTouchEvent("touchend", {
        touches: [],
        changedTouches: [end],
      }),
    );
    expect(canvas.style.transform).toBe("");
    expect(router.replace).toHaveBeenCalledWith(next.viewHref, {
      scroll: false,
    });
  });

  it.each([
    {
      direction: "next",
      from: [180, 120] as [number, number],
      to: [96, 122] as [number, number],
      target: next,
      targetNavigation: { previous: item, next: afterNext },
      transformClass: "[transform:translate3d(12px,0,0)]",
    },
    {
      direction: "previous",
      from: [96, 120] as [number, number],
      to: [180, 118] as [number, number],
      target: previous,
      targetNavigation: { next: item },
      transformClass: "[transform:translate3d(-12px,0,0)]",
    },
  ])(
    "enters the $direction preview subtly from its spatial direction",
    ({ direction, from, to, target, targetNavigation, transformClass }) => {
      vi.useFakeTimers();
      const view = renderDemo();

      swipe(
        screen.getByRole("region", { name: "Fullscreen preview canvas" }),
        { from, to },
      );
      expect(router.replace).toHaveBeenCalledWith(target.viewHref, {
        scroll: false,
      });

      view.rerender(createDemoElement(target, targetNavigation));
      const previewStage = document.querySelector<HTMLElement>(
        `[data-swipe-entrance='${direction}']`,
      );

      expect(previewStage).toBeTruthy();
      expect(previewStage?.classList.contains(transformClass)).toBe(true);

      act(() => vi.advanceTimersByTime(20));
      expect(previewStage?.hasAttribute("data-swipe-entrance")).toBe(false);
      expect(
        previewStage?.classList.contains(
          "[transform:translate3d(0,0,0)]",
        ),
      ).toBe(true);
    },
  );

  it("does not treat vertical movement as preview navigation", () => {
    renderDemo();

    const canvas = screen.getByRole("region", {
      name: "Fullscreen preview canvas",
    });

    swipe(canvas, { from: [120, 80], to: [124, 180] });
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("keeps swipe navigation without motion feedback for reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    renderDemo();

    const canvas = screen.getByRole("region", {
      name: "Fullscreen preview canvas",
    });
    const start = createTouch(1, 180, 120);
    const end = createTouch(1, 96, 122);

    fireEvent(
      canvas,
      createTouchEvent("touchstart", {
        touches: [start],
        changedTouches: [start],
      }),
    );
    fireEvent(
      canvas,
      createTouchEvent("touchmove", {
        touches: [end],
        changedTouches: [end],
      }),
    );
    expect(canvas.style.transform).toBe("");

    fireEvent(
      canvas,
      createTouchEvent("touchend", {
        touches: [],
        changedTouches: [end],
      }),
    );
    expect(router.replace).toHaveBeenCalledWith(next.viewHref, {
      scroll: false,
    });
  });

  it("allows swiping from ordinary preview content", () => {
    renderDemo();

    swipe(screen.getByTestId("preview-content"), {
      from: [180, 120],
      to: [96, 122],
    });
    expect(router.replace).toHaveBeenCalledWith(next.viewHref, {
      scroll: false,
    });
  });

  it("leaves horizontal gestures owned by preview controls alone", () => {
    renderDemo();

    const slider = screen.getByRole("slider", { name: "Demo slider" });

    swipe(slider, { from: [180, 120], to: [96, 122] });
    expect(router.replace).not.toHaveBeenCalled();
  });
});

function renderDemo() {
  return render(createDemoElement(item, navigation));
}

const MOBILE_SWIPE_HINT_QUERY =
  "(max-width: 639px) and (hover: none) and (pointer: coarse)";

function getSwipeHint() {
  return screen.queryByText("Swipe to browse")?.parentElement ?? null;
}

function stubCoarseMobileViewport() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query === MOBILE_SWIPE_HINT_QUERY,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/**
 * Mirrors the route: the session provider stays mounted across previews while
 * the shell below it is replaced, so `key` remounts the shell on every move.
 */
function createDemoElement(
  currentItem: RegistryDisplayItem,
  currentNavigation: RegistryDemoNavigation,
) {
  return (
    <FullscreenSessionProvider>
      <RegistryDemoShell
        key={currentItem.name}
        item={currentItem}
        navigation={currentNavigation}
        navigationGroups={[
          {
            category: "animation",
            label: "Animation",
            items: [previous, item, next, afterNext],
          },
        ]}
        variant="motion"
      />
    </FullscreenSessionProvider>
  );
}

function createDisplayItem(
  name: string,
  title: string,
): RegistryDisplayItem {
  return {
    name,
    title,
    kind: "component",
    category: "animation",
    href: `/components/${name}`,
    viewHref: `/view/base/${name}`,
    registryUrl: `/r/${name}.json`,
    tags: [],
    effects: [],
  };
}

function swipe(
  element: Element,
  { from, to }: { from: [number, number]; to: [number, number] },
) {
  fireEvent(
    element,
    createTouchEvent("touchstart", {
      touches: [createTouch(1, from[0], from[1])],
      changedTouches: [createTouch(1, from[0], from[1])],
    }),
  );
  fireEvent(
    element,
    createTouchEvent("touchmove", {
      touches: [createTouch(1, to[0], to[1])],
      changedTouches: [createTouch(1, to[0], to[1])],
    }),
  );
  fireEvent(
    element,
    createTouchEvent("touchend", {
      touches: [],
      changedTouches: [createTouch(1, to[0], to[1])],
    }),
  );
}

function createTouch(identifier: number, clientX: number, clientY: number) {
  return { identifier, clientX, clientY };
}

function createTouchEvent(
  type: string,
  properties: {
    touches: Array<ReturnType<typeof createTouch>>;
    changedTouches: Array<ReturnType<typeof createTouch>>;
  },
) {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    touches: { value: createTouchList(properties.touches) },
    changedTouches: { value: createTouchList(properties.changedTouches) },
  });

  return event;
}

function createTouchList(touches: Array<ReturnType<typeof createTouch>>) {
  return {
    ...touches,
    length: touches.length,
    item: (index: number) => touches[index] ?? null,
  };
}
