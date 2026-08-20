"use client";

import * as React from "react";
import {
  animate,
  cubicBezier,
  useMotionValue,
  useReducedMotion,
  type Transition,
} from "motion/react";

import { cn } from "@/lib/utils";

// The icon is three overlapping pieces, not one path morphing between states:
//
//   1. the play triangle stays in the DOM and scales into the right pause bar;
//   2. a narrow rounded rectangle starts at the triangle's left edge, then
//      widens and travels right underneath it to become the right pause bar;
//   3. a second rounded rectangle grows vertically in the space it leaves.
//
// Drawing the triangle last is deliberate. In a debug palette it remains visible
// inside the right bar, like the reference; in production all three use
// `currentColor`, so the overlap resolves into a clean pause glyph.

const ICON_VIEW_BOX = 36;
const ICON_CENTER = ICON_VIEW_BOX / 2;
const EPSILON = 1e-4;

type Point = readonly [number, number];
type Corner = { readonly point: Point; readonly radius: number };
type Shape = readonly Corner[];

const BAR_TOP = 4.5;
const BAR_BOTTOM = 31.5;
const BAR_WIDTH = 7;
const BAR_HEIGHT = BAR_BOTTOM - BAR_TOP;
const BAR_RADIUS = 2.5;
const LEFT_SLOT_X = 8.5;
const RIGHT_SLOT_X = 21.5;
const SHIFT_DISTANCE = RIGHT_SLOT_X - LEFT_SLOT_X;

const TRIANGLE_LEFT = 7.5;
const TRIANGLE_RIGHT = 33;
const TRIANGLE_TOP = 3;
const TRIANGLE_BOTTOM = 33;

const TRIANGLE_BODY: Shape = [
  { point: [TRIANGLE_LEFT, TRIANGLE_TOP], radius: 3.93 },
  { point: [TRIANGLE_LEFT, TRIANGLE_BOTTOM], radius: 3.93 },
  { point: [17, 27.4], radius: 0 },
  { point: [17, 8.6], radius: 0 },
];

const TRIANGLE_TIP: Shape = [
  { point: [17, 8.6], radius: 0 },
  { point: [17, 27.4], radius: 0 },
  { point: [TRIANGLE_RIGHT, ICON_CENTER], radius: 0 },
  { point: [TRIANGLE_RIGHT, ICON_CENTER], radius: 0 },
];

type Fillet = {
  entry: Point;
  control1: Point;
  control2: Point;
  exit: Point;
};

function arcControlFraction(interior: number) {
  return (
    1 - (4 / 3) * Math.tan((Math.PI - interior) / 4) * Math.tan(interior / 2)
  );
}

function filletCorner(previous: Point, corner: Corner, next: Point): Fillet {
  const [vx, vy] = corner.point;
  const inX = previous[0] - vx;
  const inY = previous[1] - vy;
  const outX = next[0] - vx;
  const outY = next[1] - vy;
  const inLength = Math.hypot(inX, inY);
  const outLength = Math.hypot(outX, outY);
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

  if (interior <= EPSILON || interior >= Math.PI - EPSILON) return degenerate;

  const pull = tangent * arcControlFraction(interior);

  return {
    entry: [vx + ux * tangent, vy + uy * tangent],
    control1: [vx + ux * pull, vy + uy * pull],
    control2: [vx + wx * pull, vy + wy * pull],
    exit: [vx + wx * tangent, vy + wy * tangent],
  };
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}

