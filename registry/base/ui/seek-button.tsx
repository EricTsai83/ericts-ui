"use client";

import * as React from "react";
import {
  animate,
  motion,
  useMotionValue,
  type Transition,
} from "motion/react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

// The glyph is drawn in the same 36-unit box `play-button` uses, so a seek
// button and a play button line up stroke-for-stroke in one transport bar.
const ICON_VIEW_BOX = 36;
const CENTER = ICON_VIEW_BOX / 2;
const RING_RADIUS = 13;
/**
 * The ring stops short of a full turn; the gap is where the arrowhead leads.
 * Wide enough that the head and the ring's tail read as two ends of one arrow
 * rather than a stroke that merely thickens.
 */
const RING_GAP_DEGREES = 40;
/** How far the head reaches back over the stroke, so the two read as one arrow. */
const ARROW_OVERLAP = 2.4;
const ARROW_LENGTH = 6.6;
const ARROW_HALF_HEIGHT = 3.7;

function round(value: number) {
  return Math.round(value * 100) / 100;
}

/** Degrees run clockwise from the top of the ring, which is where it ends. */
function ringPoint(degrees: number) {
  const radians = (degrees * Math.PI) / 180;

  return [
    round(CENTER + RING_RADIUS * Math.sin(radians)),
    round(CENTER - RING_RADIUS * Math.cos(radians)),
  ] as const;
}

const [RING_START_X, RING_START_Y] = ringPoint(RING_GAP_DEGREES);
const RING_END_Y = CENTER - RING_RADIUS;
// Sweeping clockwise past 180° means both arc flags are set.
const RING_PATH = `M ${RING_START_X} ${RING_START_Y} A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${CENTER} ${RING_END_Y}`;

const ARROW_BASE_X = CENTER - ARROW_OVERLAP;
const ARROW_PATH = [
  `M ${ARROW_BASE_X} ${round(RING_END_Y - ARROW_HALF_HEIGHT)}`,
  `L ${round(ARROW_BASE_X + ARROW_LENGTH)} ${RING_END_Y}`,
  `L ${ARROW_BASE_X} ${round(RING_END_Y + ARROW_HALF_HEIGHT)}`,
  "Z",
].join(" ");

// A press must read as exactly one turn, and the turn is the whole point of
// the control, so it is paced to be watched rather than to get out of the way.
// 400ms lands as the finger lifts: quick enough that a burst of taps stays one
// continuous spin, slow enough to see the arrow come back round.
//
// The curve carries more of that budget than the duration does. It leaves
// promptly, spends the middle of the ramp on the middle of the rotation, and
// settles; a steep ease-out at the same duration would put two thirds of the
// turn in the first few frames, which reads as a flicker rather than a turn.
const SPIN_TRANSITION: Transition = {
  duration: 0.4,
  ease: [0.45, 0.25, 0.2, 1],
};

const TURN_DEGREES = 360;

// Matches `play-button`: a 24px glyph inside a 40px surface, expressed as a
// ratio so overriding `--seek-button-size` scales both.
const SURFACE_SIZE = 40;
const ICON_SIZE = 24;
const ICON_RATIO = `${(ICON_SIZE / SURFACE_SIZE) * 100}%`;

const AMOUNT_FONT_SIZE = 12;
/** Three digits or more have to shrink to clear the ring's inner edge. */
const AMOUNT_FONT_SIZE_WIDE = 9;

export type SeekDirection = "forward" | "backward";
export type SeekSurface = "ghost" | "glass" | "frosted";

/**
 * `glass` is the default because a skip control is read at a glance, usually
 * over artwork or video: it needs a hit target you can see before you reach for
 * it. All three are built from `currentColor` and theme tokens, so the glyph
 * stays readable on whatever sits behind them.
 *
 * The glass is a stack of layers rather than one translucent fill, because that
 * is what makes a pane read as a *solid* with thickness instead of a tinted
 * hole. From the back: the backdrop filter blurs and re-saturates the page
 * behind the disc; a scrim the colour of the page thins it out; a lens ring
 * blurs the rim harder than the middle, the way a thick edge bends what passes
 * through it; a fixed sheen lays a specular across the surface; and the shadow
 * stack lights the top edge, catches the bottom one, and drops the disc onto
 * the page.
 *
 * The scrim follows the environment the way an iOS material does, but it is not
 * the same colour in both themes, because a material lets light *through*: on a
 * light page it thins the backdrop towards the page (`background`), and on a
 * dark one it has to lift it instead (`foreground`). Scrimming a dark page with
 * more dark is what makes glass read as a smudge — nothing separates the disc
 * from the page, the black inner shade and drop shadow land invisible, and the
 * specular is left carrying the whole shape as a grey fog. Lifting instead puts
 * the pane in front of the page again, which is also why the sheen can come
 * down in the dark: it no longer has to do the separating on its own.
 *
 * The speculars stay light in both themes, since a highlight is a reflection of
 * the room rather than a colour of the surface. `frosted` pins the scrim to the
 * player's fixed on-video palette and keeps the rest.
 */
