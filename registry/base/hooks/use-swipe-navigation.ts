"use client";

import { useCallback, useEffect, useRef } from "react";

export type SwipeNavigationDirection = "previous" | "next";

export type SwipeNavigationProgress = {
  direction: SwipeNavigationDirection;
  /** Horizontal travel from the gesture origin, in pixels. */
  deltaX: number;
  /** Vertical travel from the gesture origin, in pixels. */
  deltaY: number;
  /** Average horizontal speed since touch start, in pixels per millisecond. */
  velocity: number;
  /** Distance-threshold progress clamped from 0 to 1. */
  progress: number;
  /** Damped offset a custom renderer can apply; zero under reduced motion. */
  feedbackX: number;
  available: boolean;
  reduceMotion: boolean;
};

export type SwipeNavigationFeedbackOptions = {
  /** Set false to keep calculations but let the consumer render feedback. */
  enabled?: boolean;
  /** Maximum visual travel while navigation is available, in pixels. */
  distance?: number;
  /** Multiplier applied to finger travel while navigation is available. */
  resistance?: number;
  /** Maximum visual travel past an unavailable edge, in pixels. */
  edgeDistance?: number;
  /** Multiplier applied to finger travel past an unavailable edge. */
  edgeResistance?: number;
  /** Return-to-origin duration for an uncommitted swipe, in milliseconds. */
  resetDuration?: number;
  /** CSS easing used when an uncommitted swipe returns to its origin. */
  resetEasing?: string;
};

type SwipeState = {
  touchIdentifier: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startedAt: number;
  axis: "pending" | "horizontal" | "vertical";
  reduceMotion: boolean;
};

export type UseSwipeNavigationOptions<
  T extends HTMLElement = HTMLElement,
> = {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  disabled?: boolean;
  ignoreOwnedGestures?: boolean;
  /** Adds app-specific gesture ownership on top of the built-in exclusions. */
  shouldIgnoreTarget?: (target: EventTarget | null, boundary: T) => boolean;
  onIntentChange?: (direction: SwipeNavigationDirection | null) => void;
  /** Emits live gesture metrics, then `null` when tracking ends. */
  onSwipeProgress?: (progress: SwipeNavigationProgress | null) => void;
  /** Minimum horizontal travel, in pixels, before a swipe navigates. */
  distanceThreshold?: number;
  /** Minimum pixels per millisecond for a shorter flick to navigate. */
  velocityThreshold?: number;
  /** Finger travel before the hook chooses horizontal or vertical movement. */
  directionLockThreshold?: number;
  /** Horizontal movement must exceed vertical movement by this ratio. */
  directionLockRatio?: number;
  /** Built-in transform feedback, or `false` when the consumer renders it. */
  feedback?: boolean | SwipeNavigationFeedbackOptions;
  /** @deprecated Use `feedback.distance`. */
  feedbackDistance?: number;
  /** @deprecated Use `feedback.resistance`. */
  feedbackResistance?: number;
};

const DEFAULT_DISTANCE_THRESHOLD = 52;
const DEFAULT_VELOCITY_THRESHOLD = 0.35;
const DEFAULT_DIRECTION_LOCK_THRESHOLD = 8;
const DEFAULT_DIRECTION_LOCK_RATIO = 1.25;
const DEFAULT_FEEDBACK_DISTANCE = 16;
const DEFAULT_FEEDBACK_RESISTANCE = 0.2;
const DEFAULT_EDGE_FEEDBACK_DISTANCE = 8;
const DEFAULT_EDGE_FEEDBACK_RESISTANCE = 0.08;
const DEFAULT_RESET_DURATION = 140;
const DEFAULT_RESET_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";
const OWNED_GESTURE_SELECTOR = [
  "input",
  "textarea",
  "select",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='slider']",
  "[draggable='true']",
  "video[controls]",
  "audio[controls]",
  "[data-swipe-navigation='ignore']",
].join(",");

/**
 * Recognizes one-finger horizontal touch gestures without taking over vertical
 * scrolling. A non-passive touchmove listener lets nested horizontal controls
 * keep their own gestures while the surrounding surface remains swipeable.
 */
