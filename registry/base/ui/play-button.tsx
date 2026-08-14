"use client";

import * as React from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type Transition,
} from "motion/react";

import { cn } from "@/lib/utils";

// YouTube's play button is one `<path>` whose `d` is rewritten frame by frame,
// and the shape of that data is the whole trick: the play triangle is split
// down x=17 into two sub-paths, each written as a four-corner rounded quad.
// The pause icon is the same two quads with different corners, so the morph is
// a straight lerp of eight points instead of a path diff — the triangle's left
// half straightens into the first bar while its tip unfolds into the second.
//
// The play numbers below are recovered from the player's own path data: the
// corner vertices sit at (7.5, 3) / (7.5, 33) with a 3.93 tangent length, and
// the tip is a degenerate corner pair at (33, 18).

const ICON_VIEW_BOX = 36;
const EPSILON = 1e-4;

type Point = readonly [number, number];
type Corner = { readonly point: Point; readonly radius: number };
/** Corners run top-left → bottom-left → bottom-right → top-right. */
type Shape = readonly Corner[];

const PLAY_SHAPES: readonly [Shape, Shape] = [
  [
    { point: [7.5, 3], radius: 3.93 },
    { point: [7.5, 33], radius: 3.93 },
    { point: [17, 27.4], radius: 0 },
    { point: [17, 8.6], radius: 0 },
  ],
  [
    { point: [17, 8.6], radius: 0 },
    { point: [17, 27.4], radius: 0 },
    { point: [33, 18], radius: 0 },
    { point: [33, 18], radius: 0 },
  ],
];

const PAUSE_SHAPES: readonly [Shape, Shape] = [
  [
    { point: [8.5, 4.5], radius: 2.5 },
    { point: [8.5, 31.5], radius: 2.5 },
    { point: [15.5, 31.5], radius: 2.5 },
    { point: [15.5, 4.5], radius: 2.5 },
  ],
  [
    { point: [20.5, 4.5], radius: 2.5 },
    { point: [20.5, 31.5], radius: 2.5 },
    { point: [27.5, 31.5], radius: 2.5 },
    { point: [27.5, 4.5], radius: 2.5 },
  ],
];

