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

export type CardLiftItem = {
  /** Stable identity, also the value reported by `onValueChange`. */
  id: string;
  /** Accessible name for the card, used by its trigger and its detail panel. */
  label: string;
  /** The card face. The same node travels from the deck to the docked row. */
  face: React.ReactNode;
  /** What fills the page below the deck while this card is the active one. */
  detail: React.ReactNode;
};

export type CardLiftProps = Omit<
  React.ComponentProps<"div">,
  "children" | "defaultValue" | "onChange"
> & {
  items: readonly CardLiftItem[];
  /** The page the deck rests on. It is covered, never unmounted, while open. */
  children?: React.ReactNode;
  /** Raised sheet layered over the resting deck; it drops away as a card opens. */
  sheet?: React.ReactNode;
  /** Controlled open card id, or `null` for the resting deck. */
  value?: string | null;
  /** Initial open card id when uncontrolled. Defaults to `null` (resting). */
  defaultValue?: string | null;
  onValueChange?: (id: string | null, item: CardLiftItem | null) => void;
  /**
   * How many cards the resting pile shows. Cards past the last slot stack
   * exactly on it, so a wallet can hold many while the page stays quiet — the
   * deck is a pile, not a list of everything you own. Defaults to 2.
   */
  pileSize?: number;
  /** Accessible name for the docked deck, which is a tab list once open. */
  deckLabel?: string;
  closeLabel?: string;
  pageClassName?: string;
  sheetClassName?: string;
  deckClassName?: string;
  cardClassName?: string;
  detailClassName?: string;
};

/** Where the deck's top edge rests, as a share of the stage height. */
const REST_TOP_RATIO = 0.56;
/** Distance from the stage top to the docked deck, leaving room for the close row. */
const DOCK_INSET_TOP = 56;
/**
 * How far each card behind the front one rises out of the resting deck. Cards
 * peek *upward*: a wallet is read from its top edges, and anything peeking below
 * the front card would sit behind the sheet, which is exactly where it stops
 * being a stack you can count.
 */
const STACK_OFFSET = 18;
const STACK_SCALE_STEP = 0.04;
/** Tilt of the front resting card; the deck straightens as it goes back. */
const REST_TILT = 2.5;
const REST_TILT_STEP = 1.2;
/**
 * Cards visible in the resting pile. Two is enough to say "there is more than
 * one card" without spending the page on a ladder of edges; the rest stack
 * exactly on the last slot, which — unlike hiding them — keeps every card
 * present and reachable by keyboard.
 */
const DEFAULT_PILE_SIZE = 2;
/** Gap between docked cards, and between the docked deck and the detail. */
const CARD_GAP = 10;
const DETAIL_GAP = 24;
/** Docked cards other than the active one sit back just enough to read as next. */
const DOCKED_NEIGHBOUR_SCALE = 0.96;
/** Fraction of a card's travel a drag must reach before it changes the active card. */
const SNAP_THRESHOLD = 0.24;
/** Seconds of flick velocity folded into the drag's travel. */
const VELOCITY_PROJECTION = 0.12;

const STAGE_TRANSITION = {
  type: "spring",
  duration: 0.58,
  bounce: 0.16,
} as const;
const SNAP_TRANSITION = {
  type: "spring",
  duration: 0.42,
  bounce: 0.12,
} as const;
const DETAIL_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
} as const;
const INSTANT = { duration: 0 } as const;

const detailVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 24,
  }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -24,
  }),
};