export function useSwipeNavigation<T extends HTMLElement>({
  onPrevious,
  onNext,
  hasPrevious = true,
  hasNext = true,
  disabled = false,
  ignoreOwnedGestures = false,
  shouldIgnoreTarget,
  onIntentChange,
  onSwipeProgress,
  distanceThreshold = DEFAULT_DISTANCE_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
  directionLockThreshold = DEFAULT_DIRECTION_LOCK_THRESHOLD,
  directionLockRatio = DEFAULT_DIRECTION_LOCK_RATIO,
  feedback = true,
  feedbackDistance,
  feedbackResistance,
}: UseSwipeNavigationOptions<T>) {
  const elementRef = useRef<T>(null);
  const swipeStateRef = useRef<SwipeState | null>(null);
  const suppressClickRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const callbacksRef = useRef({
    onPrevious,
    onNext,
    onIntentChange,
    onSwipeProgress,
    shouldIgnoreTarget,
  });
  const feedbackOptions = typeof feedback === "object" ? feedback : undefined;
  const feedbackEnabled =
    feedback !== false && feedbackOptions?.enabled !== false;
  const resolvedFeedbackDistance = nonNegative(
    feedbackOptions?.distance ??
      feedbackDistance ??
      DEFAULT_FEEDBACK_DISTANCE,
  );
  const resolvedFeedbackResistance = nonNegative(
    feedbackOptions?.resistance ??
      feedbackResistance ??
      DEFAULT_FEEDBACK_RESISTANCE,
  );
  const edgeFeedbackDistance = nonNegative(
    feedbackOptions?.edgeDistance ?? DEFAULT_EDGE_FEEDBACK_DISTANCE,
  );
  const edgeFeedbackResistance = nonNegative(
    feedbackOptions?.edgeResistance ?? DEFAULT_EDGE_FEEDBACK_RESISTANCE,
  );
  const resetDuration = nonNegative(
    feedbackOptions?.resetDuration ?? DEFAULT_RESET_DURATION,
  );
  const resetEasing =
    feedbackOptions?.resetEasing?.trim() || DEFAULT_RESET_EASING;
  const resolvedDistanceThreshold = nonNegative(distanceThreshold);
  const resolvedVelocityThreshold = nonNegative(velocityThreshold);
  const resolvedDirectionLockThreshold = nonNegative(directionLockThreshold);
  const resolvedDirectionLockRatio = nonNegative(directionLockRatio);

  useEffect(() => {
    callbacksRef.current = {
      onPrevious,
      onNext,
      onIntentChange,
      onSwipeProgress,
      shouldIgnoreTarget,
    };
  }, [
    onIntentChange,
    onNext,
    onPrevious,
    onSwipeProgress,
    shouldIgnoreTarget,
  ]);

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current === null) return;

    window.clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = null;
  }, []);

  const clearFeedbackStyles = useCallback((element = elementRef.current) => {
    if (!element) return;

    element.style.removeProperty("transition");
    element.style.removeProperty("transform");
    element.style.removeProperty("will-change");
  }, []);

  const resetSwipePosition = useCallback(() => {
    const element = elementRef.current;

    if (!element) return;

    if (!feedbackEnabled) {
      clearResetTimeout();
      clearFeedbackStyles();
      return;
    }

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const resetsInstantly = reduceMotion || resetDuration === 0;

    element.style.transition = resetsInstantly
      ? "none"
      : `transform ${resetDuration}ms ${resetEasing}`;
    element.style.transform = "translate3d(0, 0, 0)";

    clearResetTimeout();
    resetTimeoutRef.current = window.setTimeout(() => {
      clearFeedbackStyles();
      resetTimeoutRef.current = null;
    }, resetsInstantly ? 0 : resetDuration + 20);
  }, [
    clearFeedbackStyles,
    clearResetTimeout,
    feedbackEnabled,
    resetDuration,
    resetEasing,
  ]);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || disabled) {
      swipeStateRef.current = null;
      callbacksRef.current.onIntentChange?.(null);
      clearResetTimeout();
      clearFeedbackStyles();
      return;
    }

    const swipeElement = element;
    let currentIntent: SwipeNavigationDirection | null = null;
    let hasActiveProgress = false;

    function updateIntent(direction: SwipeNavigationDirection | null) {
      if (currentIntent === direction) return;

      currentIntent = direction;
      callbacksRef.current.onIntentChange?.(direction);
    }

    function updateProgress(progress: SwipeNavigationProgress | null) {
      if (progress === null && !hasActiveProgress) return;

      hasActiveProgress = progress !== null;
      callbacksRef.current.onSwipeProgress?.(progress);
    }

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        const state = swipeStateRef.current;

        if (state) {
          updateIntent(null);
          updateProgress(null);
          if (state.axis === "horizontal") {
            resetSwipePosition();
          } else {
            clearFeedbackStyles();
          }
        }

        swipeStateRef.current = null;
        return;
      }

      if (
        callbacksRef.current.shouldIgnoreTarget?.(
          event.target,
          swipeElement,
        ) ||
        (ignoreOwnedGestures &&
          ownsHorizontalGesture(event.target, swipeElement))
      ) {
        swipeStateRef.current = null;
        return;
      }

      const touch = event.touches[0];

      if (!touch) return;

      clearResetTimeout();
      swipeElement.style.removeProperty("transition");
      const reduceMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
        false;

      if (feedbackEnabled && !reduceMotion) {
        swipeElement.style.willChange = "transform";
      }

      swipeStateRef.current = {
        touchIdentifier: touch.identifier,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        startedAt: performance.now(),
        axis: "pending",
        reduceMotion,
      };
    }

    function handleTouchMove(event: TouchEvent) {
      const state = swipeStateRef.current;

      if (!state) return;

      const touch = findTouch(event.touches, state.touchIdentifier);

      if (!touch) return;

      state.currentX = touch.clientX;
      state.currentY = touch.clientY;

      const deltaX = state.currentX - state.startX;
      const deltaY = state.currentY - state.startY;

      if (
        state.axis === "pending" &&
        Math.max(Math.abs(deltaX), Math.abs(deltaY)) >=
          resolvedDirectionLockThreshold
      ) {
        state.axis =
          Math.abs(deltaX) > Math.abs(deltaY) * resolvedDirectionLockRatio
            ? "horizontal"
            : "vertical";
      }

      if (state.axis !== "horizontal") {
        if (state.axis === "vertical") {
          updateIntent(null);
          updateProgress(null);
        }
        return;
      }

      event.preventDefault();

      const direction = getDirection(deltaX);
      const available = direction === "previous" ? hasPrevious : hasNext;
      const resistance = available
        ? resolvedFeedbackResistance
        : edgeFeedbackResistance;
      const maximumDistance = available
        ? resolvedFeedbackDistance
        : edgeFeedbackDistance;
      const visualFeedbackX = clamp(
        deltaX * resistance,
        -maximumDistance,
        maximumDistance,
      );
      const elapsed = Math.max(performance.now() - state.startedAt, 1);
      const velocity = Math.abs(deltaX) / elapsed;
      const feedbackX = state.reduceMotion ? 0 : visualFeedbackX;

      updateIntent(direction);
      updateProgress({
        direction,
        deltaX,
        deltaY,
        velocity,
        progress: getDistanceProgress(deltaX, resolvedDistanceThreshold),
        feedbackX,
        available,
        reduceMotion: state.reduceMotion,
      });
      if (feedbackEnabled && !state.reduceMotion) {
        swipeElement.style.transform = `translate3d(${feedbackX}px, 0, 0)`;
      }
    }

    function finishTouch(event: TouchEvent, cancelled: boolean) {
      const state = swipeStateRef.current;

      if (!state) return;

      const touch = findTouch(event.changedTouches, state.touchIdentifier);

      if (touch) {
        state.currentX = touch.clientX;
        state.currentY = touch.clientY;
      }

      const deltaX = state.currentX - state.startX;
      const elapsed = Math.max(performance.now() - state.startedAt, 1);
      const velocity = Math.abs(deltaX) / elapsed;
      const direction = getDirection(deltaX);
      const available = direction === "previous" ? hasPrevious : hasNext;
      const navigates =
        !cancelled &&
        available &&
        state.axis === "horizontal" &&
        (Math.abs(deltaX) >= resolvedDistanceThreshold ||
          (Math.abs(deltaX) >= resolvedDistanceThreshold / 2 &&
            velocity >= resolvedVelocityThreshold));

      suppressClickRef.current =
        state.axis === "horizontal" &&
        Math.abs(deltaX) >= resolvedDirectionLockThreshold;
      swipeStateRef.current = null;
      updateIntent(null);
      updateProgress(null);

      if (navigates) {
        clearFeedbackStyles();

        if (direction === "previous") {
          callbacksRef.current.onPrevious();
        } else {
          callbacksRef.current.onNext();
        }
      } else if (state.axis === "horizontal") {
        resetSwipePosition();
      } else {
        clearFeedbackStyles();
      }

      if (suppressClickRef.current) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
    }

    function handleTouchEnd(event: TouchEvent) {
      finishTouch(event, false);
    }

    function handleTouchCancel(event: TouchEvent) {
      finishTouch(event, true);
    }

    function handleClick(event: MouseEvent) {
      if (!suppressClickRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }

    swipeElement.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    swipeElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    swipeElement.addEventListener("touchend", handleTouchEnd);
    swipeElement.addEventListener("touchcancel", handleTouchCancel);
    swipeElement.addEventListener("click", handleClick, true);

    return () => {
      swipeElement.removeEventListener("touchstart", handleTouchStart);
      swipeElement.removeEventListener("touchmove", handleTouchMove);
      swipeElement.removeEventListener("touchend", handleTouchEnd);
      swipeElement.removeEventListener("touchcancel", handleTouchCancel);
      swipeElement.removeEventListener("click", handleClick, true);
      swipeStateRef.current = null;
      updateIntent(null);
      updateProgress(null);
      clearResetTimeout();
      clearFeedbackStyles(swipeElement);
    };
  }, [
    clearFeedbackStyles,
    clearResetTimeout,
    edgeFeedbackDistance,
    edgeFeedbackResistance,
    disabled,
    feedbackEnabled,
    hasNext,
    hasPrevious,
    ignoreOwnedGestures,
    resetSwipePosition,
    resolvedDirectionLockThreshold,
    resolvedDirectionLockRatio,
    resolvedDistanceThreshold,
    resolvedFeedbackDistance,
    resolvedFeedbackResistance,
    resolvedVelocityThreshold,
  ]);

  return elementRef;
}

