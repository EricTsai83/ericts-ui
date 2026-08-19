// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CardLift, type CardLiftItem } from "@/registry/base/blocks/card-lift";

const items: readonly CardLiftItem[] = [
  {
    id: "virtual",
    label: "Virtual card",
    face: <span>virtual face</span>,
    detail: <p>Virtual card activity</p>,
  },
  {
    id: "physical",
    label: "Physical card",
    face: <span>physical face</span>,
    detail: <p>Physical card activity</p>,
  },
];

function renderCardLift(props: Partial<React.ComponentProps<typeof CardLift>> = {}) {
  return render(
    <CardLift items={items} sheet={<p>Set up direct deposit</p>} {...props}>
      <p>Total balance</p>
    </CardLift>,
  );
}

function getStage(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[data-slot="card-lift"]')!;
}

function getLayer(container: HTMLElement, slot: string) {
  return container.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
}

beforeEach(() => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(
      (media: string) =>
        ({
          matches: false,
          media,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(() => true),
        }) as MediaQueryList,
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("CardLift", () => {
  it("rests with the page live and the cover held out of reach", () => {
    const { container } = renderCardLift();

    expect(getStage(container).dataset.state).toBe("closed");
    expect(getLayer(container, "card-lift-page").hasAttribute("inert")).toBe(
      false,
    );
    expect(getLayer(container, "card-lift-cover").hasAttribute("inert")).toBe(
      true,
    );
    expect(
      screen
        .getByRole("button", { name: "Virtual card" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("opens the card that was pressed and covers the page behind it", async () => {
    const { container } = renderCardLift();

    fireEvent.click(screen.getByRole("button", { name: "Physical card" }));

    expect(getStage(container).dataset.state).toBe("open");
    expect(getLayer(container, "card-lift-page").hasAttribute("inert")).toBe(
      true,
    );
    expect(getLayer(container, "card-lift-sheet").hasAttribute("inert")).toBe(
      true,
    );
    expect(getLayer(container, "card-lift-cover").hasAttribute("inert")).toBe(
      false,
    );

    const panel = screen.getByRole("tabpanel");

    expect(panel.textContent).toContain("Physical card activity");
    expect(panel.getAttribute("aria-labelledby")).toBe(
      screen.getByRole("tab", { name: "Physical card" }).id,
    );
  });

  it("keeps the deck as one row of tabs, each with its own detail", async () => {
    renderCardLift();

    fireEvent.click(screen.getByRole("button", { name: "Virtual card" }));

    const tabs = screen.getAllByRole("tab");

    expect(tabs).toHaveLength(2);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].getAttribute("tabindex")).toBe("0");
    expect(tabs[1].getAttribute("tabindex")).toBe("-1");

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByRole("tabpanel").textContent).toContain(
        "Physical card activity",
      );
    });

    expect(screen.getAllByRole("tab")[1].getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(document.activeElement).toBe(screen.getAllByRole("tab")[1]);
  });

  it("closes on Escape and hands focus back to the open card", async () => {
    const { container } = renderCardLift();

    const card = screen.getByRole("button", { name: "Virtual card" });

    fireEvent.click(card);
    expect(getStage(container).dataset.state).toBe("open");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(getStage(container).dataset.state).toBe("closed");
    });

    expect(document.activeElement).toBe(card);
  });

  it("keeps cards past the pile out of the resting deck, then hands them over", () => {
    const deck = Array.from({ length: 5 }, (_, index) => ({
      id: `card-${index}`,
      label: `Card ${index}`,
      face: <span>face {index}</span>,
      detail: <p>detail {index}</p>,
    }));

    renderCardLift({ items: deck });

    // The pile shows two; the rest wait on the last slot, inert rather than
    // hidden, so they are never invisible tab stops.
    const resting = screen.getAllByRole("button");

    expect(resting.map((card) => card.hasAttribute("inert"))).toEqual([
      false,
      false,
      true,
      true,
      true,
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Card 0" }));

    const tabs = screen.getAllByRole("tab");

    expect(tabs).toHaveLength(deck.length);
    expect(tabs.some((tab) => tab.hasAttribute("inert"))).toBe(false);
  });

  it("stops at the ends of the row instead of wrapping around", async () => {
    renderCardLift();

    fireEvent.click(screen.getByRole("button", { name: "Virtual card" }));
    fireEvent.keyDown(screen.getAllByRole("tab")[0], { key: "End" });

    await waitFor(() => {
      expect(screen.getAllByRole("tab")[1].getAttribute("aria-selected")).toBe(
        "true",
      );
    });

    // Past the last card there is nowhere to go: the selection holds rather
    // than rolling over to the first.
    fireEvent.keyDown(screen.getAllByRole("tab")[1], { key: "ArrowRight" });

    expect(screen.getAllByRole("tab")[1].getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("tabpanel").textContent).toContain(
      "Physical card activity",
    );
  });

  it("reports selection without latching when the value is controlled", () => {
    const onValueChange = vi.fn();
    const { container } = renderCardLift({ value: null, onValueChange });

    fireEvent.click(screen.getByRole("button", { name: "Virtual card" }));

    expect(onValueChange).toHaveBeenCalledWith("virtual", items[0]);
    expect(getStage(container).dataset.state).toBe("closed");
  });
});
