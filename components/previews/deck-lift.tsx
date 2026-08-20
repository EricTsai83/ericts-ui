"use client";

import { DeckLift, type DeckLiftItem } from "@/registry/base/blocks/deck-lift";
import { cn } from "@/lib/utils";

/**
 * Placeholders rather than a finished screen: the demo is here to show the
 * move, and every grey block marks a slot to drop real content into. Coloured
 * faces are `bg-foreground` under a tint, so `text-background` stays legible in
 * both themes — a raw chart colour flips lightness between them.
 */
const cards = [
  { id: "one", name: "Card 01", tint: "" },
  { id: "two", name: "Card 02", tint: "silver" },
  { id: "three", name: "Card 03", tint: "bg-chart-2/35" },
  { id: "four", name: "Card 04", tint: "bg-chart-1/35" },
] as const;

type Card = (typeof cards)[number];

function Face({ card }: { card: Card }) {
  return (
    <div
      className={cn(
        "relative flex size-full flex-col justify-between p-4",
        card.tint === "silver"
          ? "bg-linear-to-br from-muted to-secondary text-foreground"
          : "bg-foreground text-background",
      )}
    >
      {card.tint && card.tint !== "silver" ? (
        <div aria-hidden="true" className={cn("absolute inset-0", card.tint)} />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[repeating-linear-gradient(112deg,currentColor_0_1px,transparent_1px_22px)] opacity-15"
      />

      <span className="relative w-fit rounded-full border border-current/25 px-2.5 py-0.5 text-[0.7rem] font-medium">
        {card.name}
      </span>
      <span
        aria-hidden="true"
        className="relative h-2 w-24 rounded-full bg-current/25"
      />
    </div>
  );
}

function Detail({ card }: { card: Card }) {
  return (
    <div className="flex flex-col gap-4 px-5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{card.name} detail</p>
        <span aria-hidden="true" className="h-4 w-44 rounded-full bg-muted" />
      </div>

      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            aria-hidden="true"
            className="h-16 rounded-xl bg-muted"
          />
        ))}
      </div>
    </div>
  );
}

const items: DeckLiftItem[] = cards.map((card) => ({
  id: card.id,
  label: card.name,
  face: <Face card={card} />,
  detail: <Detail card={card} />,
}));

function Page() {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-4 p-5 @5xl:max-w-3xl">
      <div className="flex items-center justify-between">
        <span aria-hidden="true" className="h-4 w-28 rounded-full bg-muted" />
        <span aria-hidden="true" className="size-8 rounded-full bg-muted" />
      </div>
      <div className="h-[38%] min-h-28 rounded-2xl bg-muted p-4">
        <span className="text-xs font-medium text-muted-foreground">Page</span>
      </div>
    </div>
  );
}

function Sheet() {
  return (
    <div className="h-full p-4">
      <div className="h-full rounded-2xl bg-muted p-4">
        <span className="text-xs font-medium text-muted-foreground">Sheet</span>
      </div>
    </div>
  );
}

/**
 * A share of the stage rather than a content height: the deck rests at 56% of
 * it, so this leaves roughly the top third of the card showing at every size
 * the preview frame produces. (Not derived from `--deck-lift-card-width` — that
 * clamp holds a percentage, which would resolve against the stage's *height*
 * once it landed in a height calc.)
 */
const sheetHeight = "h-[36%]";

/**
 * The demo fills whatever box the preview frame hands it and lets the block's
 * own container queries do the rest — the device switcher lives in the preview
 * chrome, so nothing here knows or cares what size it is being shown at. The
 * border and the lifted shadow are the device's, not the page's: they are what
 * make it read as a screen resting on the canvas rather than a panel let into
 * it.
 */
export default function Preview() {
  return (
    <DeckLift
      items={items}
      sheet={<Sheet />}
      sheetClassName={sheetHeight}
      deckLabel="Cards"
      className="size-full rounded-[1.75rem] border shadow-xl"
      cardClassName="shadow-lg"
    >
      <Page />
    </DeckLift>
  );
}
