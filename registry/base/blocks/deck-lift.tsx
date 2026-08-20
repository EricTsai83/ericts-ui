"use client";

import * as React from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "motion/react";

import { useElementSizeMap } from "@/hooks/use-element-size-map";
import { cn } from "@/lib/utils";

export type DeckLiftItem = {
  id: string;
  /** Accessible name for the card; also labels its detail panel. */
  label: string;
  /** The card face. One element in both states — it is never re-created. */
  face: React.ReactNode;
  /** Fills the page under the docked deck while this card is the active one. */
  detail: React.ReactNode;
};

export type DeckLiftProps = Omit<
  React.ComponentProps<"div">,
  "children" | "defaultValue" | "onChange"
> & {
  items: readonly DeckLiftItem[];
  /** The page the deck rests on. Covered, never unmounted, while open. */
  children?: React.ReactNode;
  /** Raised sheet over the resting deck; it drops away as a card opens. */
  sheet?: React.ReactNode;
  /** Open card id, or `null` for the resting deck. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string | null, item: DeckLiftItem | null) => void;
  /** Cards the resting pile shows. The rest wait on its last slot. */
  pileSize?: number;
  deckLabel?: string;
  closeLabel?: string;
  cardClassName?: string;
  sheetClassName?: string;
  detailClassName?: string;
};

/* -------------------------------------------------------------------------
 * The move, in numbers. Start here — everything below is plumbing.
 * ---------------------------------------------------------------------- */

/** The resting pile. */
const REST = {
  /** Its top edge, as a share of the stage height. */
  top: 0.56,
  /** How far each card behind the front one rises out of it, in px. */
  rise: 18,
  shrink: 0.04,
  /** Front card's tilt in degrees; the pile straightens as it goes back. */
  tilt: -2.5,
  tiltStep: 1.2,
} as const;

/** The row the pile docks into. */
const DOCK = {
  /** Distance from the stage top, leaving room for the close control, in px. */
  top: 56,
  /** Between docked cards, and between the deck and the detail, in px. */
  gap: 10,
  /** More breathing room between the visible card edges on narrow stages. */
  narrowGap: 16,
  detailGap: 24,
  /**
   * How much smaller each card is per step away from the active one. Deep
   * enough that the card being read is plainly the nearest thing on the row:
   * the pile's own 0.04 a slot left the neighbours all but the same size as the
   * active card, which read as a flat strip rather than as one card in front of
   * the others. At 0.14, the immediate neighbours sit at 86% and the next layer
   * at 72%: enough separation to identify the active card without making the
   * alternatives look disabled.
   */
  recede: 0.14,
  /**
   * Steps away before a card stops receding. Without a floor the far end of a
   * long deck shrinks to nothing, and a deck of thirty would be a different
   * shape from a deck of three.
   */
  depth: 2,
} as const;

/**
 * Distance between card centres in the docked row.
 *
 * A narrow stage cannot show two full cards, so leaving the centres one full
 * card apart makes the scaled neighbour almost impossible to tap: at the
 * default mobile geometry only a few pixels survive the stage clip. There the
 * step compensates for half of the neighbour's shrink, then keeps a slightly
 * roomier visible gap between the edges. Once two cards fit, the uncompensated
 * spacing returns so the extra air can keep expressing depth on tablet and
 * desktop.
 *
 * Exported because jsdom cannot measure the rendered card and stage boxes.
 */
export function deckLiftDockStep({
  stageWidth,
  cardWidth,
}: {
  stageWidth: number;
  cardWidth: number;
}) {
  if (!cardWidth) return 0;

  const naturalStep = cardWidth + DOCK.gap;
  const narrow = stageWidth > 0 && stageWidth < cardWidth * 2;

  if (!narrow) return naturalStep;

  return cardWidth * (1 - DOCK.recede / 2) + DOCK.narrowGap;
}

