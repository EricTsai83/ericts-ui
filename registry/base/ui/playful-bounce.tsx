"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import "./playful-bounce.css";

export type PlayfulBounceControls = { play: () => void };
export type PlayfulBounceProps = React.ComponentProps<"span"> & {
  /** Hover is limited to fine pointers. Use a real button child for click. */
  trigger?: "hover" | "click" | "manual";
  /** Play once after mounting. */
  autoPlay?: boolean;
  /** Total duration in milliseconds. */
  duration?: number;
  /** Imperative playback; ref remains the root DOM node. */
  controlsRef?: React.Ref<PlayfulBounceControls>;
  targetClassName?: string;
};

export function PlayfulBounce({
  children,
  className,
  targetClassName,
  trigger = "hover",
  autoPlay = false,
  duration = 1500,
  controlsRef,
  onClick,
  onPointerEnter,
  ...props
}: PlayfulBounceProps) {
  const targetRef = React.useRef<HTMLSpanElement>(null);
  const play = React.useCallback(() => {
    const target = targetRef.current;
    if (
      !target ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    // Keep the current choreography intact when triggers arrive mid-flight.
    target.dataset.playing = "true";
  }, []);

  React.useImperativeHandle(controlsRef, () => ({ play }), [play]);

  React.useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const target = targetRef.current;
    const stop = () => {
      if (target) delete target.dataset.playing;
    };
    const onPreferenceChange = () => {
      if (preference.matches) stop();
    };
    preference.addEventListener("change", onPreferenceChange);
    if (autoPlay) play();
    return () => {
      preference.removeEventListener("change", onPreferenceChange);
      stop();
    };
  }, [autoPlay, play]);

  const durationStyle = {
    "--playful-bounce-duration": `${Number.isFinite(duration) ? Math.max(1, duration) : 1500}ms`,
  } as React.CSSProperties;

  return (
    <span
      {...props}
      data-slot="playful-bounce"
      className={cn("inline-flex", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && trigger === "click") play();
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (
          !event.defaultPrevented &&
          trigger === "hover" &&
          window.matchMedia("(hover: hover) and (pointer: fine)").matches
        )
          play();
      }}
    >
      <span
        ref={targetRef}
        data-slot="playful-bounce-sway"
        className="playful-bounce-sway"
        style={durationStyle}
        onAnimationEnd={(event) => {
          // The sway and the first hop end before the second hop lands.
          const sway = event.currentTarget;
          const running = sway
            .getAnimations?.({ subtree: true })
            .some((animation) => animation.playState !== "finished");
          if (!running) delete sway.dataset.playing;
        }}
      >
        <span
          data-slot="playful-bounce-target"
          className={cn("playful-bounce-target", targetClassName)}
        >
          {children}
        </span>
      </span>
    </span>
  );
}
