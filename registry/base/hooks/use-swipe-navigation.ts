"use client";

import { useCallback, useEffect, useRef } from "react";

export type SwipeNavigationDirection = "previous" | "next";

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

export type UseSwipeNavigationOptions = {
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  disabled?: boolean;
  ignoreOwnedGestures?: boolean;
  onIntentChange?: (direction: SwipeNavigationDirection | null) => void;
  distanceThreshold?: number;
  velocityThreshold?: number;
  directionLockThreshold?: number;
  feedbackDistance?: number;
};

const DEFAULT_DISTANCE_THRESHOLD = 52;
const DEFAULT_VELOCITY_THRESHOLD = 0.35;
const DEFAULT_DIRECTION_LOCK_THRESHOLD = 8;
const DEFAULT_FEEDBACK_DISTANCE = 16;
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
  onIntentChange,
  distanceThreshold = DEFAULT_DISTANCE_THRESHOLD,
  velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
  directionLockThreshold = DEFAULT_DIRECTION_LOCK_THRESHOLD,
  feedbackDistance = DEFAULT_FEEDBACK_DISTANCE,
}: UseSwipeNavigationOptions) {
  const elementRef = useRef<T>(null);
  const swipeStateRef = useRef<SwipeState | null>(null);
  const suppressClickRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current === null) return;

    window.clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = null;
  }, []);

  const clearFeedbackStyles = useCallback(() => {
    const element = elementRef.current;

    if (!element) return;

    element.style.removeProperty("transition");
    element.style.removeProperty("transform");
    element.style.removeProperty("will-change");
  }, []);

  const resetSwipePosition = useCallback(() => {
    const element = elementRef.current;

    if (!element) return;

    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    element.style.transition = reduceMotion
      ? "none"
      : "transform 140ms cubic-bezier(0.16, 1, 0.3, 1)";
    element.style.transform = "translate3d(0, 0, 0)";

    clearResetTimeout();
    resetTimeoutRef.current = window.setTimeout(() => {
      clearFeedbackStyles();
      resetTimeoutRef.current = null;
    }, reduceMotion ? 0 : 160);
  }, [clearFeedbackStyles, clearResetTimeout]);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || disabled) {
      swipeStateRef.current = null;
      onIntentChange?.(null);
      clearResetTimeout();
      clearFeedbackStyles();
      return;
    }

    const swipeElement = element;
    let currentIntent: SwipeNavigationDirection | null = null;

    function updateIntent(direction: SwipeNavigationDirection | null) {
      if (currentIntent === direction) return;

      currentIntent = direction;
      onIntentChange?.(direction);
    }

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        if (swipeStateRef.current) {
          updateIntent(null);
          resetSwipePosition();
        }

        swipeStateRef.current = null;
        return;
      }

      if (
        ignoreOwnedGestures &&
        ownsHorizontalGesture(event.target, swipeElement)
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

      if (!reduceMotion) {
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
        Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= directionLockThreshold
      ) {
        state.axis =
          Math.abs(deltaX) > Math.abs(deltaY) * 1.25
            ? "horizontal"
            : "vertical";
      }

      if (state.axis !== "horizontal") return;

      event.preventDefault();

      const direction = getDirection(deltaX);
      const available = direction === "previous" ? hasPrevious : hasNext;
      const resistance = available ? 0.2 : 0.08;
      const maximumDistance = available
        ? feedbackDistance
        : Math.min(feedbackDistance, 8);
      const feedbackX = clamp(
        deltaX * resistance,
        -maximumDistance,
        maximumDistance,
      );

      updateIntent(direction);
      if (!state.reduceMotion) {
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
        (Math.abs(deltaX) >= distanceThreshold ||
          (Math.abs(deltaX) >= distanceThreshold / 2 &&
            velocity >= velocityThreshold));

      suppressClickRef.current =
        state.axis === "horizontal" &&
        Math.abs(deltaX) >= directionLockThreshold;
      swipeStateRef.current = null;
      updateIntent(null);
      resetSwipePosition();

      if (navigates) {
        if (direction === "previous") {
          onPrevious();
        } else {
          onNext();
        }
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
      clearResetTimeout();
      clearFeedbackStyles();
    };
  }, [
    clearFeedbackStyles,
    clearResetTimeout,
    directionLockThreshold,
    disabled,
    distanceThreshold,
    feedbackDistance,
    hasNext,
    hasPrevious,
    ignoreOwnedGestures,
    onIntentChange,
    onNext,
    onPrevious,
    resetSwipePosition,
    velocityThreshold,
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