/** The swipe between docked cards. */
const SWIPE = {
  /** Share of a card's width a drag must cover before it commits. */
  threshold: 0.24,
  /** Seconds of flick velocity folded into the drag's travel. */
  velocity: 0.12,
  /**
   * Cards the flick alone may be worth. Speed decides *whether* a gesture
   * commits, not how far it goes: a hard flick from a standstill is one flick
   * and means the next card, but at 4000px/s its raw contribution is more than
   * a card and a half, which rounded up to two — the row lurching past the card
   * the finger clearly meant. Travel stays uncapped, because a drag that
   * covered three cards was aimed at three cards.
   */
  flickReach: 1,
  elastic: 0.12,
} as const;

/** The page of detail under the docked deck. */
const DETAIL = {
  /**
   * Share of the deck's travel a page of detail covers as it is swapped out for
   * the next. Under 1, so the page reads as lying further back than the cards —
   * the same screen trailing the deck, rather than a second row moving in
   * lockstep with it. It is the only number here: the distance and the timing
   * both come off the deck, so the two layers cannot drift apart when either is
   * re-tuned.
   *
   * It is spent on the *swap* and nothing else. A live drag leaves the page
   * alone: the cards are the thing under the finger, and text sliding around
   * beneath them turns every hesitant half-swipe into a page that will not hold
   * still long enough to be read.
   */
  swapTravel: 0.22,
} as const;

const SPRING = {
  /** The lift. Deck, cover and sheet all ride this one spring. */
  stage: { type: "spring", duration: 0.58, bounce: 0.16 },
  /** The shorter snap between docked cards. */
  snap: { type: "spring", duration: 0.42, bounce: 0.12 },
  /** The trade of one page of detail for the next. Its *travel* is not here:
   *  that rides `snap` above, so the page and the cards over it settle as one
   *  move. This is only the hand-off, and it is deliberately lopsided — the
   *  leaving page clears out ahead of the arriving one, because two pages of
   *  the same shape held at half opacity over the same pixels read as a smear
   *  rather than as one being replaced by the other. */
  detailLeave: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  detailArrive: { duration: 0.2, delay: 0.06, ease: [0.22, 1, 0.36, 1] },
  /** Cards joining the lift are there from its first frame; on the way back
   *  they only fade once landed, so the pile never looks like it dissolves. */
  arrive: { duration: 0.12 },
  leave: { duration: 0.2, delay: 0.18 },
  /** Reduced motion drops travel, not feedback: a swap still has to be seen,
   *  and a cross-fade is not movement. */
  fade: { duration: 0.15 },
  still: { duration: 0 },
} as const;

/**
 * Where card `index` sits, in both states — the whole card animation. The pile
 * fans up and back; the docked row lays the same cards out sideways, receding
 * with distance from the active card; cards past the pile wait invisibly on its
 * last slot until the lift starts.
 */
function cardState({
  open,
  index,
  activeIndex,
  deepestSlot,
  step,
  dockY,
}: {
  open: boolean;
  index: number;
  activeIndex: number;
  deepestSlot: number;
  /** Distance between docked cards, measured from the rendered card. */
  step: number;
  /** Travel from the resting pile to the docked row. */
  dockY: number;
}) {
  if (open) {
    // Graded by distance rather than by "is this the active card": one card at
    // full size in an otherwise flat strip reads as a gap in the row, where a
    // row that keeps receding reads as depth.
    //
    // The cards share one grid cell and are held apart by `x` alone, with
    // `scale` applied about each card's centre. `step` only compensates that
    // shrink when the stage is too narrow to show two cards; on wider stages
    // the widening gaps remain part of the depth. Drag uses the same step, so
    // what the finger crosses and what the row advances never diverge.
    const away = Math.min(Math.abs(index - activeIndex), DOCK.depth);

    return {
      x: index * step,
      y: dockY,
      rotate: 0,
      scale: 1 - away * DOCK.recede,
      opacity: 1,
    };
  }

  const slot = Math.min(index, deepestSlot);

  return {
    x: 0,
    y: -slot * REST.rise,
    rotate: REST.tilt + slot * REST.tiltStep,
    scale: 1 - slot * REST.shrink,
    opacity: index > deepestSlot ? 0 : 1,
  };
}

/**
 * Which card a finished drag lands on, or `activeIndex` when it was too short
 * to commit. Travel is the finger's distance plus a capped slice of its parting
 * speed, so a flick that barely moves still commits, a flick however hard is
 * worth one card, and one long drag can still cross several. Exported so the
 * velocity arithmetic can be exercised without synthesizing a drag.
 */