/**
 * A phone-scale app screen in three layers: a page of summary values, a raised
 * sheet, and a deck of cards resting between them. Opening a card lifts the
 * whole deck to the top of the screen, drops the sheet away, and pulls a full
 * page of detail up behind the cards — which then behave as a swipeable row,
 * each one showing its own detail below.
 *
 * Why this exists: "tap a card, see its detail" is usually built as a dialog
 * floating over a dimmed page, which reads as *something arrived on top of the
 * screen*. Here the card the finger touched is the same element that ends up
 * docked at the top — nothing cross-fades, nothing is re-created — so the move
 * reads as *this screen became that card's screen*. The cover surface rides up
 * behind the cards on the same spring, so the summary values are wiped away by
 * the motion the eye is already following rather than by a scrim.
 *
 * @example
 *   <CardLift
 *     items={[{ id: "virtual", label: "Virtual card", face: <Face />, detail: <Detail /> }]}
 *     sheet={<SheetContent />}
 *     className="h-[40rem] w-[26rem]"
 *   >
 *     <Dashboard />
 *   </CardLift>
 *
 * Notes:
 * - The stage is the block's own box, not the viewport: give it `h-dvh` for a
 *   real screen, or any fixed box to embed it. Everything is clipped to it.
 * - At rest the cards are a pile: each one behind the front card rises a little,
 *   shrinks a little, and straightens a little, so the deck reads as a stack
 *   rather than one card. `pileSize` caps how many of them show — a wallet of
 *   ten cards should not cost ten edges of vertical space. The ones past the cap
 *   are absent while it rests (`inert`, so they are not stray tab stops) and
 *   appear on the first frame of the lift, riding up with the rest of the deck
 *   into the swipeable row. Give the cards a shadow through
 *   `cardClassName`: the block draws no surface of its own, and without one the
 *   layers merge.
 * - Card width is the `--card-lift-card-width` custom property (default
 *   `min(19.5rem, calc(100% - 4.5rem))`), so overriding it moves the docked row,
 *   the swipe step, and the detail offset together — they are all measured
 *   from the rendered card rather than restated.
 * - The layers below the open cover are `inert`, which contains focus without a
 *   hand-written trap. Because a card is one element in both states, focus stays
 *   on whatever the user pressed; only Escape has to put it back.
 * - `prefers-reduced-motion` keeps every position and the swap, and drops only
 *   the travel between them.
 */
