"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { HeartIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import "./like-burst.css";

/** Keep in sync with the nth-child choreography in like-burst.css. */
const LIKE_BURST_PARTICLE_COUNT = 7;

/**
 * The ring and every particle group run for the full burst duration, so the
 * burst is done once all of them report in. The per-dot animations on their
 * pseudo-elements share that clock and are not counted.
 */
const LIKE_BURST_SETTLE_ANIMATIONS = new Set([
  "like-burst-ring",
  "like-burst-particle",
]);
const LIKE_BURST_SETTLE_COUNT = 1 + LIKE_BURST_PARTICLE_COUNT;

type ButtonProps = React.ComponentProps<typeof ButtonPrimitive>;
type LikeBurstClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];

export type LikeBurstProps = Omit<
  ButtonProps,
  "aria-pressed" | "children" | "duration" | "onClick" | "size"
> & {
  /** Controlled liked state. */
  liked?: boolean;
  /** Initial liked state for uncontrolled usage. */
  defaultLiked?: boolean;
  /** Called when the control requests a liked-state change. */
  onLikedChange?: (liked: boolean) => void;
  /** Called before the liked state changes. Prevent default to cancel the change. */
  onClick?: (event: LikeBurstClickEvent) => void;
  /** Accessible action label while unliked. Applied only when icon-only. */
  likeLabel?: string;
  /** Accessible action label while liked. Applied only when icon-only. */
  unlikeLabel?: string;
  /** Optional content placed after the heart. */
  children?: React.ReactNode;
  /**
   * Heart size. Numbers are interpreted as pixels; CSS lengths are also
   * accepted. Defaults to 32px via the `--like-burst-size` custom property,
   * which can also be set in CSS. The ring and particles scale with it.
   */
  iconSize?: number | string;
  /**
   * Total burst duration in milliseconds; every phase keeps its share of it.
   * Defaults to 700ms via the `--like-burst-duration` custom property, which
   * can also be set in CSS.
   */
  duration?: number;
  /** Classes applied to the heart and burst wrapper. */
  iconClassName?: string;
};

type LikeBurstStyle = React.CSSProperties & {
  "--like-burst-duration"?: string;
  "--like-burst-size"?: string;
};

export function LikeBurst({
  liked,
  defaultLiked = false,
  onLikedChange,
  onClick,
  likeLabel = "Like",
  unlikeLabel = "Unlike",
  children,
  iconSize,
  duration,
  className,
  iconClassName,
  disabled,
  ref,
  style,
  ...props
}: LikeBurstProps) {
  const [internalLiked, setInternalLiked] = React.useState(defaultLiked);
  const controlled = liked !== undefined;
  const isLiked = controlled ? liked : internalLiked;
  const previousLikedRef = React.useRef(isLiked);
  const likeIntentRef = React.useRef(false);
  const [burstId, setBurstId] = React.useState(0);
  const [burstActive, setBurstActive] = React.useState(false);
  const settledAnimationsRef = React.useRef(0);
  const likeBurstStyle: LikeBurstStyle = { ...style };

  if (duration !== undefined) {
    likeBurstStyle["--like-burst-duration"] = `${duration}ms`;
  }

  if (iconSize !== undefined) {
    likeBurstStyle["--like-burst-size"] =
      typeof iconSize === "number" ? `${iconSize}px` : iconSize;
  }

  // A burst only belongs to a liked heart, so unliking mid-burst drops it.
  if (burstActive && !isLiked) {
    setBurstActive(false);
  }

  // The burst celebrates user intent: it plays when `isLiked` turns true after
  // a click asked for it — immediately for optimistic parents, or once a
  // non-optimistic parent commits the result — but never for controlled state
  // arriving from a fetch or a realtime update.
  React.useEffect(() => {
    if (!previousLikedRef.current && isLiked && likeIntentRef.current) {
      settledAnimationsRef.current = 0;
      setBurstId((current) => current + 1);
      setBurstActive(true);
    }

    if (previousLikedRef.current !== isLiked) {
      likeIntentRef.current = false;
    }

    previousLikedRef.current = isLiked;
  }, [isLiked]);

  const handleClick = React.useCallback(
    (event: LikeBurstClickEvent) => {
      onClick?.(event);

      if (event.defaultPrevented || disabled) {
        return;
      }

      const nextLiked = !isLiked;

      if (!controlled) {
        setInternalLiked(nextLiked);
      }

      likeIntentRef.current = nextLiked;

      onLikedChange?.(nextLiked);
    },
    [controlled, disabled, isLiked, onClick, onLikedChange],
  );

  // The burst leaves the DOM once the ring and every particle group have
  // finished, so long-lived liked items don't keep its layers mounted.
  const handleBurstAnimationEnd = React.useCallback(
    (event: React.AnimationEvent<HTMLSpanElement>) => {
      if (!LIKE_BURST_SETTLE_ANIMATIONS.has(event.animationName)) return;

      settledAnimationsRef.current += 1;

      if (settledAnimationsRef.current >= LIKE_BURST_SETTLE_COUNT) {
        setBurstActive(false);
      }
    },
    [],
  );

  const bursting = isLiked && burstActive;

  return (
    <ButtonPrimitive
      ref={ref}
      type="button"
      disabled={disabled}
      // With visible content, the accessible name must stay the visible text
      // (WCAG 2.5.3); aria-pressed alone conveys the state. The action label
      // only becomes the name when the control is icon-only.
      aria-label={children ? undefined : isLiked ? unlikeLabel : likeLabel}
      aria-pressed={isLiked}
      data-slot="like-burst"
      data-liked={isLiked}
      data-bursting={bursting ? "" : undefined}
      data-icon-only={children ? undefined : ""}
      className={cn(
        "like-burst relative inline-flex shrink-0 items-center justify-center gap-1.5 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        children ? "w-fit" : "rounded-full text-muted-foreground",
        className,
      )}
      style={likeBurstStyle}
      onClick={handleClick}
      {...props}
    >
      <span
        data-slot="like-burst-icon"
        data-icon={children ? "inline-start" : undefined}
        className={cn("like-burst-icon", iconClassName)}
        aria-hidden="true"
      >
        {bursting ? (
          <span
            key={burstId}
            data-slot="like-burst-effects"
            className="like-burst-effects"
            onAnimationEnd={handleBurstAnimationEnd}
          >
            <span className="like-burst-ring" />
            <span className="like-burst-particles">
              {Array.from({ length: LIKE_BURST_PARTICLE_COUNT }, (_, index) => (
                <span className="like-burst-particle" key={index} />
              ))}
            </span>
          </span>
        ) : null}

        <HeartIcon className="like-burst-heart like-burst-heart-outline size-full" />
        <HeartIcon
          className="like-burst-heart like-burst-heart-fill size-full"
          fill="currentColor"
        />
      </span>

      {children ? (
        <span data-slot="like-burst-content">{children}</span>
      ) : null}
    </ButtonPrimitive>
  );
}