/**
 * Five layers of light, written out in order so the stack can be read as one
 * thing: specular on the top edge, a catch-light on the bottom one, the pane's
 * own thickness shading its underside, then a contact shadow and a wide ambient
 * one. The ambient is deliberately broad and weak — a tight, strong drop shadow
 * rings the disc like a dark halo instead of lifting it off the page.
 *
 * These are achromatic on purpose and therefore literal: a highlight is white
 * and a shadow is black in every theme, so routing them through theme variables
 * would only add globals a consumer must not touch, and lose the whole stack
 * for anyone who copies this file by hand instead of installing it.
 */
const GLASS_SHADOW =
  "shadow-[inset_0_1px_1px_-0.5px_oklch(1_0_0_/_55%),inset_0_-1.5px_1px_-1px_oklch(1_0_0_/_30%),inset_0_-6px_12px_-8px_oklch(0_0_0_/_12%),0_2px_10px_-6px_oklch(0_0_0_/_7%),0_10px_40px_-16px_oklch(0_0_0_/_16%)]";

const SURFACE_CLASSES: Record<SeekSurface, string> = {
  ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
  glass: `bg-background/25 backdrop-blur-md backdrop-saturate-150 inset-ring-1 inset-ring-foreground/12 hover:bg-background/40 dark:bg-foreground/10 dark:inset-ring-foreground/20 dark:hover:bg-foreground/16 ${GLASS_SHADOW}`,
  frosted: `bg-ericts-media-control/30 text-ericts-media-control-foreground backdrop-blur-[16px] backdrop-saturate-150 inset-ring-1 inset-ring-ericts-media-control-foreground/20 hover:bg-ericts-media-control/45 ${GLASS_SHADOW}`,
};

/**
 * Masks the lens ring to the rim: the middle of the disc keeps the surface's
 * own blur, and only the outer band gets the second pass.
 */
const LENS_MASK =
  "radial-gradient(closest-side, transparent 58%, currentColor 96%)";

/**
 * Two specular arcs, a bright one and a faint one, on opposite sides of the
 * disc. Off-axis (`from 140deg`) so neither lands square on the glyph.
 *
 * It does not move. The pane is bolted to the page, so the light on it is too —
 * only the glyph behind the glass turns. An earlier version drifted the sheen
 * with the spin at a fraction of its speed, for parallax; what it actually read
 * as was the whole button rotating, which is the one thing a fixed surface must
 * never look like it is doing.
 */
const SHEEN_GRADIENT =
  "conic-gradient(from 140deg, transparent 0deg, oklch(1 0 0 / 55%) 55deg, transparent 140deg, transparent 215deg, oklch(1 0 0 / 30%) 285deg, transparent 350deg)";

/**
 * Rotation the glyph should animate to for the next press. Each press adds a
 * whole turn to the previous *target* rather than restarting from zero, so a
 * burst of taps keeps spinning from wherever the glyph currently is.
 */
export function nextSeekRotation(rotation: number, direction: SeekDirection) {
  return rotation + (direction === "backward" ? -TURN_DEGREES : TURN_DEGREES);
}

export type SeekIconProps = Omit<React.ComponentProps<"svg">, "children"> & {
  direction?: SeekDirection;
};

/** The default glyph: an open ring with an arrowhead at its leading end. */
export function SeekIcon({
  direction = "forward",
  className,
  ...props
}: SeekIconProps) {
  return (
    <svg
      viewBox={`0 0 ${ICON_VIEW_BOX} ${ICON_VIEW_BOX}`}
      fill="none"
      className={cn("stroke-current", className)}
      {...props}
    >
      {/* Backward is the same geometry mirrored, so the two directions cannot
          drift apart as the ring is tuned. */}
      <g
        transform={
          direction === "backward"
            ? `translate(${ICON_VIEW_BOX} 0) scale(-1 1)`
            : undefined
        }
      >
        <path d={RING_PATH} strokeWidth={2.5} strokeLinecap="round" />
        <path d={ARROW_PATH} className="fill-current" strokeWidth={0} />
      </g>
    </svg>
  );
}

export type SeekButtonProps = Omit<
  React.ComponentProps<"button">,
  "children"