export function deckLiftSwipeTarget({
  offsetX,
  velocityX,
  step,
  activeIndex,
  count,
}: {
  offsetX: number;
  velocityX: number;
  /** Distance between docked cards. Zero before the deck is measured. */
  step: number;
  activeIndex: number;
  count: number;
}) {
  if (!step) return activeIndex;

  const flick = (velocityX * SWIPE.velocity) / step;
  const cards =
    offsetX / step +
    Math.min(Math.max(flick, -SWIPE.flickReach), SWIPE.flickReach);

  if (Math.abs(cards) < SWIPE.threshold) return activeIndex;

  // Dragging right reveals the card before the active one.
  const towards = cards > 0 ? -1 : 1;
  const reach = Math.max(1, Math.round(Math.abs(cards)));

  return Math.min(Math.max(activeIndex + towards * reach, 0), count - 1);
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * A screen in three layers — a page of summary values, a raised sheet, and a
 * deck of cards between them. Opening a card lifts the whole deck to the top,
 * drops the sheet away, and pulls a full page of detail up behind the cards,
 * which then swipe as a row with the detail following underneath.
 *
 * Why it is built this way: the card the finger touched is the same element
 * that ends up docked at the top — nothing cross-fades, nothing is re-created —
 * so the move reads as *this screen became that card's screen*. The cover rides
 * up behind the cards on the same spring, so the summary values are wiped away
 * by the motion the eye is already following rather than by a scrim.
 *
 * @example
 *   <DeckLift items={cards} sheet={<Sheet />} className="h-dvh">
 *     <Dashboard />
 *   </DeckLift>
 *
 * - The stage is this block's own box, not the viewport, and it is a container:
 *   the card and the reading column widen with it, so the same screen works on a
 *   phone, a tablet and a desktop without a device prop.
 * - Card width is `--deck-lift-card-width`, a clamp that grows with the stage.
 *   The docked row, the swipe step and the detail offset are all measured from
 *   the card it produces, so overriding that one property moves the whole
 *   composition with it.
 * - It clips with `overflow-clip`: a scroll container would let the browser
 *   scroll a focused card into view and drag every layer with it.
 * - The layers under the open cover are `inert`, which contains focus without a
 *   hand-written trap; a card is one element in both states, so focus stays on
 *   whatever was pressed and only Escape has to put it back.
 * - The layers are ordered in the DOM the way the screen reads down — control
 *   row, cards, detail — and stacked with `z-index`, so Tab follows the eye
 *   rather than the paint order.
 * - Every position is measured, so a resize changes the same targets a press
 *   does. Those land instantly: a resize is not a move anyone made.
 * - `prefers-reduced-motion` drops the travel and keeps the fades, so a swap is
 *   still visible without anything crossing the screen.
 * - Cards bring no surface of their own. Give them a shadow through
 *   `cardClassName` or the pile's layers merge.
 */
export function DeckLift({
  items,
  children,
  sheet,
  value,
  defaultValue = null,
  onValueChange,
  pileSize = 2,
  deckLabel = "Cards",
  closeLabel = "Close",
  className,
  ref,
  cardClassName,
  sheetClassName,
  detailClassName,
  ...props
}: DeckLiftProps) {
  const reduceMotion = useReducedMotion() === true;
  const reactId = React.useId();
  const panelId = `${reactId}-panel`;
  // Stable, so the focus helper built on it can be stable too.
  const cardId = React.useCallback(
    (id: string) => `${reactId}-card-${id}`,
    [reactId],
  );
  const { setMeasureRef, sizes } = useElementSizeMap<HTMLElement>();
  const stageNode = React.useRef<HTMLDivElement | null>(null);
  const detailScroller = React.useRef<HTMLDivElement | null>(null);
  const dragged = React.useRef(false);

  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState<string | null>(
    defaultValue,
  );
  const openId =
    items.find((item) => item.id === (isControlled ? value : uncontrolled))
      ?.id ?? null;
  const open = openId !== null;

  // A card removed from `items` while it was open leaves the deck closed. The
  // stored id has to go with it, or putting that card back would re-open the
  // deck on its own.
  if (!isControlled && uncontrolled !== null && openId === null) {
    setUncontrolled(null);
  }

  const stageWidth = sizes.stage?.width ?? 0;
  const stageHeight = sizes.stage?.height ?? 0;
  const cardWidth = sizes.card?.width ?? 0;
  const cardHeight = sizes.card?.height ?? 0;
  const step = deckLiftDockStep({ stageWidth, cardWidth });
  const dockY = stageHeight ? DOCK.top - REST.top * stageHeight : 0;
  const deepestSlot = Math.max(0, Math.floor(pileSize) - 1);

  // What the deck last settled on. Every position below is measured, so a target
  // moves on a resize as much as on a press — and on the first render nothing is
  // measured at all. Neither is a move anyone made: without this the deck springs
  // after every ResizeObserver frame, and a deck that starts open springs in from
  // wherever the unmeasured layout put it. Adjusted during render, because the
  // transition this picks has to reach the DOM in the same commit as the target
  // it applies to.
  const [settled, setSettled] = React.useState({
    openId,
    step,
    dockY,
    instant: false,
  });

  const pressed = settled.openId !== openId;
  const measured = settled.step !== step || settled.dockY !== dockY;

  if (pressed || measured) {
    setSettled({ openId, step, dockY, instant: measured && !pressed });
  }

  // A render that changes neither leaves this as it was, which is harmless: with
  // no target to move, nothing animates either way.
  const instant = reduceMotion || settled.instant;

  const stageSpring = instant ? SPRING.still : SPRING.stage;
  const snapSpring = instant ? SPRING.still : SPRING.snap;

  // The detail outlives the open state, so closing never blanks the page
  // mid-flight, and it remembers which way the deck moved so it can leave the
  // same way. Synced in render — an effect would swap it a frame late.
  const [detail, setDetail] = React.useState(() => ({
    id: openId ?? items[0]?.id ?? "",
    direction: 0,
  }));

  if (open && openId !== detail.id) {
    const from = items.findIndex((item) => item.id === detail.id);
    const to = items.findIndex((item) => item.id === openId);

    setDetail({
      id: openId,
      // Opening from rest is not a lateral move: the deck arrives with this card
      // at the front, so its detail belongs there from the first frame rather
      // than sliding in past a card the row was never showing. Only a swipe or
      // an arrow key, which moves the row sideways, gives a swap its direction.
      direction:
        settled.openId !== null && from !== -1 ? (to < from ? -1 : 1) : 0,
    });
  } else if (!open) {
    // The card the detail was showing can disappear from `items`. Fall back
    // without a direction rather than sliding to a neighbour it never had.
    const fallback = items.some((item) => item.id === detail.id)
      ? detail.id
      : (items[0]?.id ?? "");

    if (fallback !== detail.id) setDetail({ id: fallback, direction: 0 });
  }

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === detail.id),
  );
  const activeItem = items[activeIndex];
  const direction = detail.direction;

  // Reduced motion drops the swap's travel and keeps its hand-off — see `fade`
  // above.
  const swapTravel = reduceMotion ? 0 : DETAIL.swapTravel;

  // The deck's x is a motion value because a drag writes to the same value:
  // after a drag that commits nothing there is no new target for an `animate`
  // prop to re-apply, and `dragSnapToOrigin` would send the deck to its layout
  // origin — the first card — instead of the one being looked at.
  const deckX = useMotionValue(0);
  const deckTarget = open ? -activeIndex * step : 0;
  const deckTargetRef = React.useRef(deckTarget);

  React.useEffect(() => {
    deckTargetRef.current = deckTarget;

    const controls = animate(deckX, deckTarget, snapSpring);
    return () => controls.stop();
  }, [deckTarget, deckX, snapSpring]);

  // The page of detail moves on a swap and at no other time. It is deliberately
  // not wired to the drag: the deck is the layer the finger has hold of, and a
  // page that leans out under every uncommitted quarter-swipe is a paragraph
  // being tugged away from the eye that is reading it. So it holds still until
  // the release decides, and then trades itself for the next one.
  const detailVariants = React.useMemo(() => {
    const travel = step * swapTravel;

    return {
      enter: (towards: number) => ({ opacity: 0, x: towards * travel }),
      center: {
        opacity: 1,
        x: 0,
        transition: { x: snapSpring, opacity: SPRING.detailArrive },
      },
      exit: (towards: number) => ({
        opacity: 0,
        x: towards * -travel,
        transition: SPRING.detailLeave,
      }),
    };
  }, [snapSpring, step, swapTravel]);

  /**
   * Focus a card by id rather than through a map of refs. Holding that map cost
   * the deck its measurement: a per-card `ref` has to be written inline to
   * close over the card's id, which makes it a new function every render, so
   * React re-attaches it on every commit and re-measures the card it is on.
   * That measurement is `step`, which every position here is built from, so the
   * churn dragged the whole docked row about under the finger. Every card
   * already carries a stable `id`; one lookup is enough.
   */
  const focusCard = React.useCallback(
    (id: string) => {
      const doc = stageNode.current?.ownerDocument ?? document;

      doc.getElementById(cardId(id))?.focus();
    },
    [cardId],
  );

  const setOpenValue = React.useCallback(
    (nextId: string | null) => {
      const next = items.find((item) => item.id === nextId) ?? null;

      if (!isControlled) setUncontrolled(next?.id ?? null);

      onValueChange?.(next?.id ?? null, next);
    },
    [isControlled, items, onValueChange],
  );

  const select = React.useCallback(
    (index: number, focus = false) => {
      const next = items[Math.min(Math.max(index, 0), items.length - 1)];

      if (!next || next.id === detail.id) return;

      setOpenValue(next.id);

      if (focus) focusCard(next.id);
    },
    [detail.id, focusCard, items, setOpenValue],
  );

  // The detail is one scroller every card reuses, so a card that opens after a
  // long one would otherwise arrive already scrolled. A layout effect, so the
  // swap and the reset land in the same frame, and never while closing, where the
  // jump would be on screen.
  useIsomorphicLayoutEffect(() => {
    if (!open || !detailScroller.current) return;

    detailScroller.current.scrollTop = 0;
  }, [open, detail.id]);

  const close = React.useCallback(() => {
    // The open card is the element that was pressed to get here, so returning
    // focus to it is the only focus move this block makes.
    focusCard(detail.id);
    setOpenValue(null);
  }, [detail.id, focusCard, setOpenValue]);

  // Read through a ref: with an inline `onValueChange`, `close` changes identity
  // on every parent render, and the Escape listener must not re-bind that often.
  const closeRef = React.useRef(close);

  React.useEffect(() => {
    closeRef.current = close;
  });

  React.useEffect(() => {
    if (!open) return;

    // Clicking dead space inside a page moves focus to the body, so this has to
    // be the document rather than the stage. `defaultPrevented` yields to a
    // popover or combobox inside the detail that took Escape first, and marking
    // the event afterwards lets a dialog this block sits inside skip it too.
    const doc = stageNode.current?.ownerDocument ?? document;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;

      event.preventDefault();
      closeRef.current();
    };

    doc.addEventListener("keydown", onKeyDown);
    return () => doc.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const onDeckKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return;

    const to = {
      ArrowRight: activeIndex + 1,
      ArrowLeft: activeIndex - 1,
      Home: 0,
      End: items.length - 1,
    }[event.key];

    if (to === undefined) return;

    event.preventDefault();
    select(to, true);
  };

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    const target = deckLiftSwipeTarget({
      offsetX: info.offset.x,
      velocityX: info.velocity.x,
      step,
      activeIndex,
      count: items.length,
    });

    // Every release settles the row, not only an uncommitted one: nothing else
    // would pull it off the offset the finger left it at.
    //
    // Where it settles *to* is the whole difference. Uncontrolled, this
    // component decides which card wins, so the row is sent straight to it and
    // the retarget above lands on the same value — one continuous spring. Sent
    // to the card being left instead, as it was, the row travels back under the
    // finger's own direction for the render it takes to commit and only then
    // turns around: a kick on every release that crosses a card, and the whole
    // reason a swipe felt like it jumped.
    //
    // Controlled, that shortcut is not available. The owner may decline the
    // swipe, and a row already on its way to a card it was never given would be
    // showing one screen under another's detail — so it goes back to the card on
    // screen and waits to be told, which is the one case where the kick is the
    // honest answer.
    animate(
      deckX,
      isControlled ? deckTargetRef.current : -target * step,
      snapSpring,
    );

    select(target);

    // The click that follows a drag has to be swallowed, but the flag has to be
    // gone before the next keyboard activation, which arrives with no pointer
    // event to clear it.
    requestAnimationFrame(() => {
      dragged.current = false;
    });
  };

  const setStageRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      stageNode.current = node;
      setMeasureRef("stage")(node);

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref, setMeasureRef],
  );

  return (
    <div
      ref={setStageRef}
      data-slot="deck-lift"
      data-state={open ? "open" : "closed"}
      className={cn(
        "@container relative isolate overflow-clip bg-background",
        // The one width the composition is built from: it grows with the stage
        // and stops at a card-sized cap, so a phone, a tablet and a desktop all
        // get a card rather than a stretched one. Every other measurement is
        // taken from the card this produces. (A `@container` cannot query
        // itself, so this is a clamp rather than container-query breakpoints.)
        "[--deck-lift-card-width:clamp(15rem,calc(100%-4.5rem),24rem)]",
        // How far from the middle a card is gone. The row stays full width and
        // fully draggable; this only says how much of it is being presented.
        "[--deck-lift-focus:var(--deck-lift-card-width)]",
        className,
      )}
      {...props}
    >
      {/* The page. It never moves; it is covered. */}
      <div
        data-slot="deck-lift-page"
        inert={open}
        aria-hidden={open || undefined}
        className="absolute inset-0 z-0"
      >
        {children}
      </div>

      {/* The control row. Its own layer on the cover's spring, so the close
          button can be read — and reached — before the cards it sits above:
          `z-index` orders what is painted, the DOM orders what Tab visits. */}
      <motion.div
        data-slot="deck-lift-controls"
        inert={!open}
        aria-hidden={open ? undefined : true}
        initial={false}
        animate={{ y: open ? "0%" : "100%" }}
        transition={stageSpring}
        className="pointer-events-none absolute inset-0 z-40"
      >
        <div
          className="flex items-center px-3"
          style={{ height: DOCK.top }}
        >
          <button
            type="button"
            onClick={close}
            className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            <span className="sr-only">{closeLabel}</span>
          </button>
        </div>
      </motion.div>

      {/* The deck: a pile at rest, a swipeable row once open.

          Two boxes, because the mask has to hold still. It lives on this frame
          rather than on the row, which is translated by `x` — a mask travels
          with the box it is set on, so one applied to the row would slide off
          centre along with it. */}
      <div
        data-slot="deck-lift-focus"
        className={cn(
          // Fill the stage vertically. The cards travel from the resting pile
          // to the dock, but the desktop mask must not travel or keep the
          // resting pile's short border box: masked overflow outside that box
          // is transparent, which made the entire docked deck disappear.
          "pointer-events-none absolute inset-0 z-20",
          // Only once the stage has more width than the composition wants. On a
          // phone the card already fills it and the neighbours see themselves
          // off; from here up the stage keeps growing while the card stops at
          // its cap, so the spare width turns into *more cards* rather than a
          // bigger one — three of them at desktop, none of which says which one
          // the detail below belongs to. Every other layer here caps its own
          // width for the same reason; this is the deck's version of that.
          "@2xl:mask-[linear-gradient(to_right,transparent_calc(50%_-_var(--deck-lift-focus)),black_calc(50%_-_var(--deck-lift-card-width)/2),black_calc(50%_+_var(--deck-lift-card-width)/2),transparent_calc(50%_+_var(--deck-lift-focus)))]",
        )}
      >
        <motion.div
          data-slot="deck-lift-deck"
          role={open ? "tablist" : undefined}
          aria-label={open ? deckLabel : undefined}
          aria-orientation={open ? "horizontal" : undefined}
          drag={open && items.length > 1 ? "x" : false}
          dragElastic={SWIPE.elastic}
          dragMomentum={false}
          dragConstraints={{ left: -(items.length - 1) * step, right: 0 }}
          onPointerDownCapture={() => {
            dragged.current = false;
          }}
          onDragStart={() => {
            dragged.current = true;
          }}
          onDragEnd={onDragEnd}
          onKeyDown={onDeckKeyDown}
          initial={false}
          style={{ x: deckX, top: `${REST.top * 100}%` }}
          className="absolute inset-x-0 grid justify-items-center"
        >
          {items.map((item, index) => {
            const active = open && item.id === detail.id;
            const waiting = !open && index > deepestSlot;

            return (
              <motion.button
                key={item.id}
                id={cardId(item.id)}
                // The deck's geometry is read off the first rendered card.
                // `setMeasureRef` caches per key, so this is the same function
                // every render and React leaves the subscription alone.
                ref={index === 0 ? setMeasureRef("card") : undefined}
                type="button"
                aria-label={item.label}
                role={open ? "tab" : undefined}
                aria-selected={open ? active : undefined}
                aria-controls={open ? panelId : undefined}
                aria-expanded={open ? undefined : false}
                tabIndex={open && !active ? -1 : 0}
                inert={waiting}
                data-slot="deck-lift-card"
                data-active={active || undefined}
                onClick={() => {
                  if (dragged.current) return;
                  if (open) select(index);
                  else setOpenValue(item.id);
                }}
                initial={false}
                animate={cardState({
                  open,
                  index,
                  activeIndex,
                  deepestSlot,
                  step,
                  dockY,
                })}
                transition={{
                  ...stageSpring,
                  opacity: reduceMotion
                    ? SPRING.fade
                    : open
                      ? SPRING.arrive
                      : SPRING.leave,
                }}
                style={{
                  zIndex:
                    items.length -
                    (open ? Math.abs(index - activeIndex) : index),
                  touchAction: open ? "pan-y" : undefined,
                }}
                className={cn(
                  "pointer-events-auto aspect-[1.586/1] w-(--deck-lift-card-width) overflow-hidden rounded-2xl text-left outline-none [grid-area:1/1] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  cardClassName,
                )}
              >
                {item.face}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* The cover, rising behind the cards to wipe the page away. */}
      <motion.div
        data-slot="deck-lift-cover"
        inert={!open}
        aria-hidden={open ? undefined : true}
        initial={false}
        animate={{ y: open ? "0%" : "100%" }}
        transition={stageSpring}
        className="absolute inset-0 z-10 flex flex-col bg-background"
      >
        {/* The control row and the floating deck both sit over this. */}
        <div
          aria-hidden="true"
          className="shrink-0"
          style={{ height: DOCK.top + cardHeight + DOCK.detailGap }}
        />

        <div
          id={panelId}
          role={open ? "tabpanel" : undefined}
          aria-labelledby={
            open && activeItem ? cardId(activeItem.id) : undefined
          }
          data-slot="deck-lift-detail"
          className={cn("flex min-h-0 flex-1 flex-col py-2", detailClassName)}
        >
          {/* Padding stays on this frame so it does not scroll away. */}
          <div
            ref={detailScroller}
            className="min-h-0 flex-1 overflow-x-clip overflow-y-auto"
          >
            <div className="relative mx-auto w-full max-w-2xl @5xl:max-w-3xl">
              <AnimatePresence
                initial={false}
                mode="popLayout"
                custom={direction}
              >
                {activeItem ? (
                  <motion.div
                    key={activeItem.id}
                    custom={direction}
                    variants={detailVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {activeItem.detail}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* The sheet, dropping out from over the pile. */}
      {sheet ? (
        <motion.div
          data-slot="deck-lift-sheet"
          inert={open}
          aria-hidden={open || undefined}
          initial={false}
          animate={{ y: open ? "100%" : "0%" }}
          transition={stageSpring}
          className={cn(
            "absolute inset-x-0 bottom-0 z-30 mx-auto w-full rounded-t-[1.75rem] border-t bg-background shadow-xl @2xl:max-w-2xl @2xl:rounded-t-[2rem] @2xl:border-x @5xl:max-w-3xl",
            sheetClassName,
          )}
        >
          {sheet}
        </motion.div>
      ) : null}
    </div>
  );
}
