// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRef, type ComponentProps } from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArcMenu, ArcMenuAction } from "@/registry/base/ui/arc-menu";

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      matches: false,
      media,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderMenu(
  props: Partial<ComponentProps<typeof ArcMenu>> = {},
) {
  return render(
    <ArcMenu triggerLabel="Open shortcuts" {...props}>
      <ArcMenuAction label="Document" icon={<span />} />
      <ArcMenuAction label="Image" icon={<span />} />
      <ArcMenuAction label="Folder" icon={<span />} />
    </ArcMenu>,
  );
}

describe("ArcMenu", () => {
  it("starts every action transition together", () => {
    const source = readFileSync(
      path.join(process.cwd(), "registry/base/ui/arc-menu.tsx"),
      "utf8",
    );

    expect(source).not.toContain("ITEM_STAGGER");
    expect(source).not.toContain("staggerIndex");
    const actionStart = source.indexOf('data-slot="arc-menu-action-slot"');
    const actionEnd = source.indexOf("</motion.li>", actionStart);
    const actionMotion = source.slice(actionStart, actionEnd);

    expect(actionMotion).not.toContain("delay:");
  });

  it("opens from the shortcut trigger and retracts from the close trigger", () => {
    renderMenu();

    const openTrigger = screen.getByRole("button", {
      name: "Open shortcuts",
    });
    const menu = screen.getByRole("menu", { hidden: true });

    expect(openTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(menu.getAttribute("aria-hidden")).toBe("true");

    fireEvent.click(openTrigger);

    const closeTrigger = screen.getByRole("button", {
      name: "Close and retract shortcuts",
    });

    expect(closeTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(menu.getAttribute("aria-hidden")).toBe("false");

    fireEvent.click(closeTrigger);

    expect(
      screen
        .getByRole("button", { name: "Open shortcuts" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("shrinks only the visual surface and uses a plain X close icon", () => {
    const { container } = renderMenu({
      defaultOpen: true,
      triggerSize: 50,
      openTriggerSize: 30,
    });
    const trigger = screen.getByRole("button", {
      name: "Close and retract shortcuts",
    });
    const surface = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-trigger-surface']",
    );
    const closeIcon = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-close-icon']",
    );
    const triggerIcon = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-trigger-icon']",
    );

    expect(trigger.style.width).toBe("50px");
    expect(trigger.style.height).toBe("50px");
    expect(surface?.style.transform).toBe("scale(0.6)");
    expect(closeIcon?.querySelectorAll("path")).toHaveLength(1);
    expect(triggerIcon?.style.width).toBe("20px");
    expect(closeIcon?.style.width).toBe("28px");
  });

  it("matches the floating shortcut trigger and supports a custom caption", async () => {
    const { container } = render(
      <ArcMenu triggerCaption="Create">
        <ArcMenuAction label="Document" icon={<span />} />
      </ArcMenu>,
    );
    const trigger = screen.getByRole("button", { name: "Create" });
    const surface = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-trigger-surface']",
    );
    const triggerIcon = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-trigger-icon']",
    );
    const caption = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-caption']",
    );

    expect(trigger.style.width).toBe("56px");
    expect(trigger.style.height).toBe("56px");
    expect(triggerIcon?.style.width).toBe("20px");
    expect(caption?.textContent).toBe("Create");

    fireEvent.click(trigger);

    const closeIcon = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-close-icon']",
    );

    await waitFor(() => {
      expect(surface?.style.transform).toBe(
        "scale(0.7142857142857143)",
      );
    });
    expect(closeIcon?.style.width).toBe("28px");
  });

  it("can hide the caption without removing its accessible label", () => {
    const { container } = render(
      <ArcMenu triggerCaption="Create" showTriggerCaption={false}>
        <ArcMenuAction label="Document" icon={<span />} />
      </ArcMenu>,
    );

    expect(screen.getByRole("button", { name: "Create" })).toBeTruthy();
    const trigger = screen.getByRole("button", { name: "Create" });
    const surface = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-trigger-surface']",
    );

    expect(trigger.style.width).toBe("56px");
    expect(trigger.style.height).toBe("56px");
    expect(surface?.style.transform).toBe("scale(0.8571428571428571)");
    expect(
      container.querySelector("[data-slot='arc-menu-caption']"),
    ).toBeNull();
  });

  it("supports custom icon geometry without shrinking its hit areas", () => {
    const { container } = renderMenu({
      triggerIconSize: 24,
      closeIconSize: 30,
      actionIconSize: 20,
    });
    const trigger = screen.getByRole("button", { name: "Open shortcuts" });
    const triggerIcon = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-trigger-icon']",
    );
    const closeIcon = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-close-icon']",
    );
    const actionIcon = container.querySelector<HTMLElement>(
      "[data-slot='arc-menu-action-icon']",
    );

    expect(trigger.style.width).toBe("56px");
    expect(triggerIcon?.style.width).toBe("24px");
    expect(closeIcon?.style.width).toBe("30px");
    expect(actionIcon?.style.width).toBe("20px");
  });

  it("keeps action geometry authoritative over inline style overrides", () => {
    render(
      <ArcMenu defaultOpen actionSize={44}>
        <ArcMenuAction
          label="Document"
          icon={<span />}
          style={{ width: 80, height: 80, opacity: 0.8 }}
        />
      </ArcMenu>,
    );
    const action = screen.getByRole("menuitem", { name: "Document" });

    expect(action.style.width).toBe("44px");
    expect(action.style.height).toBe("44px");
    expect(action.style.opacity).toBe("0.8");
  });

  it("labels the menu and focuses its first item after keyboard activation", () => {
    renderMenu({ menuLabel: "Creation tools" });
    const trigger = screen.getByRole("button", { name: "Open shortcuts" });

    fireEvent.click(trigger, { detail: 0 });

    const items = screen.getAllByRole("menuitem");
    expect(screen.getByRole("menu", { name: "Creation tools" })).toBeTruthy();
    expect(document.activeElement).toBe(items[0]);
    expect(items.every((item) => item.tabIndex === -1)).toBe(true);
  });

  it("runs an action and closes by default", () => {
    const onAction = vi.fn();

    render(
      <ArcMenu defaultOpen triggerLabel="Open shortcuts">
        <ArcMenuAction
          label="Document"
          icon={<span />}
          onClick={onAction}
        />
      </ArcMenu>,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Document" }));

    expect(onAction).toHaveBeenCalledOnce();
    expect(
      screen
        .getByRole("button", { name: "Open shortcuts" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("does not latch when controlled", () => {
    const onOpenChange = vi.fn();

    renderMenu({ open: false, onOpenChange });

    const trigger = screen.getByRole("button", { name: "Open shortcuts" });
    fireEvent.click(trigger);

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("supports arrow navigation and Escape", () => {
    renderMenu();

    const trigger = screen.getByRole("button", { name: "Open shortcuts" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const items = screen.getAllByRole("menuitem");
    expect(document.activeElement).toBe(items[0]);

    fireEvent.keyDown(items[0], { key: "ArrowRight" });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(items[1], { key: "f" });
    expect(document.activeElement).toBe(items[2]);

    fireEvent.keyDown(items[2], { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes and moves focus beyond the trigger when tabbing", () => {
    render(
      <>
        <button type="button">Before</button>
        <ArcMenu defaultOpen>
          <ArcMenuAction label="Document" icon={<span />} />
        </ArcMenu>
        <button type="button">After</button>
      </>,
    );
    const action = screen.getByRole("menuitem", { name: "Document" });
    action.focus();

    fireEvent.keyDown(action, { key: "Tab" });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "After" }),
    );
    expect(
      screen.getByRole("button", { name: "Quick" }).getAttribute(
        "aria-expanded",
      ),
    ).toBe("false");
  });

  it("dismisses on outside interaction and forwards the root ref", () => {
    const ref = createRef<HTMLDivElement>();

    renderMenu({ defaultOpen: true, ref });

    expect(ref.current?.dataset.slot).toBe("arc-menu");

    fireEvent.pointerDown(document.body);

    expect(
      screen
        .getByRole("button", { name: "Open shortcuts" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });
});
