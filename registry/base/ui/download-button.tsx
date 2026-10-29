"use client";

import * as React from "react";
import { ArrowDownToLine, Square } from "lucide-react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
  type Transition,
} from "motion/react";

import { cn } from "@/lib/utils";

// The glyphs are plain lucide icons, so they match the rest of a shadcn app and
// can be swapped through props. The ring is the one drawn part, and it plays
// three roles: the idle outline, the progress arc, and — on completion — a
// circle that spins down into lucide's `RotateCw`. For the default done icon
// an arrowhead rides the ring's end and grows during the spin, and the landed
// ring *is* the icon: drawn to `RotateCw`'s geometry and kept on screen, never
// swapped for the real one. A swap between identical drawings still shows,
// since a separately laid-out icon lands on a half pixel and anti-aliases
// differently. A custom done icon has no arc to land on, and a morph that
// lands on nothing reads as broken, so that path is a plain swap: the ring
// collapses towards the icon without spinning, and the icon sharpens out of a
// blur on the same 0.15s–0.45s beat as the arrowhead and badge.

const VIEW_BOX = 40;
const CENTER = VIEW_BOX / 2;
const RING_RADIUS = 19;
/** Progress starts at 12 o'clock. */
const RING_ROTATE = -90;
const SPINNER_LENGTH = 0.25;

// Icons render at half the button (20px of 40px), lucide's 24px grid scaled.
const ICON_SIZE = 20;
const LUCIDE_SCALE = ICON_SIZE / 24;
// The done icon sits up and left of centre so it and the badge balance as a
// group; the badge overlaps the icon's lower right, where `RotateCw` is open.
// Without the badge it moves back to the centre by `UNBADGED_SHIFT`.
const DONE_ICON_X = 8.5;
const DONE_ICON_Y = 8;
const UNBADGED_SHIFT = [
  CENTER - ICON_SIZE / 2 - DONE_ICON_X,
  CENTER - ICON_SIZE / 2 - DONE_ICON_Y,
] as const;
// `RotateCw`'s arc: centre (12, 12), radius 9, drawn clockwise from 3 o'clock
// round to its arrowhead's corner at (21, 8).
const lucide = (x: number, y: number) =>
  [DONE_ICON_X + x * LUCIDE_SCALE, DONE_ICON_Y + y * LUCIDE_SCALE] as const;
const [ARC_CX, ARC_CY] = lucide(12, 12);
const ARC_RADIUS = 9 * LUCIDE_SCALE;
const ARC_ROTATE = 0;
const [CORNER_X, CORNER_Y] = lucide(21, 8);
/** Where the arc ends: the point on the circle nearest the arrowhead's corner. */
const ARC_END =
  (Math.atan2(CORNER_Y - ARC_CY, CORNER_X - ARC_CX) * 180) / Math.PI + 360;
const ARC_LENGTH = ARC_END / 360;
// RotateCw's arc swings slightly outward into its corner; the riding head
// carries that offset so it lands exactly on the icon's.
const CORNER_OFFSET = [
  CORNER_X - (ARC_CX + ARC_RADIUS * Math.cos((ARC_END * Math.PI) / 180)),
  CORNER_Y - (ARC_CY + ARC_RADIUS * Math.sin((ARC_END * Math.PI) / 180)),
] as const;
/** The arrowhead's arms, up and left from the corner, as in `M21 3v5h-5`. */
const ARMS = [
  [0, -5 * LUCIDE_SCALE],
  [-5 * LUCIDE_SCALE, 0],
] as const;
const BADGE_CX = 27.5;
const BADGE_CY = 27;
const BADGE_RADIUS = 6;
/** Fallback in place, so the variable can be set on any ancestor. */
const SURFACE = "var(--download-button-surface, var(--background))";
/** The gap cut around the badge where it overlaps the arc. */
const BADGE_GAP = 2;
// lucide's `Check`, at 64% of the badge, centred on it.
const CHECK_PATH = "M20 6 9 17l-5-5";
const CHECK_SCALE = (BADGE_RADIUS * 2 * 0.64) / 24;
const CHECK_TRANSFORM = `translate(${BADGE_CX - 12 * CHECK_SCALE} ${BADGE_CY - 12 * CHECK_SCALE}) scale(${CHECK_SCALE})`;

