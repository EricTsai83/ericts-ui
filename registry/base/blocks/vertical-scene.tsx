"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  SlidingList,
  type SlidingListItem,
} from "@/components/ui/sliding-list";
import { cn } from "@/lib/utils";

import "./vertical-scene.css";

export type VerticalSceneImage = {
  src: string;
  alt: string;
};

export type VerticalSceneItem = {
  /** Stable value used by controlled state and callbacks. */
  value: string;
  /** Short label rendered in the scene selector. */
  label: string;
  /** Main heading displayed over the active scene. */
  title: string;
  /** Optional supporting copy below the heading. */
  description?: string;
  /** Optional context displayed above the heading. */
  context?: string;
  image: VerticalSceneImage;
  imagePosition?: React.CSSProperties["objectPosition"];
};

export interface VerticalSceneProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "onChange"> {
  items: readonly VerticalSceneItem[];
  /** Controlled selected scene value. */
  value?: string;
  /** Initial selected scene value for uncontrolled usage. */
  defaultValue?: string;
  /** Called when a scene is selected. */
  onValueChange?: (value: string, item: VerticalSceneItem) => void;
  /** Accessible label for the scene selector. */
  selectorLabel?: string;
  /** Persistent label displayed in the stage header. */
  stageLabel?: string;
  /** Message displayed when no scenes are provided. */
  emptyLabel?: string;
};

type SceneDirection = -1 | 0 | 1;

type SceneTransitionState = {
  value: string;
  index: number;
  direction: Exclude<SceneDirection, 0>;
};

const MEDIA_EASE = [0.77, 0, 0.18, 1] as const;
const CONTENT_EASE = [0.22, 1, 0.36, 1] as const;
const MEDIA_DURATION = 0.56;
const CONTENT_ENTER_DURATION = 0.5;
const CONTENT_ENTER_DELAY = 0.12;
const CONTENT_EXIT_DURATION = 0.22;

const mediaLayerVariants = {
  enter: (direction: SceneDirection) => ({
    transform: `translate3d(0, ${direction * 100}%, 0)`,
  }),
  center: { transform: "translate3d(0, 0%, 0)" },
  exit: (direction: SceneDirection) => ({
    transform: `translate3d(0, ${direction * -5}%, 0)`,
  }),
};

const mediaImageVariants = {
  enter: (direction: SceneDirection) => ({
    transform:
      direction === 0
        ? "translate3d(0, 0%, 0) scale(1)"
        : `translate3d(0, ${direction * -100}%, 0) scale(1.04)`,
  }),
  center: { transform: "translate3d(0, 0%, 0) scale(1)" },
  exit: { transform: "translate3d(0, 0%, 0) scale(1.02)" },
};

const contentVariants = {
  enter: (direction: SceneDirection) => ({
    opacity: direction === 0 ? 1 : 0,
    transform: `translate3d(0, ${direction * 28}px, 0)`,
  }),
  // The outgoing copy clears quickly while the incoming copy waits a beat,
  // then glides in so it settles together with the media pan.
  center: (direction: SceneDirection) => ({
    opacity: 1,
    transform: "translate3d(0, 0px, 0)",
    transition:
      direction === 0
        ? { duration: 0 }
        : {
            duration: CONTENT_ENTER_DURATION,
            ease: CONTENT_EASE,
            delay: CONTENT_ENTER_DELAY,
          },
  }),
  exit: (direction: SceneDirection) => ({
    opacity: 0,
    transform: `translate3d(0, ${direction * -14}px, 0)`,
    transition:
      direction === 0
        ? { duration: 0 }
        : { duration: CONTENT_EXIT_DURATION, ease: CONTENT_EASE },
  }),
};

