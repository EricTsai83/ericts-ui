// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  FloatingShortcutAction,
  FloatingShortcutButton,
} from "@/registry/base/ui/floating-shortcut-button";

afterEach(cleanup);

function renderShortcutButton(
  props: Partial<React.ComponentProps<typeof FloatingShortcutButton>> = {},
) {
  return render(
    <FloatingShortcutButton triggerCaption="Quick" {...props}>
      <FloatingShortcutAction label="Search" icon={<span>S</span>} />
      <FloatingShortcutAction label="Save" icon={<span>B</span>} />
      <FloatingShortcutAction label="Share" icon={<span>H</span>} />
    </FloatingShortcutButton>,
  );
}

describe("FloatingShortcutButton", () => {
  it("supports a custom trigger caption", () => {
    const { container } = renderShortcutButton({
      triggerCaption: "Create",
    });
    const surface = container.querySelector<HTMLElement>(
      "[data-slot='floating-shortcut-trigger-surface']",
    );

    expect(screen.getByRole("button", { name: "Create" })).toBeTruthy();
    expect(
      container.querySelector("[data-slot='floating-shortcut-caption']")
        ?.textContent,
    ).toBe("Create");
    expect(surface?.style.transform).toBe("scale(1)");
  });

  it("can hide the caption without removing its accessible label", () => {
    const { container } = renderShortcutButton({
      triggerCaption: "Create",
      showTriggerCaption: false,
    });
    const trigger = screen.getByRole("button", { name: "Create" });
    const surface = container.querySelector<HTMLElement>(
      "[data-slot='floating-shortcut-trigger-surface']",
    );

    expect(trigger.style.width).toBe("56px");
    expect(trigger.style.height).toBe("56px");
    expect(surface?.style.transform).toBe("scale(0.8571428571428571)");
    expect(
      container.querySelector("[data-slot='floating-shortcut-caption']"),
    ).toBeNull();
  });

  it("toggles its menu in uncontrolled mode", () => {
    const onOpenChange = vi.fn();
    renderShortcutButton({ onOpenChange });

    const trigger = screen.getByRole("button", { name: "Quick" });
    const menu = screen.getByRole("menu", { hidden: true });

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(menu.getAttribute("aria-hidden")).toBe("true");

    fireEvent.click(trigger);

    expect(
      screen.getByRole("button", { name: "Close shortcuts" }).getAttribute(
        "aria-expanded",
      ),
    ).toBe("true");
    expect(menu.getAttribute("aria-hidden")).toBe("false");
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("preserves the staged icon swap and floating action treatment", () => {
    renderShortcutButton();

    const root = screen
      .getByRole("button", { name: "Quick" })
      .closest("[data-slot='floating-shortcut-button']") as HTMLElement;
    const triggerFace = root.querySelector(
      "[data-slot='floating-shortcut-trigger-face']",
    ) as HTMLElement;
    const closeFace = root.querySelector(
      "[data-slot='floating-shortcut-close-face']",
    ) as HTMLElement;
    const triggerIcon = root.querySelector(
      "[data-slot='floating-shortcut-trigger-icon']",
    ) as HTMLElement;
    const triggerSurface = root.querySelector(
      "[data-slot='floating-shortcut-trigger-surface']",
    ) as HTMLElement;
    const action = screen.getByRole("menuitem", { name: "Search", hidden: true });
    const actionIcon = action.querySelector(
      "[data-slot='floating-shortcut-action-icon']",
    ) as HTMLElement;
    const trigger = screen.getByRole("button", { name: "Quick" });

    expect(trigger.style.width).toBe("56px");
    expect(trigger.style.height).toBe("56px");
    expect(trigger.style.transform).toBe("");
    expect(triggerSurface.style.transitionDuration).toBe("170ms");
    expect(triggerSurface.style.transform).toBe("scale(1)");
    expect(triggerFace.style.transitionDuration).toBe("170ms");
    expect(triggerFace.style.transitionDelay).toBe("85ms");
    expect(triggerIcon.style.width).toBe("20px");
    expect(triggerIcon.style.height).toBe("20px");
    expect(triggerFace.className).toContain("opacity-100");
    expect(closeFace.className).toContain("opacity-0");
    expect(action.className).toContain("shadow-sm");
    expect(action.style.width).toBe("48px");
    expect(action.style.height).toBe("48px");
    expect(action.style.marginInlineEnd).toBe("4px");
    expect(actionIcon.style.width).toBe("20px");
    expect(action.className).toContain("bg-card");
    expect(action.className).toContain("border-border");
    expect(action.className).not.toContain("hover:-translate-y-px");
    expect(action.className).not.toContain("hover:shadow-lg");
    const closeIcon = closeFace.querySelector("svg");

    expect(closeIcon?.getAttribute("stroke")).toBe("currentColor");
    expect(closeIcon?.getAttribute("stroke-width")).toBe("2");
    expect(closeIcon?.getAttribute("stroke-linecap")).toBe("round");
    expect(closeIcon?.querySelector("path")?.getAttribute("d")).toBe(
      "m5.5 5.5 13 13m0-13-13 13",
    );

    fireEvent.click(screen.getByRole("button", { name: "Quick" }), {
      detail: 1,
    });

    expect(triggerFace.className).toContain("opacity-0");
    expect(triggerFace.style.transitionDelay).toBe("0ms");
    expect(closeFace.className).toContain("opacity-100");
    expect(closeFace.style.transitionDelay).toBe("85ms");
    expect(trigger.style.width).toBe("56px");
    expect(trigger.style.height).toBe("56px");
    expect(trigger.style.transform).toBe("");
    expect(triggerSurface.style.transform).toBe(
      "scale(0.7142857142857143)",
    );
  });

  it.each([
    ["sm", 48, 40, 40, 18, 24],
    ["md", 56, 48, 48, 20, 28],
    ["lg", 64, 56, 56, 24, 32],
  ] as const)(
    "keeps the %s size preset geometrically aligned",
    (
      size,
      triggerSize,
      actionSize,
      iconOnlyTriggerSize,
      triggerIconSize,
      closeIconSize,
    ) => {
      const { container } = renderShortcutButton({
        size,
        showTriggerCaption: false,
      });

      const trigger = screen.getByRole("button", { name: "Quick" });
      const root = trigger.closest(
        "[data-slot='floating-shortcut-button']",
      ) as HTMLElement;
      const action = screen.getByRole("menuitem", {
        name: "Search",
        hidden: true,
      });
      const triggerIcon = root.querySelector(
        "[data-slot='floating-shortcut-trigger-icon']",
      ) as HTMLElement;
      const closeFace = root.querySelector(
        "[data-slot='floating-shortcut-close-face']",
      ) as HTMLElement;
      const triggerSurface = container.querySelector<HTMLElement>(
        "[data-slot='floating-shortcut-trigger-surface']",
      );

      expect(trigger.style.width).toBe(`${triggerSize}px`);
      expect(action.style.width).toBe(`${actionSize}px`);
      expect(action.style.marginInlineEnd).toBe(
        `${(triggerSize - actionSize) / 2}px`,
      );
      expect(triggerIcon.style.width).toBe(`${triggerIconSize}px`);
      expect(closeFace.style.width).toBe(`${closeIconSize}px`);
      expect(triggerSurface?.style.transform).toBe(
        `scale(${iconOnlyTriggerSize / triggerSize})`,
      );
    },
  );

  it("derives alignment and open scale from custom metrics", () => {
    renderShortcutButton({
      metrics: {
        triggerSize: 60,
        iconOnlyTriggerSize: 50,
        openTriggerSize: 45,
        actionSize: 42,
        triggerIconSize: 19,
        closeIconSize: 26,
        actionIconSize: 17,
        stackGap: 5,
        triggerGap: 7,
        rowGap: 9,
        captionGap: 1,
      },
    });

    const trigger = screen.getByRole("button", { name: "Quick" });
    const root = trigger.closest(
      "[data-slot='floating-shortcut-button']",
    ) as HTMLElement;
    const menu = screen.getByRole("menu", { hidden: true });
    const action = screen.getByRole("menuitem", {
      name: "Search",
      hidden: true,
    });
    const actionRow = action.closest(
      "[data-slot='floating-shortcut-action-row']",
    ) as HTMLElement;
    const actionIcon = action.querySelector(
      "[data-slot='floating-shortcut-action-icon']",
    ) as HTMLElement;
    const triggerSurface = root.querySelector(
      "[data-slot='floating-shortcut-trigger-surface']",
    ) as HTMLElement;

    expect(root.style.gap).toBe("7px");
    expect(menu.style.gap).toBe("5px");
    expect(actionRow.style.gap).toBe("9px");
    expect(action.style.width).toBe("42px");
    expect(action.style.marginInlineEnd).toBe("9px");
    expect(actionIcon.style.width).toBe("17px");

    fireEvent.click(trigger);
    expect(trigger.style.width).toBe("60px");
    expect(trigger.style.height).toBe("60px");
    expect(trigger.style.transform).toBe("");
    expect(triggerSurface.style.transform).toBe("scale(0.75)");
  });

  it("preserves timing ratios when motion is customized", () => {
    renderShortcutButton({
      motion: { duration: 200, distance: 12, pressScale: 0.94 },
    });

    const trigger = screen.getByRole("button", { name: "Quick" });
    const root = trigger.closest(
      "[data-slot='floating-shortcut-button']",
    ) as HTMLElement;
    const triggerFace = root.querySelector(
      "[data-slot='floating-shortcut-trigger-face']",
    ) as HTMLElement;
    const triggerSurface = root.querySelector(
      "[data-slot='floating-shortcut-trigger-surface']",
    ) as HTMLElement;
    const action = screen.getByRole("menuitem", {
      name: "Search",
      hidden: true,
    });

    expect(triggerSurface.style.transitionDuration).toBe("200ms");
    expect(triggerFace.style.transitionDelay).toBe("100ms");
    expect(action.style.transitionDuration).toBe("152.94117647058823ms");
    expect(
      action.style.getPropertyValue("--floating-shortcut-press-scale"),
    ).toBe("0.94");
  });

  it("allows motion to be disabled explicitly", () => {
    const { container } = renderShortcutButton({
      motion: { duration: 0 },
    });
    const surface = container.querySelector<HTMLElement>(
      "[data-slot='floating-shortcut-trigger-surface']",
    );
    const action = screen.getByRole("menuitem", {
      name: "Search",
      hidden: true,
    });

    expect(surface?.style.transitionDuration).toBe("0ms");
    expect(action.style.transitionDuration).toBe("0ms");
  });

  it("labels the menu and focuses its first item after keyboard activation", () => {
    const { container } = renderShortcutButton({ menuLabel: "Creation tools" });
    const trigger = screen.getByRole("button", { name: "Quick" });
    const surface = container.querySelector<HTMLElement>(
      "[data-slot='floating-shortcut-trigger-surface']",
    );

    fireEvent.click(trigger, { detail: 0 });

    const items = screen.getAllByRole("menuitem");
    expect(screen.getByRole("menu", { name: "Creation tools" })).toBeTruthy();
    expect(document.activeElement).toBe(items[0]);
    expect(items.every((item) => item.tabIndex === -1)).toBe(true);
    expect(surface?.style.transitionDuration).toBe("0ms");
  });

  it("supports a custom close icon", () => {
    renderShortcutButton({
      defaultOpen: true,
      closeIcon: <span data-testid="custom-close">Close</span>,
    });

    expect(screen.getByTestId("custom-close")).toBeTruthy();
  });

  it("applies global slot classes and per-action overrides", () => {
    render(
      <FloatingShortcutButton
        triggerCaption="Quick"
        classNames={{
          root: "slot-root",
          menu: "slot-menu",
          triggerSlot: "slot-trigger-slot",
          trigger: "slot-trigger",
          triggerSurface: "slot-trigger-surface",
          triggerFace: "slot-trigger-face",
          triggerIcon: "slot-trigger-icon",
          caption: "slot-caption",
          closeFace: "slot-close-face",
          actionRow: "slot-action-row",
          actionButton: "slot-action-button",
          actionIcon: "slot-action-icon",
          actionLabel: "slot-action-label",
        }}
      >
        <FloatingShortcutAction
          label="Search"
          icon={<span>S</span>}
          rowClassName="local-row"
          className="local-button"
          iconClassName="local-icon"
          labelClassName="local-label"
        />
      </FloatingShortcutButton>,
    );

    const trigger = screen.getByRole("button", { name: "Quick" });
    const root = trigger.closest(
      "[data-slot='floating-shortcut-button']",
    ) as HTMLElement;
    const action = screen.getByRole("menuitem", {
      name: "Search",
      hidden: true,
    });

    expect(root.className).toContain("slot-root");
    expect(root.querySelector("[role='menu']")?.className).toContain(
      "slot-menu",
    );
    expect(
      root.querySelector("[data-slot='floating-shortcut-trigger-slot']")
        ?.className,
    ).toContain("slot-trigger-slot");
    expect(trigger.className).toContain("slot-trigger");
    expect(
      root.querySelector("[data-slot='floating-shortcut-trigger-surface']")
        ?.className,
    ).toContain("slot-trigger-surface");
    expect(action.className).toContain("slot-action-button");
    expect(action.className).toContain("local-button");
    expect(action.parentElement?.className).toContain("slot-action-row");
    expect(action.parentElement?.className).toContain("local-row");
    expect(
      action.querySelector("[data-slot='floating-shortcut-action-icon']")
        ?.className,
    ).toContain("local-icon");
    expect(action.previousElementSibling?.className).toContain("local-label");
  });

  it("can keep the menu open after an action", () => {
    renderShortcutButton({ defaultOpen: true, closeOnAction: false });

    fireEvent.click(screen.getByRole("menuitem", { name: "Search" }));

    expect(
      screen
        .getByRole("button", { name: "Close shortcuts" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("allows one action to override the root close behavior", () => {
    render(
      <FloatingShortcutButton defaultOpen closeOnAction={false}>
        <FloatingShortcutAction
          label="Search"
          icon={<span>S</span>}
          closeOnAction
        />
      </FloatingShortcutButton>,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Search" }));

    expect(
      screen
        .getByRole("button", { name: "Quick" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("fails clearly when an action is rendered outside its root", () => {
    expect(() =>
      render(<FloatingShortcutAction label="Search" icon={<span>S</span>} />),
    ).toThrow(
      "FloatingShortcutAction must be used inside FloatingShortcutButton.",
    );
  });

  it("lets trigger handlers cancel the state change", () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });
    renderShortcutButton({ triggerProps: { onClick } });

    const trigger = screen.getByRole("button", { name: "Quick" });
    fireEvent.click(trigger);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("uses a logical offset so actions stay centered in RTL", () => {
    render(
      <div dir="rtl">
        <FloatingShortcutButton triggerCaption="Quick">
          <FloatingShortcutAction label="Search" icon={<span>S</span>} />
        </FloatingShortcutButton>
      </div>,
    );

    const action = screen.getByRole("menuitem", {
      name: "Search",
      hidden: true,
    });
    expect(action.style.marginInlineEnd).toBe("4px");
    expect(action.style.marginRight).toBe("");
  });

  it("reports controlled changes without mutating the open state", () => {
    const onOpenChange = vi.fn();
    renderShortcutButton({ open: false, onOpenChange });

    const trigger = screen.getByRole("button", { name: "Quick" });
    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("runs an action and returns focus to the closed trigger", () => {
    const onSearch = vi.fn();

    render(
      <FloatingShortcutButton defaultOpen triggerCaption="Quick">
        <FloatingShortcutAction
          label="Search"
          icon={<span>S</span>}
          onClick={onSearch}
        />
      </FloatingShortcutButton>,
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "Search" }));

    const trigger = screen.getByRole("button", { name: "Quick" });
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("supports menu arrow keys and Escape", () => {
    renderShortcutButton({ defaultOpen: true });

    const items = screen.getAllByRole("menuitem");
    items[0].focus();

    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);

    fireEvent.keyDown(items[1], { key: "End" });
    expect(document.activeElement).toBe(items[2]);

    fireEvent.keyDown(items[2], { key: "Escape" });

    const trigger = screen.getByRole("button", { name: "Quick" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes and moves focus before the trigger with Shift+Tab", () => {
    render(
      <>
        <button type="button">Before</button>
        <FloatingShortcutButton defaultOpen>
          <FloatingShortcutAction label="Search" icon={<span>S</span>} />
        </FloatingShortcutButton>
        <button type="button">After</button>
      </>,
    );
    const action = screen.getByRole("menuitem", { name: "Search" });
    action.focus();

    fireEvent.keyDown(action, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Before" }),
    );
    expect(
      screen.getByRole("button", { name: "Quick" }).getAttribute(
        "aria-expanded",
      ),
    ).toBe("false");
  });
});
