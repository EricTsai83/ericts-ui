"use client";

import * as React from "react";

import { RailList, type RailListItem } from "@/components/ui/rail-list";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

import "./ripple-scene.css";

export type RippleSceneImage = {
  src: string;
  alt: string;
};

export type RippleSceneItem = {
  /** Stable value used by controlled state and callbacks. */
  value: string;
  /** Short label rendered in the horizontal selector. */
  label: string;
  /** Main scene heading. */
  title: string;
  /** Optional supporting copy below the heading. */
  description?: string;
  /** Optional context shown above the heading. */
  overline?: string;
  image: RippleSceneImage;
  imagePosition?: React.CSSProperties["objectPosition"];
};

export interface RippleSceneProps
  extends Omit<React.ComponentProps<"section">, "onChange"> {
  items: readonly RippleSceneItem[];
  /** Controlled selected scene value. */
  value?: string;
  /** Initial selected scene value for uncontrolled usage. */
  defaultValue?: string;
  /** Called when a scene is selected. */
  onValueChange?: (value: string, item: RippleSceneItem) => void;
  /** Accessible label for the scene selector. */
  selectorLabel?: string;
  /** Small persistent label in the stage header. */
  stageLabel?: string;
  /** Message displayed when no scenes are provided. */
  emptyLabel?: string;
}

/** Number of vertical strips the wave is built from. */
const STRIP_COUNT = 12;
/** Per-strip delay that makes the wave travel across the scene. */
const STRIP_STAGGER_MS = 26;
/**
 * animationName of a strip's ripple. When the last strip in the wave
 * finishes, the new scene is promoted to the static base layer. Must match
 * the CSS keyframes name.
 */
const RIPPLE_SETTLE_ANIMATION = "ripple-scene-strip";
/**
 * Safety net for when animationend never arrives (hidden tabs pause CSS
 * animations; user styles may disable them). Must exceed the full wave:
 * strip duration + last strip's delay.
 */
const SETTLE_FALLBACK_MS = 1600;

type MediaStage = {
  /** Scene rendered as the static, untransformed base layer. */
  base: string;
  /** Scene currently rippling in above the base, if any. */
  incoming: string | null;
};