function ownsHorizontalGesture(target: EventTarget | null, boundary: HTMLElement) {
  if (!(target instanceof Element)) return false;

  const ownedGestureTarget = target.closest(OWNED_GESTURE_SELECTOR);

  if (ownedGestureTarget && boundary.contains(ownedGestureTarget)) return true;

  let current: HTMLElement | null =
    target instanceof HTMLElement ? target : target.parentElement;

  while (current && current !== boundary) {
    const style = window.getComputedStyle(current);
    const ownsTouchGesture =
      style.touchAction === "none" || style.touchAction.includes("pan-x");
    const scrollsHorizontally =
      (style.overflowX === "auto" || style.overflowX === "scroll") &&
      current.scrollWidth > current.clientWidth;

    if (ownsTouchGesture || scrollsHorizontally) return true;

    current = current.parentElement;
  }

  return false;
}

function findTouch(touches: TouchList, identifier: number) {
  for (let index = 0; index < touches.length; index += 1) {
    const touch = touches.item(index);

    if (touch?.identifier === identifier) return touch;
  }

  return null;
}

function getDirection(deltaX: number): SwipeNavigationDirection {
  return deltaX > 0 ? "previous" : "next";
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function nonNegative(value: number) {
  return Math.max(value, 0);
}

function getDistanceProgress(deltaX: number, distanceThreshold: number) {
  const distance = Math.abs(deltaX);

  if (distanceThreshold <= 0) return distance > 0 ? 1 : 0;

  return clamp(distance / distanceThreshold, 0, 1);
}