// Module-level so the ring effect is not restarted by every render. A strong
// ease-out keeps the completion spin fast at first and gentle as it lands.
const DEFAULT_TRANSITION: Transition = {
  duration: 0.55,
  ease: [0.16, 1, 0.3, 1],
};
const EASE_OUT: Transition["ease"] = [0.215, 0.61, 0.355, 1];
/** The riding arrowhead grows mid-spin: from 0.15s, done by 0.45s. */
const ARROWHEAD_GROW = {
  duration: 0.3,
  ease: EASE_OUT,
  delay: 0.15,
} satisfies Transition;
/** A custom done icon's swap: the ring collapses while the icon blurs in. */
const COLLAPSE: Transition = { duration: 0.3, ease: EASE_OUT };
const COLLAPSE_FADE: Transition = { duration: 0.25, ease: EASE_OUT };
const COLLAPSE_RADIUS = ICON_SIZE * 0.45;
const SWAP_OUT: Transition = { duration: 0.16, ease: EASE_OUT };
const SWAP_IN: Transition = { ...ARROWHEAD_GROW };
/**
 * The badge pops alongside the arrowhead and reaches full size as it finishes.
 * `visualDuration` is when a spring first arrives; the bounce settles after.
 */
const BADGE_POP: Transition = {
  type: "spring",
  visualDuration: ARROWHEAD_GROW.duration,
  bounce: 0.5,
  delay: ARROWHEAD_GROW.delay,
};

/** The arrowhead at the ring's end, rotated with it and scaled by `grow`. */
function arrowheadPath([cx, cy, r, length, rotate, grow]: number[]) {
  const end = rotate + length * 360;
  const radians = (end * Math.PI) / 180;
  const turn = ((end - ARC_END) * Math.PI) / 180;
  const spin = ([x, y]: readonly number[]) => [
    x * Math.cos(turn) - y * Math.sin(turn),
    x * Math.sin(turn) + y * Math.cos(turn),
  ];
  const [ox, oy] = spin(CORNER_OFFSET);
  const x = cx + r * Math.cos(radians) + ox;
  const y = cy + r * Math.sin(radians) + oy;
  const [[ax, ay], [bx, by]] = ARMS.map(spin);
  const point = (dx: number, dy: number) =>
    `${(x + dx * grow).toFixed(2)} ${(y + dy * grow).toFixed(2)}`;
  return `M ${point(ax, ay)} L ${point(0, 0)} L ${point(bx, by)}`;
}

const toPercent = (value: number) => `${(value / VIEW_BOX) * 100}%`;
const box = (x: number, y: number, size: number): React.CSSProperties => ({
  left: toPercent(x),
  top: toPercent(y),
  width: toPercent(size),
  height: toPercent(size),
});
const ICON_STYLE = box(
  CENTER - ICON_SIZE / 2,
  CENTER - ICON_SIZE / 2,
  ICON_SIZE,
);
const DONE_ICON_STYLE = box(DONE_ICON_X, DONE_ICON_Y, ICON_SIZE);
const ICON_SLOT =
  "pointer-events-none absolute grid place-items-center [&_svg]:size-full";

/** Forward rotation from `from` that lands on `to` (mod 360), at least `minimum` degrees. */
function forwardTo(from: number, to: number, minimum = 0) {
  let delta = (((to - from) % 360) + 360) % 360;
  if (delta < minimum) delta += 360;
  return from + delta;
}

export type DownloadButtonState = "idle" | "loading" | "done";

export type DownloadButtonContext = {
  /** Aborted when the download is cancelled or the component unmounts. */
  signal: AbortSignal;
  /**
   * Report progress from 0 to 1. Until the first call the ring spins
   * indeterminately; calls after the download settles are ignored.
   */
  setProgress: (value: number) => void;
};

export type DownloadButtonProps = Omit<
  React.ComponentProps<"button">,
  "children" | "onError" | "aria-label"