export function VerticalScene({
  items,
  value,
  defaultValue,
  onValueChange,
  selectorLabel = "Choose a scene",
  stageLabel = "Scene collection",
  emptyLabel = "No scenes available",
  className,
  ...props
}: VerticalSceneProps) {
  const reactId = React.useId();
  const panelId = `${reactId}-panel`;
  const shouldReduceMotion = useReducedMotion() === true;
  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? items[0]?.value ?? "",
  );
  const controlled = value !== undefined;
  const selectedValue = controlled ? value : internalValue;
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === selectedValue),
  );
  const selectedItem = items[selectedIndex];
  const selectorItems = React.useMemo<SlidingListItem[]>(
    () =>
      items.map((item, index) => ({
        value: item.value,
        label: item.label,
        id: `${reactId}-tab-${index}`,
        ariaControls: panelId,
      })),
    [items, panelId, reactId],
  );
  const [transitionState, setTransitionState] =
    React.useState<SceneTransitionState>(() => ({
      value: selectedValue,
      index: selectedIndex,
      direction: 1,
    }));
  let direction = transitionState.direction;

  if (
    transitionState.value !== selectedValue ||
    transitionState.index !== selectedIndex
  ) {
    direction = selectedIndex < transitionState.index ? -1 : 1;
    setTransitionState({
      value: selectedValue,
      index: selectedIndex,
      direction,
    });
  }

  const motionDirection: SceneDirection = shouldReduceMotion ? 0 : direction;

  const selectValue = React.useCallback(
    (nextValue: string) => {
      const nextItem = items.find((item) => item.value === nextValue);

      if (!nextItem) return;

      if (!controlled) {
        setInternalValue(nextItem.value);
      }

      if (nextItem.value !== selectedItem?.value) {
        onValueChange?.(nextItem.value, nextItem);
      }
    },
    [controlled, items, onValueChange, selectedItem?.value],
  );

  const preloadImage = React.useCallback((src: string) => {
    if (typeof window === "undefined") return;

    const image = new window.Image();
    image.src = src;
  }, []);

  const preloadScene = React.useCallback(
    (item: SlidingListItem) => {
      const scene = items.find((candidate) => candidate.value === item.value);

      if (scene) {
        preloadImage(scene.image.src);
      }
    },
    [items, preloadImage],
  );

  if (!selectedItem) {
    return (
      <section
        data-slot="vertical-scene"
        className={cn("vertical-scene vertical-scene--empty", className)}
        {...props}
      >
        <p>{emptyLabel}</p>
      </section>
    );
  }

  const activeTabId = `${reactId}-tab-${selectedIndex}`;
  const mediaTransition = {
    duration: shouldReduceMotion ? 0 : MEDIA_DURATION,
    ease: MEDIA_EASE,
  };

  return (
    <section
      data-slot="vertical-scene"
      data-direction={direction === 1 ? "down" : "up"}
      data-motion={shouldReduceMotion ? "reduced" : "full"}
      className={cn("vertical-scene", className)}
      {...props}
    >
      <div
        className="vertical-scene__media"
        role="img"
        aria-label={selectedItem.image.alt}
      >
        <AnimatePresence
          initial={false}
          mode="sync"
          custom={motionDirection}
        >
          <motion.div
            key={selectedItem.value}
            className="vertical-scene__media-layer"
            custom={motionDirection}
            variants={mediaLayerVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={mediaTransition}
          >
            <motion.img
              aria-hidden="true"
              alt=""
              src={selectedItem.image.src}
              draggable={false}
              className="vertical-scene__image"
              style={{ objectPosition: selectedItem.imagePosition }}
              custom={motionDirection}
              variants={mediaImageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={mediaTransition}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div aria-hidden="true" className="vertical-scene__scrim" />

      <div className="vertical-scene__chrome">
        <header className="vertical-scene__header">
          <p>{stageLabel}</p>
          <p aria-live="polite" aria-atomic="true">
            <span className="sr-only">Scene </span>
            {selectedIndex + 1}
            <span aria-hidden="true"> of </span>
            <span className="sr-only">of </span>
            {items.length}
          </p>
        </header>

        <div className="vertical-scene__body">
          <SlidingList
            items={selectorItems}
            value={selectedValue}
            onValueChange={selectValue}
            onItemPointerEnter={preloadScene}
            onItemFocus={preloadScene}
            aria-label={selectorLabel}
            className="vertical-scene__selector"
            itemClassName="vertical-scene__tab"
            indicatorClassName="vertical-scene__tab-indicator"
          />

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={activeTabId}
            className="vertical-scene__content"
          >
            <AnimatePresence
              initial={false}
              mode="popLayout"
              custom={motionDirection}
            >
              <motion.div
                key={selectedItem.value}
                custom={motionDirection}
                variants={contentVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="vertical-scene__content-inner"
              >
                {selectedItem.context ? (
                  <p className="vertical-scene__context">
                    {selectedItem.context}
                  </p>
                ) : null}
                <h2>{selectedItem.title}</h2>
                {selectedItem.description ? (
                  <p className="vertical-scene__description">
                    {selectedItem.description}
                  </p>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