function coords([x, y]: Point) {
  return `${round(x)} ${round(y)}`;
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

const TRIANGLE_PATH = [TRIANGLE_BODY, TRIANGLE_TIP]
  .map(shapeToPath)
  .join(" ");

// Scaling the triangle around this offset origin maps its bounding box exactly
// onto the right pause slot. It therefore visibly remains the same object while
// it compresses and slides right, instead of being replaced by a new path.
const TRIANGLE_PAUSE_SCALE_X =
  BAR_WIDTH / (TRIANGLE_RIGHT - TRIANGLE_LEFT);
const TRIANGLE_PAUSE_SCALE_Y =
  BAR_HEIGHT / (TRIANGLE_BOTTOM - TRIANGLE_TOP);
const TRIANGLE_CENTER = (TRIANGLE_LEFT + TRIANGLE_RIGHT) / 2;
const RIGHT_SLOT_CENTER = RIGHT_SLOT_X + BAR_WIDTH / 2;
const TRIANGLE_ORIGIN_X =
  (RIGHT_SLOT_CENTER - TRIANGLE_PAUSE_SCALE_X * TRIANGLE_CENTER) /
  (1 - TRIANGLE_PAUSE_SCALE_X);
const TRIANGLE_ORIGIN = `${round(
  (TRIANGLE_ORIGIN_X / ICON_VIEW_BOX) * 100,
)}% 50%`;
const LEFT_BAR_ORIGIN = `${round(
  ((LEFT_SLOT_X + BAR_WIDTH / 2) / ICON_VIEW_BOX) * 100,
)}% 50%`;
const RIGHT_BAR_ORIGIN = `${round((RIGHT_SLOT_X / ICON_VIEW_BOX) * 100)}% 50%`;

// The two bars share one physical timeline. During the approach, the right bar
// travels from the left slot while the new left bar grows behind it. Their
// transforms share one rebound rhythm and settle on the same final frame. The
// left bar uses a slightly softer vertical overshoot than the moving right bar.
const HIDDEN_BAR_SCALE = 0.5;
const REBOUND_PEAK_SCALE = 1.25;
const LEFT_BAR_REBOUND_PEAK_SCALE = 1.2;
const REBOUND_PEAK_AT = 0.6;
const DEFAULT_MORPH_DURATION = 0.24;
const MASTER_EASE = cubicBezier(0.23, 1, 0.32, 1);
const SETTLE_EASE = cubicBezier(0.42, 0, 0.58, 1);
const MIN_MORPH_DURATION = 0.1;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function subProgress(progress: number, [start, end]: readonly [number, number]) {
  return clamp01((progress - start) / (end - start));
}

function lerp(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function reboundProgress(progress: number) {
  if (progress <= REBOUND_PEAK_AT) {
    return (
      REBOUND_PEAK_SCALE * MASTER_EASE(progress / REBOUND_PEAK_AT)
    );
  }

  return lerp(
    REBOUND_PEAK_SCALE,
    1,
    SETTLE_EASE((progress - REBOUND_PEAK_AT) / (1 - REBOUND_PEAK_AT)),
  );
}

function reboundScale(
  from: number,
  progress: number,
  peak = REBOUND_PEAK_SCALE,
) {
  if (progress <= REBOUND_PEAK_AT) {
    return lerp(
      from,
      peak,
      MASTER_EASE(progress / REBOUND_PEAK_AT),
    );
  }

  return lerp(
    peak,
    1,
    SETTLE_EASE((progress - REBOUND_PEAK_AT) / (1 - REBOUND_PEAK_AT)),
  );
}

function scaleY(value: number) {
  return `scaleY(${round(value)})`;
}

function translateXScaleX(x: number, scale: number) {
  return `translateX(${round((x / ICON_VIEW_BOX) * 100)}%) scaleX(${round(scale)})`;
}

function triangleScale(x: number, y: number) {
  return `scaleX(${round(x)}) scaleY(${round(y)})`;
}

export type SlidingPlayPauseIconStyles = {
  leftBar: { transform: string; opacity: number };
  rightBar: { transform: string; opacity: number };
  triangle: { transform: string; opacity: number };
};

type SlidingPlayPauseIconValues = {
  leftBar: { scaleY: number; opacity: number };
  rightBar: { translateX: number; scaleX: number; opacity: number };
  triangle: { scaleX: number; scaleY: number; opacity: number };
};

const PLAY_ICON_VALUES: SlidingPlayPauseIconValues = {
  leftBar: { scaleY: HIDDEN_BAR_SCALE, opacity: 0 },
  rightBar: {
    translateX: -SHIFT_DISTANCE,
    scaleX: HIDDEN_BAR_SCALE,
    opacity: 0,
  },
  triangle: { scaleX: 1, scaleY: 1, opacity: 1 },
};

const PAUSE_ICON_VALUES: SlidingPlayPauseIconValues = {
  leftBar: { scaleY: 1, opacity: 1 },
  rightBar: { translateX: 0, scaleX: 1, opacity: 1 },
  triangle: {
    scaleX: TRIANGLE_PAUSE_SCALE_X,
    scaleY: TRIANGLE_PAUSE_SCALE_Y,
    opacity: 1,
  },
};

function copyIconValues(
  values: SlidingPlayPauseIconValues,
): SlidingPlayPauseIconValues {
  return {
    leftBar: { ...values.leftBar },
    rightBar: { ...values.rightBar },
    triangle: { ...values.triangle },
  };
}

function iconValuesToStyles(
  values: SlidingPlayPauseIconValues,
): SlidingPlayPauseIconStyles {
  return {
    leftBar: {
      transform: scaleY(values.leftBar.scaleY),
      opacity: round(values.leftBar.opacity),
    },
    rightBar: {
      transform: translateXScaleX(
        values.rightBar.translateX,
        values.rightBar.scaleX,
      ),
      opacity: round(values.rightBar.opacity),
    },
    triangle: {
      transform: triangleScale(
        values.triangle.scaleX,
        values.triangle.scaleY,
      ),
      opacity: round(values.triangle.opacity),
    },
  };
}

function transitionIconValues(
  progress: number,
  playing: boolean,
  from: SlidingPlayPauseIconValues,
): SlidingPlayPauseIconValues {
  const elapsed = clamp01(progress);
  const target = playing ? PAUSE_ICON_VALUES : PLAY_ICON_VALUES;

  if (playing) {
    const settle = reboundProgress(elapsed);
    const visibility = MASTER_EASE(subProgress(elapsed, [0, 0.12]));

    return {
      leftBar: {
        scaleY: reboundScale(
          from.leftBar.scaleY,
          elapsed,
          LEFT_BAR_REBOUND_PEAK_SCALE,
        ),
        opacity: lerp(
          from.leftBar.opacity,
          target.leftBar.opacity,
          visibility,
        ),
      },
      rightBar: {
        translateX: lerp(
          from.rightBar.translateX,
          target.rightBar.translateX,
          settle,
        ),
        scaleX: reboundScale(from.rightBar.scaleX, elapsed),
        opacity: lerp(
          from.rightBar.opacity,
          target.rightBar.opacity,
          visibility,
        ),
      },
      triangle: {
        scaleX: lerp(from.triangle.scaleX, target.triangle.scaleX, settle),
        scaleY: lerp(from.triangle.scaleY, target.triangle.scaleY, settle),
        opacity: 1,
      },
    };
  }

  // Mirror the horizontal rebound on the way back to play: the right bar and
  // triangle travel left past the play position, then settle right into it.
  const settle = reboundProgress(elapsed);
  const exit = MASTER_EASE(elapsed);

  return {
    leftBar: {
      scaleY: lerp(from.leftBar.scaleY, target.leftBar.scaleY, exit),
      opacity: lerp(from.leftBar.opacity, target.leftBar.opacity, exit),
    },
    rightBar: {
      translateX: lerp(
        from.rightBar.translateX,
        target.rightBar.translateX,
        settle,
      ),
      scaleX: lerp(from.rightBar.scaleX, target.rightBar.scaleX, settle),
      opacity: lerp(from.rightBar.opacity, target.rightBar.opacity, exit),
    },
    triangle: {
      scaleX: lerp(from.triangle.scaleX, target.triangle.scaleX, settle),
      scaleY: lerp(from.triangle.scaleY, target.triangle.scaleY, settle),
      opacity: 1,
    },
  };
}

/** Returns one full direction's styles, useful for inspection and testing. */
export function slidingPlayPauseIconTransitionStyles(
  progress: number,
  playing: boolean,
): SlidingPlayPauseIconStyles {
  const from = playing ? PLAY_ICON_VALUES : PAUSE_ICON_VALUES;

  return iconValuesToStyles(transitionIconValues(progress, playing, from));
}

/** Backward-compatible shorthand for the play → pause direction. */
export function slidingPlayPauseIconStyles(
  progress: number,
): SlidingPlayPauseIconStyles {
  return slidingPlayPauseIconTransitionStyles(progress, true);
}

function transitionDistance(
  values: SlidingPlayPauseIconValues,
  target: SlidingPlayPauseIconValues,
) {
  const triangleRange = 1 - TRIANGLE_PAUSE_SCALE_X;

  return clamp01(
    Math.max(
      Math.abs(values.leftBar.opacity - target.leftBar.opacity),
      Math.abs(values.rightBar.opacity - target.rightBar.opacity),
      Math.abs(values.leftBar.scaleY - target.leftBar.scaleY) /
        (1 - HIDDEN_BAR_SCALE),
      Math.abs(values.rightBar.scaleX - target.rightBar.scaleX) /
        (1 - HIDDEN_BAR_SCALE),
      Math.abs(values.rightBar.translateX - target.rightBar.translateX) /
        SHIFT_DISTANCE,
      Math.abs(values.triangle.scaleX - target.triangle.scaleX) /
        triangleRange,
    ),
  );
}

const SURFACE_SIZE = 40;
const ICON_SIZE = 24;
const ICON_RATIO = `${(ICON_SIZE / SURFACE_SIZE) * 100}%`;
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export type SlidingPlayButtonProps = Omit<
  React.ComponentPropsWithoutRef<"button">,
  "aria-label" | "children"
> & {
  /** Controlled playing state. */
  playing?: boolean;
  /** Initial playing state for uncontrolled usage. */
  defaultPlaying?: boolean;
  /** Called after the button requests a playing-state change. */
  onPlayingChange?: (playing: boolean) => void;
  /** Diameter in px, also published as `--sliding-play-button-size`. */
  size?: number;
  /**
   * Overrides the full morph duration in seconds. The coordinated rebound
   * choreography remains fixed; set `duration` to `0` for an instant change.
   */
  transition?: Pick<Transition, "duration">;
  /** Accessible name while paused. */
  playLabel?: string;
  /** Accessible name while playing. */
  pauseLabel?: string;
  /** `ghost` sits on the page; `frosted` is the over-video glass. */
  surface?: "ghost" | "frosted";
};

export const SlidingPlayButton = React.forwardRef<
  HTMLButtonElement,
  SlidingPlayButtonProps
>(function SlidingPlayButton(
  {
    playing,
    defaultPlaying = false,
    onPlayingChange,
    size = SURFACE_SIZE,
    transition,
    playLabel = "Play",
    pauseLabel = "Pause",
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
  const leftBarRef = React.useRef<SVGRectElement | null>(null);
  const rightBarRef = React.useRef<SVGRectElement | null>(null);
  const triangleRef = React.useRef<SVGPathElement | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const controlled = playing !== undefined;
  const isPlaying = controlled ? playing : internalPlaying;
  const progress = useMotionValue(1);
  const instantTarget = React.useRef<boolean | null>(null);
  const currentValues = React.useRef<SlidingPlayPauseIconValues | undefined>(
    undefined,
  );
  currentValues.current ??= copyIconValues(
    isPlaying ? PAUSE_ICON_VALUES : PLAY_ICON_VALUES,
  );
  const activeTransition = React.useRef<{
    from: SlidingPlayPauseIconValues;
    playing: boolean;
  } | null>(null);
  const initialStyles = React.useRef<SlidingPlayPauseIconStyles | undefined>(
    undefined,
  );
  initialStyles.current ??= iconValuesToStyles(currentValues.current);
  const requestedDuration = transition?.duration;
  const morphDuration =
    typeof requestedDuration === "number" && Number.isFinite(requestedDuration)
      ? Math.max(0, requestedDuration)
      : DEFAULT_MORPH_DURATION;

  const applyIconValues = React.useCallback(
    (values: SlidingPlayPauseIconValues) => {
      const layers = iconValuesToStyles(values);

      if (leftBarRef.current) {
        leftBarRef.current.style.transform = layers.leftBar.transform;
        leftBarRef.current.style.opacity = String(layers.leftBar.opacity);
      }

      if (rightBarRef.current) {
        rightBarRef.current.style.transform = layers.rightBar.transform;
        rightBarRef.current.style.opacity = String(layers.rightBar.opacity);
      }

      if (triangleRef.current) {
        triangleRef.current.style.transform = layers.triangle.transform;
      }
    },
    [],
  );

  useIsomorphicLayoutEffect(
    () =>
      progress.on("change", (value) => {
        const transition = activeTransition.current;
        if (!transition) return;

        const values = transitionIconValues(
          value,
          transition.playing,
          transition.from,
        );
        currentValues.current = values;
        applyIconValues(values);
      }),
    [applyIconValues, progress],
  );

  useIsomorphicLayoutEffect(() => {
    const target = isPlaying ? PAUSE_ICON_VALUES : PLAY_ICON_VALUES;
    const from =
      currentValues.current ??
      copyIconValues(isPlaying ? PLAY_ICON_VALUES : PAUSE_ICON_VALUES);

    const shouldChangeInstantly =
      shouldReduceMotion ||
      morphDuration === 0 ||
      instantTarget.current === isPlaying;

    if (instantTarget.current === isPlaying) {
      instantTarget.current = null;
    }

    if (shouldChangeInstantly) {
      activeTransition.current = null;
      currentValues.current = copyIconValues(target);
      applyIconValues(target);
      progress.set(1);
      return;
    }

    const remaining = transitionDistance(from, target);

    if (remaining <= EPSILON) {
      activeTransition.current = null;
      currentValues.current = copyIconValues(target);
      applyIconValues(target);
      return;
    }

    activeTransition.current = {
      from: copyIconValues(from),
      playing: isPlaying,
    };
    progress.set(0);

    const controls = animate(progress, 1, {
      duration: Math.max(
        Math.min(MIN_MORPH_DURATION, morphDuration),
        morphDuration * remaining,
      ),
      ease: "linear",
    });

    return () => controls.stop();
  }, [applyIconValues, isPlaying, morphDuration, progress, shouldReduceMotion]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented || disabled) return;

      const nextPlaying = !isPlaying;
      // Native keyboard and assistive-technology clicks have no pointer detail.
      // Keep those high-frequency interactions immediate instead of making the
      // user wait for the decorative transform sequence.
      instantTarget.current = event.detail === 0 ? nextPlaying : null;

      if (!controlled) {
        setInternalPlaying(nextPlaying);
      }

      onPlayingChange?.(nextPlaying);
    },
    [controlled, disabled, isPlaying, onClick, onPlayingChange],
  );

  const frosted = surface === "frosted";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      aria-label={isPlaying ? pauseLabel : playLabel}
      data-slot="sliding-play-button"
      data-state={isPlaying ? "playing" : "paused"}
      style={{
        ["--sliding-play-button-size" as string]: `${size}px`,
        width: "var(--sliding-play-button-size)",
        height: "var(--sliding-play-button-size)",
        ...style,
      }}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full outline-none",
        "transition-[background-color,transform] duration-100 ease-[cubic-bezier(0.23,1,0.32,1)]",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        "motion-reduce:transition-colors motion-reduce:active:scale-100",
        frosted
          ? "bg-ericts-media-control/30 text-ericts-media-control-foreground backdrop-blur-[16px] hover:bg-ericts-media-control/45"
          : "hover:bg-muted hover:text-foreground",
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${ICON_VIEW_BOX} ${ICON_VIEW_BOX}`}
        data-slot="sliding-play-button-icon"
        style={{ width: ICON_RATIO, height: ICON_RATIO }}
        className="fill-current"
      >
        <rect
          ref={leftBarRef}
          data-slot="sliding-play-button-left-bar"
          className="motion-reduce:transition-opacity motion-reduce:duration-100 motion-reduce:ease-[cubic-bezier(0.23,1,0.32,1)]"
          x={LEFT_SLOT_X}
          y={BAR_TOP}
          width={BAR_WIDTH}
          height={BAR_HEIGHT}
          rx={BAR_RADIUS}
          style={{
            opacity: initialStyles.current.leftBar.opacity,
            transform: initialStyles.current.leftBar.transform,
            transformBox: "view-box",
            transformOrigin: LEFT_BAR_ORIGIN,
            willChange: "transform, opacity",
          }}
        />
        <rect
          ref={rightBarRef}
          data-slot="sliding-play-button-right-bar"
          className="motion-reduce:transition-opacity motion-reduce:duration-100 motion-reduce:ease-[cubic-bezier(0.23,1,0.32,1)]"
          x={RIGHT_SLOT_X}
          y={BAR_TOP}
          width={BAR_WIDTH}
          height={BAR_HEIGHT}
          rx={BAR_RADIUS}
          style={{
            opacity: initialStyles.current.rightBar.opacity,
            transform: initialStyles.current.rightBar.transform,
            transformBox: "view-box",
            transformOrigin: RIGHT_BAR_ORIGIN,
            willChange: "transform, opacity",
          }}
        />
        <path
          ref={triangleRef}
          data-slot="sliding-play-button-triangle"
          d={TRIANGLE_PATH}
          style={{
            opacity: initialStyles.current.triangle.opacity,
            transform: initialStyles.current.triangle.transform,
            transformBox: "view-box",
            transformOrigin: TRIANGLE_ORIGIN,
            willChange: "transform",
          }}
        />
      </svg>
    </button>
  );
});