> & {
  /** Resolve when the download finishes; reject to return to idle. */
  onDownload: (context: DownloadButtonContext) => void | Promise<void>;
  /** Called when `onDownload` rejects. */
  onError?: (error: unknown) => void;
  /**
   * Time in ms the done state shows before returning to idle. Omit to keep it:
   * the done glyph already reads "again", so pressing it downloads again.
   */
  doneDuration?: number;
  /**
   * Replaces downloading again while done, e.g. to open the file. Pair it with
   * a `doneLabel` and `doneIcon` that describe the new action.
   */
  onDoneClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Icon while idle. Rendered at half the button's size. */
  icon?: React.ReactNode;
  /**
   * Icon while done, beside the check badge. By default the ring spins down
   * into lucide's `RotateCw`; another icon (e.g. `FolderOpen`, with
   * `onDoneClick`) fades in as the ring fades out.
   */
  doneIcon?: React.ReactNode;
  /** Pressing while downloading aborts the request and returns to idle. */
  cancelable?: boolean;
  /** Called after a press cancels the download. */
  onCancel?: () => void;
  /** Accessible name while idle. */
  label?: string;
  /** Accessible name and announcement while downloading. */
  loadingLabel?: string;
  /** Accessible name while downloading and `cancelable`. */
  cancelLabel?: string;
  /** Accessible name while done; describes what pressing does. */
  doneLabel?: string;
  /** Announced when the download finishes. */
  doneAnnouncement?: string;
  /** Diameter in px, also published as `--download-button-size`. */
  size?: number;
  /** Ring morph between states. Read when a state change starts it. */
  transition?: Transition;
  /**
   * Whether the done state shows the check badge. The badge says the download
   * finished; the done icon says what pressing does next. Without it the done
   * icon is centred.
   */
  badge?: boolean;
  /**
   * Classes for the check badge. Its disc is `currentColor`, like the ring.
   * The gap around it and the check are `--download-button-surface` (default
   * `--background`); on a card set e.g. `[--download-button-surface:var(--card)]`
   * on the button or any ancestor.
   */
  badgeClassName?: string;
};