> & {
  /** Which way the seek runs: the glyph, its spin, and `onSeek`'s sign all follow it. */
  direction?: SeekDirection;
  /** Seek amount in seconds, printed inside the ring and signed into `onSeek`. */
  seconds?: number;
  /** Print `seconds` inside the ring. Turn off when a custom icon carries its own. */
  showSeconds?: boolean;
  /** Replaces the default ring glyph. Whatever is passed spins on press. */
  icon?: React.ReactNode;
  /** Called with the signed offset in seconds: `+seconds` forward, `-seconds` back. */
  onSeek?: (seconds: number) => void;
  /** Diameter in px, also published as `--seek-button-size` for CSS overrides. */
  size?: number;
  /** `glass` is a translucent disc, `ghost` is bare, `frosted` is over-video glass. */
  surface?: SeekSurface;
  /** Transition for the one-turn spin. */
  transition?: Transition;
};

export function SeekButton({
  direction = "forward",
  seconds = 10,
  showSeconds = true,
  icon,
  onSeek,
  size = SURFACE_SIZE,
  surface = "glass",
  transition = SPIN_TRANSITION,
  className,
  style,
  type = "button",
  disabled,
  onClick,
  "aria-label": ariaLabel,
  ...props
}: SeekButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const rotation = useMotionValue(0);
  // The target is tracked apart from the motion value: mid-spin the value sits
  // between turns, and stacking the next press on it would cut the turn short.
  const targetRotation = React.useRef(0);
  const spinRef = React.useRef<ReturnType<typeof animate> | null>(null);

  React.useEffect(() => () => spinRef.current?.stop(), []);

  React.useEffect(() => {
    if (!shouldReduceMotion) return;
    spinRef.current?.stop();
    spinRef.current = null;
    targetRotation.current = 0;
    rotation.set(0);
  }, [shouldReduceMotion, rotation]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented || disabled) return;

      if (!shouldReduceMotion) {
        targetRotation.current = nextSeekRotation(
          targetRotation.current,
          direction,
        );
        spinRef.current?.stop();
        spinRef.current = animate(rotation, targetRotation.current, transition);
      }

      onSeek?.(direction === "backward" ? -seconds : seconds);
    },
    [
      direction,
      disabled,
      onClick,
      onSeek,
      rotation,
      seconds,
      shouldReduceMotion,
      transition,
    ],
  );

  const amount = String(seconds);
  const glass = surface !== "ghost";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      aria-label={
        ariaLabel ??
        `${direction === "backward" ? "Back" : "Forward"} ${amount} seconds`
      }
      data-slot="seek-button"
      data-direction={direction}
      style={{
        ["--seek-button-size" as string]: `${size}px`,
        width: "var(--seek-button-size)",
        height: "var(--seek-button-size)",
        ...style,
      }}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full outline-none",
        // Hover tint and press scale share one short ease-out, so the button
        // answers the pointer before the spin has visibly started.
        "transition-[background-color,transform] duration-100 ease-out",
        "active:scale-[0.94] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        SURFACE_CLASSES[surface],
        className,
      )}
      {...props}
    >
      {glass ? (
        <>
          <span
            aria-hidden
            data-slot="seek-button-lens"
            className="pointer-events-none absolute inset-0 rounded-full backdrop-blur-[5px]"
            style={{ maskImage: LENS_MASK, WebkitMaskImage: LENS_MASK }}
          />
          <span
            aria-hidden
            data-slot="seek-button-sheen"
            className="pointer-events-none absolute inset-0 rounded-full opacity-55 dark:opacity-40"
            style={{ backgroundImage: SHEEN_GRADIENT }}
          />
        </>
      ) : null}
      <motion.span
        aria-hidden
        data-slot="seek-button-icon"
        className="col-start-1 row-start-1 grid place-items-center [&>svg]:size-full"
        style={{
          width: ICON_RATIO,
          height: ICON_RATIO,
          rotate: rotation,
        }}
      >
        {icon ?? <SeekIcon direction={direction} />}
      </motion.span>
      {showSeconds ? (
        // Outside the spinning element on purpose: the ring turns, the number
        // it is turning by stays upright and readable the whole way round.
        <svg
          aria-hidden
          data-slot="seek-button-seconds"
          viewBox={`0 0 ${ICON_VIEW_BOX} ${ICON_VIEW_BOX}`}
          className="pointer-events-none col-start-1 row-start-1 fill-current font-semibold tabular-nums"
          style={{ width: ICON_RATIO, height: ICON_RATIO }}
        >
          <text
            x={CENTER}
            y={CENTER}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={
              amount.length > 2 ? AMOUNT_FONT_SIZE_WIDE : AMOUNT_FONT_SIZE
            }
          >
            {amount}
          </text>
        </svg>
      ) : null}
    </button>
  );
}
