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
  detailGap: 24,
  /** How far back the cards either side of the active one sit. */
  neighbour: 0.96,
} as const;

/** The swipe between docked cards. */
const SWIPE = {
  /** Share of a card's width a drag must cover before it commits. */
  threshold: 0.24,
  /** Seconds of flick velocity folded into the drag's travel. */
  velocity: 0.12,
  elastic: 0.12,
} as const;

const SPRING = {
  /** The lift. Deck, cover and sheet all ride this one spring. */
  stage: { type: "spring", duration: 0.58, bounce: 0.16 },
  /** The shorter snap between docked cards. */
  snap: { type: "spring", duration: 0.42, bounce: 0.12 },
  detail: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
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
 * fans up and back; the docked row lays the same cards out sideways; cards past
 * the pile wait invisibly on its last slot until the lift starts.
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
    return {
      x: index * step,
      y: dockY,
      rotate: 0,
      scale: index === activeIndex ? 1 : DOCK.neighbour,
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
 * to commit. Travel is the finger's distance plus a slice of its parting speed,
 * so a flick that barely moves still commits and one long drag can cross more
 * than one card. Exported because this is the block's only arithmetic that a
 * gesture cannot be trusted to exercise by hand.
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
  const cards = step ? (offsetX + velocityX * SWIPE.velocity) / step : 0;

  if (Math.abs(cards) < SWIPE.threshold) return activeIndex;

  // Dragging right reveals the card before the active one.
  const towards = cards > 0 ? -1 : 1;
  const reach = Math.max(1, Math.round(Math.abs(cards)));

  return Math.min(Math.max(activeIndex + towards * reach, 0), count - 1);
}

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

const detailVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -24 }),
};

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
  const cardId = (id: string) => `${reactId}-card-${id}`;
  const { setMeasureRef, sizes } = useElementSizeMap<HTMLElement>();
  const cardNodes = React.useRef(new Map<string, HTMLButtonElement>());
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

  const stageHeight = sizes.stage?.height ?? 0;
  const cardHeight = sizes.card?.height ?? 0;
  const step = (sizes.card?.width ?? 0) + DOCK.gap;
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
  const direction = reduceMotion ? 0 : detail.direction;

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

      if (focus) cardNodes.current.get(next.id)?.focus();
    },
    [detail.id, items, setOpenValue],
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
    cardNodes.current.get(detail.id)?.focus();
    setOpenValue(null);
  }, [detail.id, setOpenValue]);

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
    // Every release settles the deck, not only an uncommitted one: a controlled
    // parent is free to leave `value` alone, and then no new target ever arrives
    // to pull the deck off the offset the finger left it at. When the parent
    // does commit, `select` retargets in the same flush and this is absorbed.
    animate(deckX, deckTargetRef.current, snapSpring);

    select(
      deckLiftSwipeTarget({
        offsetX: info.offset.x,
        velocityX: info.velocity.x,
        step,
        activeIndex,
        count: items.length,
      }),
    );

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

      {/* The deck: a pile at rest, a swipeable row once open. */}
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
        className="pointer-events-none absolute inset-x-0 z-20 grid justify-items-center"
      >
        {items.map((item, index) => {
          const active = open && item.id === detail.id;
          const waiting = !open && index > deepestSlot;

          return (
            <motion.button
              key={item.id}
              id={cardId(item.id)}
              ref={(node) => {
                if (node) cardNodes.current.set(item.id, node);
                else cardNodes.current.delete(item.id);
                // The deck's geometry is read off the first rendered card.
                if (index === 0) setMeasureRef("card")(node);
              }}
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
              <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                {activeItem ? (
                  <motion.div
                    key={activeItem.id}
                    custom={direction}
                    variants={detailVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={reduceMotion ? SPRING.fade : SPRING.detail}
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
