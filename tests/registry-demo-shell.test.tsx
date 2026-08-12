// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

vi.mock("fumadocs-ui/provider/base", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/components/registry-preview", () => ({
  PreviewCornerSlotProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  RegistryPreview: () => null,
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
  router.prefetch.mockClear();
  router.replace.mockClear();
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
    view.unmount();
    render(
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

    fireEvent(
      switcher,
      createPointerEvent("pointerdown", {
        pointerId: 1,
        pointerType: "touch",
        clientX: 180,
        clientY: 24,
      }),
    );
    fireEvent(
      switcher,
      createPointerEvent("pointermove", {
        pointerId: 1,
        pointerType: "touch",
        clientX: 96,
        clientY: 26,
      }),
    );
    fireEvent(
      switcher,
      createPointerEvent("pointerup", {
        pointerId: 1,
        pointerType: "touch",
        clientX: 96,
        clientY: 26,
      }),
    );

    expect(router.replace).toHaveBeenCalledWith(next.viewHref, {
      scroll: false,
    });
  });
});

function renderDemo() {
  return render(createDemoElement(item, navigation));
}

function createDemoElement(
  currentItem: RegistryDisplayItem,
  currentNavigation: RegistryDemoNavigation,
) {
  return (
    <RegistryDemoShell
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
    installKind: "component",
    tags: [],
    effects: [],
  };
}

function createPointerEvent(
  type: string,
  properties: {
    pointerId: number;
    pointerType: string;
    clientX: number;
    clientY: number;
  },
) {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    pointerId: { value: properties.pointerId },
    pointerType: { value: properties.pointerType },
    clientX: { value: properties.clientX },
    clientY: { value: properties.clientY },
  });

  return event;
}