export function DownloadButton({
  onDownload,
  onError,
  doneDuration,
  onDoneClick,
  icon = <ArrowDownToLine />,
  doneIcon,
  cancelable = false,
  onCancel,
  label = "Download",
  loadingLabel = "Downloading…",
  cancelLabel = "Cancel download",
  doneLabel = "Download again",
  doneAnnouncement = "Download complete",
  size = VIEW_BOX,
  transition = DEFAULT_TRANSITION,
  badge = true,
  badgeClassName,
  className,
  style,
  type = "button",
  disabled,
  onClick,
  ...props
}: DownloadButtonProps) {
  const [state, setState] = React.useState<DownloadButtonState>("idle");
  const [progress, setProgress] = React.useState<number | null>(null);
  const reduceMotion = useReducedMotion();
  const requestRef = React.useRef<AbortController | null>(null);
  const ridingHead = doneIcon === undefined;
  // The ring's geometry lives in motion values so the riding arrowhead can be
  // computed from wherever the ring is, frame by frame.
  const cx = useMotionValue(CENTER);
  const cy = useMotionValue(CENTER);
  const radius = useMotionValue(RING_RADIUS);
  const strokeWidth = useMotionValue(2);
  const length = useMotionValue(0);
  const rotate = useMotionValue(RING_ROTATE);
  const grow = useMotionValue(0);
  const arrowhead = useTransform(
    [cx, cy, radius, length, rotate, grow],
    (values: number[]) => arrowheadPath(values),
  );
  // Collapsed, the head would still draw a round-capped dot.
  const arrowheadOpacity = useTransform(grow, (value) =>
    value > 0.02 ? 1 : 0,
  );

  React.useEffect(() => () => requestRef.current?.abort(), []);

  React.useEffect(() => {
    if (state !== "done" || doneDuration === undefined) return;
    const timer = setTimeout(() => setState("idle"), doneDuration);
    return () => clearTimeout(timer);
  }, [state, doneDuration]);

  const indeterminate = state === "loading" && progress === null;

  // Read through a ref so an inline `transition` object, new on every parent
  // render, cannot restart a morph that is already running.
  const transitionRef = React.useRef(transition);
  React.useEffect(() => {
    transitionRef.current = transition;
  });
  const previousStateRef = React.useRef(state);
  const progressFrameRef = React.useRef<number | null>(null);
  React.useEffect(
    () => () => {
      if (progressFrameRef.current !== null)
        cancelAnimationFrame(progressFrameRef.current);
    },
    [],
  );

  // The ring's shape, driven imperatively so every change starts from where
  // the ring is: the spinner never snaps back to 12 o'clock when it stops,
  // and completion spins forward into place.
  React.useEffect(() => {
    const done = state === "done";
    // Only the change into done earns the extra turn; a re-run while done
    // (say, `badge` toggling) must not spin the landed icon again.
    const enteringDone = done && previousStateRef.current !== "done";
    previousStateRef.current = state;
    // A custom done icon: collapse towards it, no spin, no change of length.
    const collapse = done && !ridingHead;
    const targets: [typeof cx, number][] = [
      [cx, done ? ARC_CX + (badge ? 0 : UNBADGED_SHIFT[0]) : CENTER],
      [cy, done ? ARC_CY + (badge ? 0 : UNBADGED_SHIFT[1]) : CENTER],
      [radius, collapse ? COLLAPSE_RADIUS : done ? ARC_RADIUS : RING_RADIUS],
      // Lands at the icon's stroke weight so the handover has no step.
      [strokeWidth, done ? 2 * LUCIDE_SCALE : 2],
    ];
    const headTarget = done && ridingHead ? 1 : 0;
    const rotateTarget = done ? ARC_ROTATE : RING_ROTATE;

    if (reduceMotion) {
      targets.forEach(([value, target]) => value.set(target));
      grow.set(headTarget);
      rotate.set(rotateTarget);
      return;
    }

    const morph = collapse ? COLLAPSE : transitionRef.current;
    const current = rotate.get();
    const controls: AnimationPlaybackControls[] = targets.map(
      ([value, target]) => animate(value, target, morph),
    );
    controls.push(
      animate(
        grow,
        headTarget,
        headTarget ? ARROWHEAD_GROW : { duration: 0.12, ease: EASE_OUT },
      ),
    );
    if (indeterminate) {
      controls.push(
        animate(rotate, current + 360, {
          duration: 0.9,
          ease: "linear",
          repeat: Infinity,
        }),
      );
    } else if (!collapse) {
      controls.push(
        animate(
          rotate,
          forwardTo(current, rotateTarget, enteringDone ? 180 : 0),
          transitionRef.current,
        ),
      );
    }
    return () => controls.forEach((control) => control.stop());
  }, [
    state,
    indeterminate,
    ridingHead,
    badge,
    reduceMotion,
    cx,
    cy,
    radius,
    strokeWidth,
    length,
    rotate,
    grow,
  ]);

  // The arc's length is the only part progress moves, so reports animate it
  // alone instead of restarting the whole shape.
  React.useEffect(() => {
    const done = state === "done";
    if (done && !ridingHead) return;
    const target = done
      ? ARC_LENGTH
      : state === "loading"
        ? (progress ?? SPINNER_LENGTH)
        : 0;
    if (reduceMotion) {
      length.set(target);
      return;
    }
    const control = animate(length, target, transitionRef.current);
    return () => control.stop();
  }, [state, progress, ridingHead, reduceMotion, length]);

  async function download() {
    const controller = new AbortController();
    let pendingProgress = 0;
    requestRef.current = controller;
    setProgress(null);
    setState("loading");
    try {
      await onDownload({
        signal: controller.signal,
        setProgress: (value) => {
          // A non-finite report carries no information; keep the last one.
          if (requestRef.current !== controller || !Number.isFinite(value))
            return;
          pendingProgress = Math.min(1, Math.max(0, value));
          // Streams can report hundreds of times a second; render once a frame.
          progressFrameRef.current ??= requestAnimationFrame(() => {
            progressFrameRef.current = null;
            if (requestRef.current === controller) setProgress(pendingProgress);
          });
        },
      });
      if (!controller.signal.aborted) setState("done");
    } catch (error) {
      if (controller.signal.aborted) return;
      setState("idle");
      onError?.(error);
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (disabled || event.defaultPrevented) return;
    if (state === "loading") {
      if (!cancelable) return;
      requestRef.current?.abort();
      requestRef.current = null;
      setState("idle");
      onCancel?.();
    } else if (state === "done" && onDoneClick) {
      onDoneClick(event);
    } else if (!requestRef.current) {
      void download();
    }
  }

  const done = state === "done";
  const loading = state === "loading";
  const showStop = loading && cancelable;
  const morph = reduceMotion ? { duration: 0 } : transition;
  const fade: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: EASE_OUT };
  const collapse = done && !ridingHead;

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      aria-label={
        loading
          ? cancelable
            ? cancelLabel
            : loadingLabel
          : done
            ? doneLabel
            : label
      }
      aria-busy={loading}
      // Not `disabled` while loading, so keyboard focus stays on the button.
      aria-disabled={(loading && !cancelable) || undefined}
      data-slot="download-button"
      data-state={state}
      data-cancelable={cancelable || undefined}
      data-progress={loading && progress !== null ? progress : undefined}
      onClick={handleClick}
      style={{
        ["--download-button-size" as string]: `${size}px`,
        width: "var(--download-button-size)",
        height: "var(--download-button-size)",
        ...style,
      }}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full text-foreground outline-none",
        "transition-transform duration-100 ease-out active:scale-[0.94]",
        // Tailwind's preflight gives buttons the default cursor, so state it.
        // A cancelable download stays a pointer: pressing it does something.
        // Otherwise `progress`, not `wait` (only this button is busy) or
        // `not-allowed` (nothing is forbidden; it is simply working).
        "cursor-pointer aria-disabled:cursor-progress aria-disabled:active:scale-100",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox={`0 0 ${VIEW_BOX} ${VIEW_BOX}`}
        className="size-full overflow-visible"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Idle outline, dimmed into the progress track while loading. */}
        <motion.circle
          data-slot="download-button-track"
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth={strokeWidth}
          initial={false}
          animate={{ opacity: done ? 0 : loading ? 0.2 : 1 }}
          transition={collapse && !reduceMotion ? COLLAPSE_FADE : morph}
        />
        <motion.g
          initial={false}
          // A zero-length path with round caps is still a dot, so idle hides
          // the ring. Done, it stays as the default icon, or fades out under
          // a custom one.
          animate={{ opacity: loading || (done && ridingHead) ? 1 : 0 }}
          transition={
            reduceMotion || loading || (done && ridingHead)
              ? { duration: 0 }
              : done
                ? COLLAPSE_FADE
                : fade
          }
        >
          <motion.circle
            data-slot="download-button-ring"
            cx={cx}
            cy={cy}
            r={radius}
            strokeWidth={strokeWidth}
            style={{ rotate, pathLength: length }}
          />
          <motion.path
            data-slot="download-button-arrowhead"
            d={arrowhead}
            strokeWidth={strokeWidth}
            style={{ opacity: arrowheadOpacity }}
          />
        </motion.g>
        {/* In the ring's SVG, not an HTML overlay: an overlay sized in
            fractions of a pixel snaps sideways when its transform is removed
            at the end of the pop. */}
        {badge && (
          <motion.g
            data-slot="download-button-badge"
            className={badgeClassName}
            stroke="none"
            initial={false}
            animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
            transition={
              reduceMotion ? { duration: 0 } : done ? BADGE_POP : fade
            }
          >
            <circle
              cx={BADGE_CX}
              cy={BADGE_CY}
              r={BADGE_RADIUS + BADGE_GAP}
              fill={SURFACE}
            />
            <circle
              cx={BADGE_CX}
              cy={BADGE_CY}
              r={BADGE_RADIUS}
              fill="currentColor"
            />
            <path
              d={CHECK_PATH}
              transform={CHECK_TRANSFORM}
              fill="none"
              stroke={SURFACE}
              strokeWidth={3.5}
            />
          </motion.g>
        )}
      </svg>
      <motion.span
        aria-hidden
        data-slot="download-button-icon"
        className={ICON_SLOT}
        style={ICON_STYLE}
        initial={false}
        animate={
          collapse
            ? { y: 0, scale: 0.5, opacity: 0, filter: "blur(2px)" }
            : {
                y: done ? 6 : 0,
                scale: done || showStop ? 0.6 : 1,
                opacity: done || showStop ? 0 : 1,
                filter: "blur(0px)",
              }
        }
        transition={collapse && !reduceMotion ? SWAP_OUT : fade}
      >
        {icon}
      </motion.span>
      {cancelable && (
        <motion.span
          aria-hidden
          data-slot="download-button-stop"
          className={cn(ICON_SLOT, "[&_svg]:fill-current")}
          style={ICON_STYLE}
          initial={false}
          animate={{ scale: showStop ? 0.5 : 0.3, opacity: showStop ? 1 : 0 }}
          transition={fade}
        >
          <Square strokeWidth={0} />
        </motion.span>
      )}
      {!ridingHead && (
        <motion.span
          aria-hidden
          data-slot="download-button-done-icon"
          className={ICON_SLOT}
          // Kept on its own layer throughout: an icon at a fractional offset
          // would otherwise snap sideways when its transform is dropped.
          style={{
            ...(badge ? DONE_ICON_STYLE : ICON_STYLE),
            willChange: "transform",
          }}
          initial={false}
          animate={
            done
              ? { scale: 1, opacity: 1, filter: "blur(0px)" }
              : { scale: 0.5, opacity: 0, filter: "blur(2px)" }
          }
          transition={done && !reduceMotion ? SWAP_IN : fade}
        >
          {doneIcon}
        </motion.span>
      )}
      <span role="status" className="sr-only">
        {loading ? loadingLabel : done ? doneAnnouncement : ""}
      </span>
    </button>
  );
}