export function RippleScene({
  items,
  value,
  defaultValue,
  onValueChange,
  selectorLabel = "Choose a scene",
  stageLabel = "Selected stories",
  emptyLabel = "No scenes available",
  className,
  ...props
}: RippleSceneProps) {
  const reactId = React.useId();
  const panelId = `${reactId}-panel`;
  const shouldReduceMotion = useReducedMotion();
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

  // The previous scene stays put as a static base layer while the next scene
  // ripples in above it, so at most one scene is ever animating.
  const [media, setMedia] = React.useState<MediaStage>({
    base: selectedValue,
    incoming: null,
  });
  const shownValue = media.incoming ?? media.base;
  const selectedSrc = selectedItem?.image.src;

  React.useEffect(() => {
    if (!selectedSrc || shownValue === selectedValue) return;

    let cancelled = false;

    // Decode off-screen first so the wave never competes with image decoding.
    const commit = () => {
      if (cancelled) return;

      setMedia((previous) =>
        shouldReduceMotion
          ? { base: selectedValue, incoming: null }
          : { base: previous.incoming ?? previous.base, incoming: selectedValue },
      );
    };

    const image = new window.Image();
    image.src = selectedSrc;

    if (typeof image.decode === "function") {
      image.decode().then(commit, commit);
    } else {
      commit();
    }

    return () => {
      cancelled = true;
    };
  }, [selectedSrc, selectedValue, shownValue, shouldReduceMotion]);

  React.useEffect(() => {
    if (!media.incoming) return;

    const staged = media.incoming;
    const timer = window.setTimeout(() => {
      setMedia((previous) =>
        previous.incoming === staged
          ? { base: staged, incoming: null }
          : previous,
      );
    }, SETTLE_FALLBACK_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [media.incoming]);

  const handleRippleSettle = React.useCallback(
    (event: React.AnimationEvent<HTMLDivElement>) => {
      if (event.animationName !== RIPPLE_SETTLE_ANIMATION) return;

      setMedia((previous) =>
        previous.incoming
          ? { base: previous.incoming, incoming: null }
          : previous,
      );
    },
    [],
  );

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

  const preloadScene = React.useCallback(
    (railItem: RailListItem) => {
      if (typeof window === "undefined") return;

      const src = items.find((item) => item.value === railItem.value)?.image
        .src;

      if (!src) return;

      const image = new window.Image();
      image.src = src;
      image.decode?.().catch(() => {});
    },
    [items],
  );

  const selectorItems = React.useMemo<RailListItem[]>(
    () =>
      items.map((item, index) => ({
        value: item.value,
        label: item.label,
        id: `${reactId}-tab-${index}`,
        ariaControls: panelId,
      })),
    [items, panelId, reactId],
  );

  if (!selectedItem) {
    return (
      <section
        data-slot="ripple-scene"
        className={cn("ripple-scene ripple-scene--empty", className)}
        {...props}
      >
        <p>{emptyLabel}</p>
      </section>
    );
  }

  const activeTabId = `${reactId}-tab-${selectedIndex}`;
  const baseItem =
    items.find((item) => item.value === media.base) ?? selectedItem;
  const incomingItem = media.incoming
    ? items.find((item) => item.value === media.incoming)
    : undefined;

  // The wave travels toward the newly selected scene: forward selections
  // sweep left-to-right, backward selections sweep right-to-left.
  const baseIndex = items.findIndex((item) => item.value === media.base);
  const incomingIndex = incomingItem
    ? items.findIndex((item) => item.value === incomingItem.value)
    : -1;
  const forward = incomingIndex >= baseIndex;
  const settleStrip = forward ? STRIP_COUNT - 1 : 0;
  const stripWidth = 100 / STRIP_COUNT;

  return (
    <section
      data-slot="ripple-scene"
      data-motion={shouldReduceMotion ? "reduced" : "full"}
      className={cn("ripple-scene", className)}
      {...props}
    >
      <div
        className="ripple-scene__media"
        role="img"
        aria-label={selectedItem.image.alt}
      >
        <div className="ripple-scene__scene ripple-scene__scene--base">
          {/* Registry blocks stay framework-neutral, so consumers can choose their own image loader. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            src={baseItem.image.src}
            draggable={false}
            className="ripple-scene__image"
            style={{ objectPosition: baseItem.imagePosition }}
          />
        </div>
        {incomingItem ? (
          <div
            key={incomingItem.value}
            aria-hidden="true"
            className="ripple-scene__scene ripple-scene__scene--ripple"
          >
            {Array.from({ length: STRIP_COUNT }, (_, index) => {
              const order = forward ? index : STRIP_COUNT - 1 - index;
              // Strips overlap by a hair so no hairline shows once settled.
              const left = Math.max(0, index * stripWidth - 0.06);
              const right = Math.max(0, 100 - (index + 1) * stripWidth - 0.06);

              return (
                <div
                  key={index}
                  className="ripple-scene__strip"
                  data-settle={index === settleStrip ? "true" : undefined}
                  onAnimationEnd={
                    index === settleStrip ? handleRippleSettle : undefined
                  }
                  style={
                    {
                      clipPath: `inset(0 ${right}% 0 ${left}%)`,
                      transformOrigin: `${(index + 0.5) * stripWidth}% 50%`,
                      "--ripple-scene-delay": `${order * STRIP_STAGGER_MS}ms`,
                    } as React.CSSProperties
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    src={incomingItem.image.src}
                    draggable={false}
                    className="ripple-scene__image"
                    style={{ objectPosition: incomingItem.imagePosition }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    src={baseItem.image.src}
                    draggable={false}
                    className="ripple-scene__image ripple-scene__face--out"
                    style={{ objectPosition: baseItem.imagePosition }}
                  />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div aria-hidden="true" className="ripple-scene__scrim" />

      <div className="ripple-scene__chrome">
        <header className="ripple-scene__header">
          <p>{stageLabel}</p>
          <p aria-live="polite" aria-atomic="true">
            <span className="sr-only">Scene </span>
            {String(selectedIndex + 1).padStart(2, "0")}
            <span aria-hidden="true"> / </span>
            <span className="sr-only">of </span>
            {String(items.length).padStart(2, "0")}
          </p>
        </header>

        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={activeTabId}
          className="ripple-scene__content"
        >
          <div key={selectedItem.value} className="ripple-scene__content-inner">
            {selectedItem.overline ? (
              <p className="ripple-scene__overline">{selectedItem.overline}</p>
            ) : null}
            <h2>{selectedItem.title}</h2>
            {selectedItem.description ? (
              <p className="ripple-scene__description">
                {selectedItem.description}
              </p>
            ) : null}
          </div>
        </div>

        <RailList
          items={selectorItems}
          value={selectedValue}
          onValueChange={selectValue}
          onItemPointerEnter={preloadScene}
          onItemFocus={preloadScene}
          aria-label={selectorLabel}
          edge="top"
          className="ripple-scene__selector"
          itemClassName="ripple-scene__tab"
          indicatorClassName="ripple-scene__tab-indicator"
        />
      </div>
    </section>
  );
}