// A morph is only a lerp while both icons keep the same corner count.
if (
  process.env.NODE_ENV !== "production" &&
  PLAY_SHAPES.some((shape, index) => shape.length !== PAUSE_SHAPES[index].length)
) {
  throw new Error("play-button: play and pause shapes must share a corner count.");
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function coords([x, y]: Point) {
  return `${round(x)} ${round(y)}`;
}

/**
 * Offset, as a fraction of the tangent length, that turns a corner fillet into
 * a true circular arc. `interior` is the angle between the two edges meeting at
 * the corner; the player's own control points fall out of this exactly.
 */
function arcControlFraction(interior: number) {
  return (
    1 -
    (4 / 3) * Math.tan((Math.PI - interior) / 4) * Math.tan(interior / 2)
  );
}

type Fillet = {
  entry: Point;
  control1: Point;
  control2: Point;
  exit: Point;
};

function filletCorner(previous: Point, corner: Corner, next: Point): Fillet {
  const [vx, vy] = corner.point;
  const inX = previous[0] - vx;
  const inY = previous[1] - vy;
  const outX = next[0] - vx;
  const outY = next[1] - vy;
  const inLength = Math.hypot(inX, inY);
  const outLength = Math.hypot(outX, outY);
  // Neighbouring fillets must not overlap, and mid-morph an edge can collapse
  // to nothing (the play tip is two coincident corners), so clamp before use.
  const tangent = Math.min(corner.radius, inLength / 2, outLength / 2);
  const degenerate: Fillet = {
    entry: corner.point,
    control1: corner.point,
    control2: corner.point,
    exit: corner.point,
  };

  if (tangent <= EPSILON) return degenerate;

  const ux = inX / inLength;
  const uy = inY / inLength;
  const wx = outX / outLength;
  const wy = outY / outLength;
  const interior = Math.acos(Math.min(1, Math.max(-1, ux * wx + uy * wy)));

  // Folded back on itself, or straight through: no corner left to round.
  if (interior <= EPSILON || interior >= Math.PI - EPSILON) return degenerate;

  const pull = tangent * arcControlFraction(interior);

  return {
    entry: [vx + ux * tangent, vy + uy * tangent],
    control1: [vx + ux * pull, vy + uy * pull],
    control2: [vx + wx * pull, vy + wy * pull],
    exit: [vx + wx * tangent, vy + wy * tangent],
  };
}

function shapeToPath(shape: Shape) {
  const count = shape.length;
  const fillets = shape.map((corner, index) =>
    filletCorner(
      shape[(index + count - 1) % count].point,
      corner,
      shape[(index + 1) % count].point,
    ),
  );

  let path = `M ${coords(fillets[count - 1].exit)}`;

  for (const fillet of fillets) {
    path += ` L ${coords(fillet.entry)} C ${coords(fillet.control1)} ${coords(
      fillet.control2,
    )} ${coords(fillet.exit)}`;
  }

  return `${path} Z`;
}

function lerpShape(from: Shape, to: Shape, progress: number): Shape {
  return from.map((corner, index) => ({
    point: [
      lerp(corner.point[0], to[index].point[0], progress),
      lerp(corner.point[1], to[index].point[1], progress),
    ] as Point,
    radius: lerp(corner.radius, to[index].radius, progress),
  }));
}

/** `0` draws the play triangle, `1` draws the pause bars. */
export function playPauseIconPath(progress: number) {
  const clamped = Math.min(1, Math.max(0, progress));

  return PLAY_SHAPES.map((shape, index) =>
    shapeToPath(lerpShape(shape, PAUSE_SHAPES[index], clamped)),
  ).join(" ");
}

// The glyph is already on screen and changes shape in place, so it eases in and
// out rather than out-only. 200ms is long enough to read the unfold and short
// enough to stay under the press.
const MORPH_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.65, 0, 0.35, 1],
};

// The player's bezel: a disc that leaves the button on every toggle. It exits,
// so it eases out, and it runs past the 300ms UI ceiling on purpose — nothing
// waits on it, and cutting it short reads as a flicker instead of a pulse.
//
// It has to ramp in over the first frames instead of arriving at full strength.
// On the ghost surface the disc is currentColor against the page, so appearing
// at peak in a single frame reads as a flash rather than a ripple.
const PULSE_PEAK_OPACITY = 0.14;
const PULSE_RAMP = 0.08;

const PULSE_TRANSITION: Transition = {
  duration: 0.5,
  ease: [0.16, 1, 0.3, 1],
  times: [0, PULSE_RAMP, 1],
};

// Matches the expanding slider's control box: a 24px glyph in a 40px surface.
// The icon is sized as a ratio so overriding `--play-button-size` scales both.
const SURFACE_SIZE = 40;
const ICON_SIZE = 24;
const ICON_RATIO = `${(ICON_SIZE / SURFACE_SIZE) * 100}%`;

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export type PlayButtonProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "aria-label" | "children"
> & {
  /** Controlled playing state. */
  playing?: boolean;
  /** Initial playing state for uncontrolled usage. */
  defaultPlaying?: boolean;
  /** Called after the button requests a playing-state change. */
  onPlayingChange?: (playing: boolean) => void;
  /** Diameter in px, also published as `--play-button-size` for CSS overrides. */
  size?: number;
  /** Accessible name while paused. */
  playLabel?: string;
  /** Accessible name while playing. */
  pauseLabel?: string;
  /** Opt into the player's bezel: a disc that expands off the button on every toggle. */
  pulseOnToggle?: boolean;
  /** `ghost` sits on the page; `frosted` is the player's over-video glass. */
  surface?: "ghost" | "frosted";
};

