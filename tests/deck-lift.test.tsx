// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DeckLift,
  deckLiftDockStep,
  deckLiftSwipeTarget,
  type DeckLiftItem,
} from "@/registry/base/blocks/deck-lift";

const items: readonly DeckLiftItem[] = [
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

function renderDeckLift(props: Partial<React.ComponentProps<typeof DeckLift>> = {}) {
  return render(
    <DeckLift items={items} sheet={<p>Set up direct deposit</p>} {...props}>
      <p>Total balance</p>
    </DeckLift>,
  );
}

function getStage(container: HTMLElement) {
  return container.querySelector<HTMLElement>('[data-slot="deck-lift"]')!;
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

describe("DeckLift", () => {
  it("rests with the page live and the cover held out of reach", () => {
    const { container } = renderDeckLift();

    expect(getStage(container).dataset.state).toBe("closed");
    expect(getLayer(container, "deck-lift-page").hasAttribute("inert")).toBe(
      false,
    );
    expect(getLayer(container, "deck-lift-cover").hasAttribute("inert")).toBe(
      true,
    );
    expect(
      screen
        .getByRole("button", { name: "Virtual card" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("opens the card that was pressed and covers the page behind it", async () => {
    const { container } = renderDeckLift();

    fireEvent.click(screen.getByRole("button", { name: "Physical card" }));

    expect(getStage(container).dataset.state).toBe("open");
    expect(getLayer(container, "deck-lift-page").hasAttribute("inert")).toBe(
      true,
    );
    expect(getLayer(container, "deck-lift-sheet").hasAttribute("inert")).toBe(
      true,
    );
    expect(getLayer(container, "deck-lift-cover").hasAttribute("inert")).toBe(
      false,
    );

    const panel = screen.getByRole("tabpanel");

    expect(panel.textContent).toContain("Physical card activity");
    expect(panel.getAttribute("aria-labelledby")).toBe(
      screen.getByRole("tab", { name: "Physical card" }).id,
    );
  });

  it("keeps the deck as one row of tabs, each with its own detail", async () => {
    renderDeckLift();

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
    const { container } = renderDeckLift();

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

    renderDeckLift({ items: deck });

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
    renderDeckLift();

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

  it("orders the layers the way the screen reads, so Tab follows the eye", () => {
    renderDeckLift();

    fireEvent.click(screen.getByRole("button", { name: "Virtual card" }));

    const before = (first: Element, second: Element) =>
      Boolean(
        first.compareDocumentPosition(second) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      );

    const close = screen.getByRole("button", { name: "Close" });
    const card = screen.getByRole("tab", { name: "Virtual card" });
    const panel = screen.getByRole("tabpanel");

    // The cards paint over the cover that holds the detail, so `z-index` and the
    // DOM disagree on purpose. Tab follows the DOM, and it has to read downward.
    expect(before(close, card)).toBe(true);
    expect(before(card, panel)).toBe(true);
  });

  it("keeps the desktop focus mask over the full card lift", () => {
    const { container } = renderDeckLift();

    const focus = getLayer(container, "deck-lift-focus");
    const deck = getLayer(container, "deck-lift-deck");

    // The masked frame must cover the whole stage. If the resting top belongs
    // to this frame, cards translated into the dock sit outside its mask box
    // and become completely transparent at the desktop container breakpoint.
    expect(focus.className).toContain("inset-0");
    expect(focus.style.top).toBe("");
    expect(deck.className).toContain("absolute");
    expect(Number.parseFloat(deck.style.top)).toBeCloseTo(56);
  });

  it("starts each card's detail at the top, however the last one was left", async () => {
    const { container } = renderDeckLift();

    fireEvent.click(screen.getByRole("button", { name: "Virtual card" }));

    // The scroller inside the panel frame, which every card's detail reuses.
    const scroller = getLayer(container, "deck-lift-detail")
      .firstElementChild as HTMLElement;

    scroller.scrollTop = 240;

    fireEvent.keyDown(screen.getAllByRole("tab")[0], { key: "ArrowRight" });

    await waitFor(() => {
      expect(screen.getByRole("tabpanel").textContent).toContain(
        "Physical card activity",
      );
    });

    expect(scroller.scrollTop).toBe(0);
  });

  it("lets go of a card that leaves `items` rather than re-opening on it", () => {
    const { container, rerender } = render(
      <DeckLift items={items}>
        <p>Total balance</p>
      </DeckLift>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Physical card" }));
    expect(getStage(container).dataset.state).toBe("open");

    rerender(
      <DeckLift items={[items[0]]}>
        <p>Total balance</p>
      </DeckLift>,
    );

    expect(getStage(container).dataset.state).toBe("closed");

    rerender(
      <DeckLift items={items}>
        <p>Total balance</p>
      </DeckLift>,
    );

    // The stored id went with the card: it does not come back with it.
    expect(getStage(container).dataset.state).toBe("closed");
  });

  it("reports selection without latching when the value is controlled", () => {
    const onValueChange = vi.fn();
    const { container } = renderDeckLift({ value: null, onValueChange });

    fireEvent.click(screen.getByRole("button", { name: "Virtual card" }));

    expect(onValueChange).toHaveBeenCalledWith("virtual", items[0]);
    expect(getStage(container).dataset.state).toBe("closed");
  });
});

describe("deckLiftSwipeTarget", () => {
  const row = { step: 300, activeIndex: 1, count: 4 };

  it("holds the active card when the drag was too short to commit", () => {
    expect(
      deckLiftSwipeTarget({ ...row, offsetX: -60, velocityX: 0 }),
    ).toBe(1);
  });

  it("commits a flick that barely moved, on its parting speed alone", () => {
    // 20px of travel is nothing; 800px/s of it is a flick.
    expect(deckLiftSwipeTarget({ ...row, offsetX: -20, velocityX: 0 })).toBe(1);
    expect(
      deckLiftSwipeTarget({ ...row, offsetX: -20, velocityX: -800 }),
    ).toBe(2);
  });

  it("reads a drag to the right as the card before the active one", () => {
    expect(
      deckLiftSwipeTarget({ ...row, offsetX: 120, velocityX: 0 }),
    ).toBe(0);
  });

  it("crosses more than one card when the drag covered more than one", () => {
    expect(
      deckLiftSwipeTarget({ ...row, offsetX: -700, velocityX: 0 }),
    ).toBe(3);
  });

  it("is worth one card however hard the flick", () => {
    // Speed decides whether a gesture commits, not how far it carries. Raw, a
    // 6000px/s flick is worth two card widths at this step, and rounding took
    // the row past the card the finger meant.
    for (const velocityX of [-1200, -2400, -6000, -20000]) {
      expect(deckLiftSwipeTarget({ ...row, offsetX: -20, velocityX })).toBe(2);
    }

    expect(deckLiftSwipeTarget({ ...row, offsetX: 20, velocityX: 20000 })).toBe(
      0,
    );
  });

  it("still crosses several cards when the travel, not the speed, asked for it", () => {
    // Travel stays uncapped: a drag over three cards was aimed at three cards.
    expect(deckLiftSwipeTarget({ ...row, offsetX: -900, velocityX: 0 })).toBe(3);
    expect(
      deckLiftSwipeTarget({ ...row, offsetX: -900, velocityX: 0, count: 8 }),
    ).toBe(4);
  });

  it("stops at the ends of the row", () => {
    expect(
      deckLiftSwipeTarget({ ...row, offsetX: -1800, velocityX: -2000 }),
    ).toBe(3);
    expect(
      deckLiftSwipeTarget({ ...row, offsetX: 1800, velocityX: 2000 }),
    ).toBe(0);
  });

  it("holds still before the deck has been measured", () => {
    // `step` is zero until the first card is measured; a drag then has no card
    // width to be a share of, and dividing by it would commit on any twitch.
    expect(
      deckLiftSwipeTarget({ ...row, step: 0, offsetX: -900, velocityX: -900 }),
    ).toBe(1);
  });
});

describe("deckLiftDockStep", () => {
  it("pulls scaled neighbours into reach when two cards cannot fit", () => {
    const step = deckLiftDockStep({ stageWidth: 390, cardWidth: 318 });

    // A 318px card at 86% scale leaves 20px inside a 390px stage while keeping
    // 16px between visible edges, instead of the natural row's roughly 4px.
    expect(step).toBeCloseTo(311.74);
    expect(step).toBeLessThan(318 + 10);
  });

  it("keeps the spacious depth once two cards fit", () => {
    expect(deckLiftDockStep({ stageWidth: 768, cardWidth: 384 })).toBe(394);
  });

  it("does not invent a swipe distance before the card is measured", () => {
    expect(deckLiftDockStep({ stageWidth: 390, cardWidth: 0 })).toBe(0);
  });
});
