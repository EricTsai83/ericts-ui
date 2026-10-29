"use client";

import {
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type AnimationEvent,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "@/lib/utils";

import "./ring-hud.css";

export type RingHudPhase = "enter" | "hold" | "exit" | "done";

export type RingHudControls = {
  /** Play the whole sequence again from the entrance. */
  replay: () => void;
  /** Freeze the sequence where it is, including the hold countdown. */
  pause: () => void;
  resume: () => void;
  /** Leave now. During the entrance, leaves as soon as the ring settles. */
  dismiss: () => void;
};

export type RingHudProps = Omit<ComponentProps<"div">, "children"> & {
  /** Ring fill from 0 to 100. Changes glide along the ring in any phase. */
  value: number;
  /**
   * Caption under the ring. A function receives the clamped, rounded value.
   * Pass `null` to omit it. Defaults to the percentage.
   */
  label?: ReactNode | ((value: number) => ReactNode);
  /** Content centred in the ring, usually an icon. Sized to 42% of the ring. */
  icon?: ReactNode;
  /**
   * How long the settled ring shows, in milliseconds. `Infinity` holds until
   * `dismiss()`, or until this changes to a finite number, which starts the
   * countdown from that moment.
   */
  holdDuration?: number;
  /** Ring diameter. Numbers are pixels; CSS lengths are also accepted. Defaults to 12rem. */
  size?: number | string;
  /**
   * Imperative replay/pause/resume/dismiss. `ref` points at the root element,
   * matching every other component in the registry.
   */
  controlsRef?: Ref<RingHudControls>;
  onPhaseChange?: (phase: RingHudPhase) => void;
  /**
   * Called after each run's exit finishes. The element then stays mounted
   * with `data-phase="done"` and `visibility: hidden`, keeping its space so
   * surrounding layout never jumps. To give the space back, unmount it here
   * or add `className="data-[phase=done]:hidden"`.
   */
  onComplete?: () => void;
  /** Classes for the ring. Set `color` here with a `text-*` utility to tint it. */
  ringClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
};

const DEFAULT_HOLD_DURATION = 1340;

const formatPercent = (value: number) => `${value}%`;

/**
 * A transient ring HUD: the ring fills to `value` around an icon, holds with a
 * caption, then sweeps away. Use it for any at-a-glance level or confirmation:
 * charging, upload progress, goals, connection status.
 *
 * Also themeable through `--ring-hud-color`, `--ring-hud-track-color`, and
 * `--ring-hud-size`.
 *
 * Phases advance on the root's CSS `animationend`, with no JS timers, so
 * pausing freezes every phase at once. The flow therefore needs animations
 * to run: inside a `display: none` ancestor it waits until shown, and a global
 * `animation: none !important` reset stalls it outright. Short-duration
 * resets such as `animation-duration: 0.01ms` are fine.
 */
export function RingHud({
  value,
  label = formatPercent,
  icon,
  holdDuration = DEFAULT_HOLD_DURATION,
  size,
  controlsRef,
  onPhaseChange,
  onComplete,
  onAnimationEnd,
  ref,
  className,
  ringClassName,
  iconClassName,
  labelClassName,
  style,
  ...props
}: RingHudProps) {
  const [phase, setPhase] = useState<RingHudPhase>("enter");
  // Controls and event handlers read the phase from here, not from render
  // state, so calls made back to back (replay() then dismiss()) see the
  // phase the previous call just moved to.
  const phaseRef = useRef<RingHudPhase>("enter");
  const [paused, setPaused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const dismissRequestedRef = useRef(false);
  const labelRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const maskId = useId();

  const level = Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : 0;
  const caption = typeof label === "function" ? label(level) : label;
  const hasCaption =
    caption !== null &&
    caption !== undefined &&
    caption !== false &&
    caption !== "";
  const manualHold = holdDuration === Infinity;
  const hold = Number.isFinite(holdDuration)
    ? Math.max(1, holdDuration)
    : DEFAULT_HOLD_DURATION;

  const goTo = (next: RingHudPhase) => {
    phaseRef.current = next;
    setPhase(next);
    // The live region exists from mount and is filled once the caption is
    // settled, so screen readers announce it. Re-setting identical text on
    // exit is a no-op, so only a changed caption is announced twice.
    if (next === "hold" || next === "exit") {
      setAnnouncement(
        labelRef.current?.textContent?.trim() || formatPercent(level),
      );
    }
    onPhaseChange?.(next);
    if (next === "done") onComplete?.();
  };

  useImperativeHandle(controlsRef, () => ({
    replay() {
      dismissRequestedRef.current = false;
      setPaused(false);
      setAnnouncement("");
      // Leaving any other phase swaps animation names, which restarts them on
      // the same node. Replaying mid-entrance keeps the names, so rewind them.
      if (phaseRef.current === "enter") {
        for (const animation of rootRef.current?.getAnimations?.({
          subtree: true,
        }) ?? []) {
          animation.currentTime = 0;
        }
      }
      goTo("enter");
    },
    pause() {
      setPaused(true);
    },
    resume() {
      setPaused(false);
    },
    dismiss() {
      if (phaseRef.current === "enter") dismissRequestedRef.current = true;
      else if (phaseRef.current === "hold") goTo("exit");
    },
  }));

  // The root is needed internally (replay rewinds its animations) and by
  // consumers, so the consumer's ref is merged in rather than overwritten.
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    onAnimationEnd?.(event);
    if (
      event.target !== event.currentTarget ||
      !event.animationName.startsWith("ring-hud-")
    )
      return;

    const current = phaseRef.current;
    if (current === "enter")
      goTo(dismissRequestedRef.current ? "exit" : "hold");
    else if (current === "hold" && !manualHold) goTo("exit");
    else if (current === "exit") goTo("done");
  };

  return (
    <div
      {...props}
      ref={setRootRef}
      data-slot="ring-hud"
      data-phase={phase}
      data-hold={manualHold ? "manual" : undefined}
      data-paused={paused ? "" : undefined}
      onAnimationEnd={handleAnimationEnd}
      className={cn("ring-hud", className)}
      style={
        {
          "--ring-hud-value": level,
          "--ring-hud-hold": `${hold}ms`,
          ...(size !== undefined && {
            "--ring-hud-size": typeof size === "number" ? `${size}px` : size,
          }),
          ...style,
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        data-slot="ring-hud-ring"
        className={cn("ring-hud-ring", ringClassName)}
      >
        <svg viewBox="0 0 200 200" fill="none">
          <defs>
            <mask
              id={maskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="200"
              height="200"
            >
              <circle
                className="ring-hud-trim"
                cx="100"
                cy="100"
                r="82"
                pathLength="100"
                stroke="white"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="100 100"
                transform="rotate(-90 100 100)"
              />
            </mask>
          </defs>
          <g className="ring-hud-ink" strokeWidth="14" strokeLinecap="round">
            <circle
              className="ring-hud-track"
              mask={`url(#${maskId})`}
              cx="100"
              cy="100"
              r="82"
            />
            <circle
              className="ring-hud-path"
              visibility={level === 0 ? "hidden" : undefined}
              cx="100"
              cy="100"
              r="82"
              pathLength="100"
              stroke="currentColor"
              transform="rotate(-90 100 100)"
            />
          </g>
        </svg>
        {icon != null && (
          <span
            data-slot="ring-hud-icon"
            className={cn("ring-hud-icon", iconClassName)}
          >
            {icon}
          </span>
        )}
      </div>
      {hasCaption && (
        <span
          ref={labelRef}
          aria-hidden="true"
          data-slot="ring-hud-label"
          className={cn(
            "ring-hud-label text-sm text-foreground tabular-nums",
            labelClassName,
          )}
        >
          {caption}
        </span>
      )}
      <span role="status" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