export function CardLift({
  items,
  children,
  sheet,
  value,
  defaultValue = null,
  onValueChange,
  pileSize = DEFAULT_PILE_SIZE,
  deckLabel = "Cards",
  closeLabel = "Back",
  className,
  style,
  ref,
  pageClassName,
  sheetClassName,
  deckClassName,
  cardClassName,
  detailClassName,
  ...props
}: CardLiftProps) {
  const shouldReduceMotion = useReducedMotion() === true;
  const reactId = React.useId();
  const panelId = `${reactId}-panel`;
  const cardId = (id: string) => `${reactId}-card-${id}`;
  const { setMeasureRef, sizes } = useElementSizeMap<HTMLElement>();
  const cardNodes = React.useRef(new Map<string, HTMLButtonElement>());
  const draggedRef = React.useRef(false);

  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | null
  >(defaultValue);
  const requestedId = isControlled ? value : uncontrolledValue;
  const openItem = items.find((item) => item.id === requestedId) ?? null;
  const openId = openItem?.id ?? null;
  const open = openId !== null;

  // The detail keeps showing the card that was open while the cover slides away,
  // so closing never blanks the page mid-flight.
  const [activeId, setActiveId] = React.useState(
    () => openId ?? items[0]?.id ?? "",
  );

  if (openId !== null && openId !== activeId) {
    setActiveId(openId);
  }

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );
  const activeItem = items[activeIndex];

  // Direction of the last change, so the detail leaves the way the deck moved.
  const [swapState, setSwapState] = React.useState({
    index: activeIndex,
    direction: 1,
  });
  let direction = swapState.direction;

  if (swapState.index !== activeIndex) {
    direction = activeIndex > swapState.index ? 1 : -1;
    setSwapState({ index: activeIndex, direction });
  }

  const stageHeight = sizes.stage?.height ?? 0;
  const cardWidth = sizes.card?.width ?? 0;
  const cardHeight = sizes.card?.height ?? 0;
  const step = cardWidth + CARD_GAP;
  const dockY = stageHeight
    ? DOCK_INSET_TOP - REST_TOP_RATIO * stageHeight
    : 0;
  const deckClearance = cardHeight + DETAIL_GAP;
  const deepestSlot = Math.max(0, Math.floor(pileSize) - 1);

  // The deck's x is a motion value rather than an `animate` target because a
  // drag writes to the same value: after a drag that changes nothing, the
  // `animate` prop has no new target to re-apply, and `dragSnapToOrigin` would
  // return the deck to its *layout* origin — the first card — instead of the
  // card the user was looking at.
  const deckX = useMotionValue(0);
  const deckTarget = open ? -activeIndex * step : 0;
  const deckTargetRef = React.useRef(deckTarget);

  React.useEffect(() => {
    deckTargetRef.current = deckTarget;

    const controls = animate(
      deckX,
      deckTarget,
      shouldReduceMotion ? INSTANT : SNAP_TRANSITION,
    );

    return () => controls.stop();
  }, [deckTarget, deckX, shouldReduceMotion]);

  const settleDeck = React.useCallback(() => {
    animate(
      deckX,
      deckTargetRef.current,
      shouldReduceMotion ? INSTANT : SNAP_TRANSITION,
    );
  }, [deckX, shouldReduceMotion]);

  const stageTransition = shouldReduceMotion ? INSTANT : STAGE_TRANSITION;
  const detailTransition = shouldReduceMotion ? INSTANT : DETAIL_TRANSITION;
  const swapDirection = shouldReduceMotion ? 0 : direction;

  const setOpenValue = React.useCallback(
    (nextId: string | null) => {
      const nextItem = items.find((item) => item.id === nextId) ?? null;

      if (!isControlled) {
        setUncontrolledValue(nextItem?.id ?? null);
      }

      onValueChange?.(nextItem?.id ?? null, nextItem);
    },
    [isControlled, items, onValueChange],
  );

  const close = React.useCallback(() => {
    // The open card is the element the user pressed to get here, so returning
    // focus to it is the only focus move this component makes.
    cardNodes.current.get(activeId)?.focus();
    setOpenValue(null);
  }, [activeId, setOpenValue]);

  const closeRef = React.useRef(close);

  React.useEffect(() => {
    closeRef.current = close;
  });

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const selectIndex = React.useCallback(
    (nextIndex: number, focus = false) => {
      const nextItem = items[Math.min(Math.max(nextIndex, 0), items.length - 1)];

      if (!nextItem || nextItem.id === activeId) return;

      setOpenValue(nextItem.id);

      if (focus) {
        cardNodes.current.get(nextItem.id)?.focus();
      }
    },
    [activeId, items, setOpenValue],
  );

  const handleCardClick = (item: CardLiftItem, index: number) => {
    if (draggedRef.current) return;

    if (!open) {
      setOpenValue(item.id);
      return;
    }

    selectIndex(index);
  };

  const handleDeckKeyDown = (event: React.KeyboardEvent) => {
    if (!open) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectIndex(activeIndex + 1, true);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectIndex(activeIndex - 1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectIndex(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      selectIndex(items.length - 1, true);
    }
  };

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    const travel = info.offset.x + info.velocity.x * VELOCITY_PROJECTION;
    const traveledCards = step ? travel / step : 0;
    // Dragging right reveals the card before the active one.
    const towards = traveledCards > 0 ? -1 : 1;
    const distance = Math.max(1, Math.round(Math.abs(traveledCards)));
    const nextIndex = Math.min(
      Math.max(activeIndex + towards * distance, 0),
      items.length - 1,
    );

    // Too short to commit, or already at the end of the row: put the deck back
    // where it was. Nothing else will — the target has not changed.
    if (Math.abs(traveledCards) < SNAP_THRESHOLD || nextIndex === activeIndex) {
      settleDeck();
      return;
    }

    selectIndex(nextIndex);
  };

  const setStageRef = React.useCallback(
    (node: HTMLDivElement | null) => {
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
      data-slot="card-lift"
      data-state={open ? "open" : "closed"}
      className={cn(
        // `clip` rather than `hidden`: a scroll container would let the browser
        // scroll a focused card into view, dragging every layer with it.
        "relative isolate overflow-clip bg-background",
        className,
      )}
      style={
        {
          "--card-lift-card-width": "min(19.5rem, calc(100% - 4.5rem))",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        data-slot="card-lift-page"
        inert={open}
        aria-hidden={open || undefined}
        className={cn("absolute inset-0 z-0", pageClassName)}
      >
        {children}
      </div>

      <motion.div
        data-slot="card-lift-cover"
        inert={!open}
        aria-hidden={open ? undefined : true}
        initial={false}
        animate={{ y: open ? "0%" : "100%" }}
        transition={stageTransition}
        className="absolute inset-0 z-10 flex flex-col bg-background"
      >
        <div className="flex shrink-0 items-center px-3" style={{ height: DOCK_INSET_TOP }}>
          <button
            type="button"
            onClick={close}
            className="inline-flex size-8 items-center justify-center rounded-full border bg-background/80 text-muted-foreground backdrop-blur-sm outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            <span className="sr-only">{closeLabel}</span>
          </button>
        </div>

        {/* The deck floats in its own layer, so the detail starts below it. */}
        <div
          aria-hidden="true"
          className="shrink-0"
          style={{ height: deckClearance }}
        />

        <div
          id={panelId}
          role={open ? "tabpanel" : undefined}
          aria-labelledby={
            open && activeItem ? cardId(activeItem.id) : undefined
          }
          data-slot="card-lift-detail"
          className={cn(
            "flex min-h-0 flex-1 flex-col py-2",
            detailClassName,
          )}
        >
          {/* Padding lives on this frame, never on the scroller, so it stays put
              while the detail scrolls under it. */}
          <div className="min-h-0 flex-1 overflow-x-clip overflow-y-auto">
            <AnimatePresence
              initial={false}
              mode="popLayout"
              custom={swapDirection}
            >
              {activeItem ? (
                <motion.div
                  key={activeItem.id}
                  custom={swapDirection}
                  variants={detailVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={detailTransition}
                >
                  {activeItem.detail}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {sheet ? (
        <motion.div
          data-slot="card-lift-sheet"
          inert={open}
          aria-hidden={open || undefined}
          initial={false}
          animate={{ y: open ? "100%" : "0%" }}
          transition={stageTransition}
          className={cn(
            "absolute inset-x-0 bottom-0 z-30 rounded-t-[1.75rem] border-t bg-background shadow-xl",
            sheetClassName,
          )}
        >
          {sheet}
        </motion.div>
      ) : null}

      <motion.div
        data-slot="card-lift-deck"
        role={open ? "tablist" : undefined}
        aria-label={open ? deckLabel : undefined}
        aria-orientation={open ? "horizontal" : undefined}
        drag={open && items.length > 1 ? "x" : false}
        dragElastic={0.12}
        dragMomentum={false}
        dragConstraints={{
          left: -(items.length - 1) * step,
          right: 0,
        }}
        onPointerDownCapture={() => {
          draggedRef.current = false;
        }}
        onDragStart={() => {
          draggedRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        onKeyDown={handleDeckKeyDown}
        initial={false}
        style={{ x: deckX, top: `${REST_TOP_RATIO * 100}%` }}
        className={cn(
          "pointer-events-none absolute inset-x-0 z-20 grid justify-items-center",
          deckClassName,
        )}
      >
        {items.map((item, index) => {
          const distance = index - activeIndex;
          const depth = Math.min(index, deepestSlot);
          const isActive = open && item.id === activeId;
          // Cards past the pile are not in the room at all while it rests: they
          // wait on the last slot and appear as the deck lifts, so the wallet
          // costs two cards of space and still opens into all of them.
          const restingOutOfPile = !open && index > deepestSlot;

          return (
            <motion.button
              key={item.id}
              id={cardId(item.id)}
              ref={(node) => {
                if (node) {
                  cardNodes.current.set(item.id, node);
                } else {
                  cardNodes.current.delete(item.id);
                }

                if (index === 0) {
                  setMeasureRef("card")(node);
                }
              }}
              type="button"
              aria-label={item.label}
              role={open ? "tab" : undefined}
              aria-selected={open ? isActive : undefined}
              aria-controls={open ? panelId : undefined}
              aria-expanded={open ? undefined : false}
              tabIndex={open && !isActive ? -1 : 0}
              inert={restingOutOfPile}
              data-slot="card-lift-card"
              data-active={isActive || undefined}
              onClick={() => handleCardClick(item, index)}
              initial={false}
              animate={{
                x: open ? index * step : 0,
                y: open ? dockY : -depth * STACK_OFFSET,
                rotate: open ? 0 : -REST_TILT + depth * REST_TILT_STEP,
                scale: open
                  ? isActive
                    ? 1
                    : DOCKED_NEIGHBOUR_SCALE
                  : 1 - depth * STACK_SCALE_STEP,
                opacity: restingOutOfPile ? 0 : 1,
              }}
              transition={{
                ...stageTransition,
                // Arriving cards are there from the first frame of the lift;
                // leaving ones only fade once they are back on the pile, so the
                // pile never looks like it is dissolving.
                opacity: shouldReduceMotion
                  ? INSTANT
                  : open
                    ? { duration: 0.12 }
                    : { duration: 0.2, delay: 0.18 },
              }}
              style={{
                zIndex: open
                  ? items.length - Math.abs(distance)
                  : items.length - index,
                touchAction: open ? "pan-y" : undefined,
              }}
              className={cn(
                "pointer-events-auto aspect-[1.586/1] w-(--card-lift-card-width) overflow-hidden rounded-2xl text-left outline-none [grid-area:1/1] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                cardClassName,
              )}
            >
              {item.face}
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
