"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { HeartIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import "./like.css";

/** Keep in sync with the nth-child choreography in like.css. */
const LIKE_PARTICLE_COUNT = 8;

type ButtonProps = React.ComponentProps<typeof ButtonPrimitive>;
type LikeClickEvent = Parameters<NonNullable<ButtonProps["onClick"]>>[0];

export type LikeProps = Omit<
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
  onClick?: (event: LikeClickEvent) => void;
  /** Accessible action label while unliked. Applied only when icon-only. */
  likeLabel?: string;
  /** Accessible action label while liked. Applied only when icon-only. */
  unlikeLabel?: string;
  /** Optional content placed after the heart. */
  children?: React.ReactNode;
  /**
   * Heart size. Numbers are interpreted as pixels; CSS lengths are also
   * accepted. Defaults to 32px via the `--like-size` custom property, which
   * can also be set in CSS.
   */
  iconSize?: number | string;
  /**
   * Base particle travel duration in milliseconds. Defaults to 350ms via the
   * `--like-duration` custom property, which can also be set in CSS.
   */
  duration?: number;
  /** Classes applied to the heart and burst wrapper. */
  iconClassName?: string;
};

type LikeStyle = React.CSSProperties & {
  "--like-duration"?: string;
  "--like-size"?: string;
};

export function Like({
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
}: LikeProps) {
  const [internalLiked, setInternalLiked] = React.useState(defaultLiked);
  const controlled = liked !== undefined;
  const isLiked = controlled ? liked : internalLiked;
  const previousLikedRef = React.useRef(isLiked);
  const [burstId, setBurstId] = React.useState(0);
  const [burstActive, setBurstActive] = React.useState(false);
  const settledParticlesRef = React.useRef(0);
  const likeStyle: LikeStyle = { ...style };

  if (duration !== undefined) {
    likeStyle["--like-duration"] = `${duration}ms`;
  }

  if (iconSize !== undefined) {
    likeStyle["--like-size"] =
      typeof iconSize === "number" ? `${iconSize}px` : iconSize;
  }

  React.useEffect(() => {
    if (!previousLikedRef.current && isLiked) {
      settledParticlesRef.current = 0;
      setBurstId((current) => current + 1);
      setBurstActive(true);
    }

    previousLikedRef.current = isLiked;
  }, [isLiked]);

  const handleClick = React.useCallback(
    (event: LikeClickEvent) => {
      onClick?.(event);

      if (event.defaultPrevented || disabled) {
        return;
      }

      const nextLiked = !isLiked;

      if (!controlled) {
        setInternalLiked(nextLiked);
      }

      onLikedChange?.(nextLiked);
    }, [controlled, disabled, isLiked, onClick, onLikedChange],
  );

  // The burst leaves the DOM once every particle has finished, so long-lived
  // liked items don't keep 8 idle SVGs mounted.
  const handleBurstAnimationEnd = React.useCallback(
    (event: React.AnimationEvent<HTMLSpanElement>) => {
      if (event.animationName !== "like-particle") return;

      settledParticlesRef.current += 1;

      if (settledParticlesRef.current >= LIKE_PARTICLE_COUNT) {
        setBurstActive(false);
      }
    },
    [],
  );

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
      data-slot="like"
      data-liked={isLiked}
      data-icon-only={children ? undefined : ""}
      className={cn(
        "like relative inline-flex shrink-0 items-center justify-center gap-1.5 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        children ? "w-fit" : "rounded-full text-muted-foreground",
        className,
      )}
      style={likeStyle}
      onClick={handleClick}
      {...props}
    >
      <span
        data-slot="like-icon"
        data-icon={children ? "inline-start" : undefined}
        className={cn("like-icon", iconClassName)}
        aria-hidden="true"
      >
        <HeartIcon
          className="like-heart like-heart-fill size-full"
          fill="currentColor"
        />
        <HeartIcon className="like-heart like-heart-outline size-full" />

        {isLiked && burstActive ? (
          <span
            key={burstId}
            data-slot="like-burst"
            className="like-burst"
            onAnimationEnd={handleBurstAnimationEnd}
          >
            {Array.from({ length: LIKE_PARTICLE_COUNT }, (_, index) => (
              <span className="like-particle" key={index}>
                <HeartIcon
                  className="like-particle-heart size-full"
                  fill="currentColor"
                />
              </span>
            ))}
          </span>
        ) : null}
      </span>

      {children ? <span data-slot="like-content">{children}</span> : null}
    </ButtonPrimitive>
  );
}