export const PlayButton = React.forwardRef<HTMLButtonElement, PlayButtonProps>(
  function PlayButton(
    {
      playing,
      defaultPlaying = false,
      onPlayingChange,
      size = SURFACE_SIZE,
      playLabel = "Play",
      pauseLabel = "Pause",
      pulseOnToggle = false,
      surface = "ghost",
      className,
      style,
      type = "button",
      disabled,
      onClick,
      ...props
    },
    ref,
  ) {
    const [internalPlaying, setInternalPlaying] = React.useState(defaultPlaying);
    const [pulseKey, setPulseKey] = React.useState(0);
    const pathRef = React.useRef<SVGPathElement | null>(null);
    const shouldReduceMotion = useReducedMotion();
    const controlled = playing !== undefined;
    const isPlaying = controlled ? playing : internalPlaying;
    const progress = useMotionValue(isPlaying ? 1 : 0);

    // React must never re-patch `d`, or a toggle would snap to the end state
    // for a frame before the animation picked it up. Render the mount-time path
    // for SSR and hand the attribute to the motion value from then on.
    const initialPath = React.useRef<string | undefined>(undefined);
    initialPath.current ??= playPauseIconPath(isPlaying ? 1 : 0);

    useIsomorphicLayoutEffect(
      () =>
        progress.on("change", (value) => {
          pathRef.current?.setAttribute("d", playPauseIconPath(value));
        }),
      [progress],
    );

    useIsomorphicLayoutEffect(() => {
      const target = isPlaying ? 1 : 0;

      if (shouldReduceMotion) {
        progress.set(target);
        return;
      }

      // Animating the motion value (not a fresh tween) means a double-tap picks
      // up from wherever the morph currently is instead of jumping.
      const controls = animate(progress, target, MORPH_TRANSITION);

      return () => controls.stop();
    }, [isPlaying, progress, shouldReduceMotion]);

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);

        if (event.defaultPrevented || disabled) return;

        const nextPlaying = !isPlaying;

        if (!controlled) {
          setInternalPlaying(nextPlaying);
        }

        if (pulseOnToggle) {
          setPulseKey((key) => key + 1);
        }

        onPlayingChange?.(nextPlaying);
      },
      [
        controlled,
        disabled,
        isPlaying,
        onClick,
        onPlayingChange,
        pulseOnToggle,
      ],
    );

    const frosted = surface === "frosted";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={handleClick}
        aria-label={isPlaying ? pauseLabel : playLabel}
        data-slot="play-button"
        data-state={isPlaying ? "playing" : "paused"}
        style={{
          ["--play-button-size" as string]: `${size}px`,
          width: "var(--play-button-size)",
          height: "var(--play-button-size)",
          ...style,
        }}
        className={cn(
          "relative inline-grid shrink-0 place-items-center rounded-full outline-none",
          // Hover tint and press scale share one short ease-out so the button
          // answers the pointer before the morph has visibly started.
          "transition-[background-color,transform] duration-100 ease-out",
          "active:scale-[0.94] disabled:pointer-events-none disabled:opacity-50",
          // currentColor keeps the ring readable on video in either surface.
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
          "motion-reduce:transition-none motion-reduce:active:scale-100",
          frosted
            ? "bg-ericts-media-control/30 text-ericts-media-control-foreground backdrop-blur-[16px] hover:bg-ericts-media-control/45"
            : "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
          className,
        )}
        {...props}
      >
        {pulseOnToggle && !shouldReduceMotion && pulseKey > 0 ? (
          <motion.span
            key={pulseKey}
            aria-hidden
            data-slot="play-button-pulse"
            className="pointer-events-none absolute inset-0 rounded-full bg-current"
            initial={{ opacity: 0, transform: "scale(0.9)" }}
            animate={{
              opacity: [0, PULSE_PEAK_OPACITY, 0],
              transform: ["scale(0.9)", "scale(1.02)", "scale(1.7)"],
            }}
            transition={PULSE_TRANSITION}
          />
        ) : null}
        <svg
          aria-hidden
          viewBox={`0 0 ${ICON_VIEW_BOX} ${ICON_VIEW_BOX}`}
          data-slot="play-button-icon"
          style={{ width: ICON_RATIO, height: ICON_RATIO }}
          className="fill-current"
        >
          <path ref={pathRef} d={initialPath.current} />
        </svg>
      </button>
    );
  },
);
