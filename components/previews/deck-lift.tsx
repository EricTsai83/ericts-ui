"use client";

import { useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";

import { PreviewLeadingCorner } from "@/components/registry-preview";
import { DeckLift, type DeckLiftItem } from "@/registry/base/blocks/deck-lift";
import { cn } from "@/lib/utils";

/** The block is a container query, so the demo only has to change its width. */
const views = [
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "23.5rem" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "46rem" },
  { id: "desktop", label: "Desktop", icon: Monitor, width: "72rem" },
] as const;

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
 * the switcher produces. (Not derived from `--deck-lift-card-width` — that
 * clamp holds a percentage, which would resolve against the stage's *height*
 * once it landed in a height calc.)
 */
const sheetHeight = "h-[36%]";

export default function Preview({
  presentation = "inline",
}: {
  variant: string;
  presentation?: "inline" | "fullscreen";
}) {
  const [view, setView] = useState<(typeof views)[number]["id"]>("mobile");
  const width = views.find((entry) => entry.id === view)?.width;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        presentation === "fullscreen"
          ? "h-full"
          : // Inline, the size switcher floats in the card's corner *over* this
            // area, so the frame gives that row its height back rather than
            // tucking its own corner under it.
            "h-[min(44rem,78svh)] min-h-[36rem] pt-6",
      )}
    >
      {/* The demo's own control takes the preview's leading corner, mirroring
          the chrome's control in the trailing one. */}
      <PreviewLeadingCorner>
        <div
          role="group"
          aria-label="Preview size"
          // 32px tall, the same box as the chrome's icon control it mirrors.
          className="flex h-8 items-center gap-1 rounded-full border bg-background/80 px-0.5 backdrop-blur-sm"
        >
          {views.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={view === entry.id}
              onClick={() => setView(entry.id)}
              className={cn(
                "inline-flex size-7 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                view === entry.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <entry.icon aria-hidden="true" className="size-3.5" />
              <span className="sr-only">{entry.label}</span>
            </button>
          ))}
        </div>
      </PreviewLeadingCorner>

      <DeckLift
        items={items}
        sheet={<Sheet />}
        sheetClassName={sheetHeight}
        deckLabel="Cards"
        style={{ width }}
        className="h-full max-w-full rounded-[1.75rem] border shadow-sm transition-[width] duration-300 ease-out motion-reduce:transition-none"
        cardClassName="shadow-lg"
      >
        <Page />
      </DeckLift>
    </div>
  );
}
