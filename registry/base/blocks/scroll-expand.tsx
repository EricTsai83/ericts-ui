"use client";

import * as React from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { cn } from "@/lib/utils";

import "./scroll-expand.css";

export type ScrollExpandMediaType = "image" | "video";
export type ScrollExpandDirection = "expand" | "focus";
export type ScrollExpandFrameShape = "rounded" | "circle";
export type ScrollExpandAlignment = "start" | "center" | "end";
export type ScrollExpandContentPosition = "center" | "bottom";
export type ScrollExpandContentLayer = "frame" | "stage";
export type ScrollExpandStartPosition = {
  /** Horizontal center of the resting frame, as a stage percentage. */
  x?: number;
  /** Vertical center of the resting frame, as a stage percentage. */
  y?: number;
};

type ScrollExpandItemRegistry = {
  register: (node: HTMLDivElement) => void;
  unregister: (node: HTMLDivElement) => void;
};

const ScrollExpandItemContext = React.createContext<
  ScrollExpandItemRegistry | undefined
>(undefined);

export interface ScrollExpandProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "title" | "onProgress"
  > {
  src?: string;
  mediaType?: ScrollExpandMediaType;
  /** Expand a detail into context, or focus full-bleed context into a detail. */
  direction?: ScrollExpandDirection;
  /** Shape used by the resting or focused frame. */
  frameShape?: ScrollExpandFrameShape;
  poster?: string;
  alt?: string;
  title?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startPosition?: ScrollExpandStartPosition;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  mediaPosition?: React.CSSProperties["objectPosition"];
  /** Pivot used while the media zooms, useful for keeping an off-center subject aligned. */
  mediaTransformOrigin?: React.CSSProperties["transformOrigin"];
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  titleAlign?: ScrollExpandAlignment;
  /** Additional classes for sizing or styling the overlaid title. */
  titleClassName?: string;
  contentAlign?: ScrollExpandAlignment;
  contentPosition?: ScrollExpandContentPosition;
  /** Keep content clipped to the media, or place it over the whole stage. */
  contentLayer?: ScrollExpandContentLayer;
  useWindowScroll?: boolean;
  enabled?: boolean;
  /** Receives the same raw 0–1 progress used by the internal choreography. */
  onProgress?: (progress: number) => void;
}

export interface ScrollExpandItemProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /** Scroll progress where this item starts entering. */
  start?: number;
  /** Scroll progress where this item finishes entering. */
  end?: number;
  /** Vertical travel in px before the item settles. */
  offsetY?: number;
  /** Initial scale before the item settles at `1`. */
  scaleFrom?: number;
}

type MotionValues = {
  startWidth: number;
  startHeight: number;
  startX: number;
  startY: number;
  startInsetTop: number;
  startInsetRight: number;
  startInsetBottom: number;
  startInsetLeft: number;
  startRadius: number;
  endRadius: number;
  mediaZoom: number;
  overlayScrim: number;
};

const DEFAULT_MOTION_VALUES: MotionValues = {
  startWidth: 42,
  startHeight: 58,
  startX: 50,
  startY: 50,
  startInsetTop: 21,
  startInsetRight: 29,
  startInsetBottom: 21,
  startInsetLeft: 29,
  startRadius: 24,
  endRadius: 0,
  mediaZoom: 1.35,
  overlayScrim: 0.45,
};

export function ScrollExpand({
  src = "",
  mediaType = "image",
  direction = "expand",
  frameShape = "rounded",
  poster = "",
  alt = "",
  title = "",
  scrollHint = "",
  startWidth = 42,
  startHeight = 58,
  startPosition,
  startRadius = DEFAULT_MOTION_VALUES.startRadius,
  endRadius = DEFAULT_MOTION_VALUES.endRadius,
  mediaZoom = DEFAULT_MOTION_VALUES.mediaZoom,
  mediaPosition = "center",
  mediaTransformOrigin = "center",
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = DEFAULT_MOTION_VALUES.overlayScrim,
  titleAlign = "center",
  titleClassName,
  contentAlign = "center",
  contentPosition = "center",
  contentLayer = "frame",
  useWindowScroll = false,
  enabled = true,
  onProgress,
  children,
  className,
  style,
  tabIndex,
  role,
  "aria-label": ariaLabel,
  ...props
}: ScrollExpandProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const mediaRef = React.useRef<HTMLElement | null>(null);
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const scrimRef = React.useRef<HTMLDivElement>(null);
  const hintRef = React.useRef<HTMLDivElement>(null);
  const itemNodesRef = React.useRef(new Set<HTMLDivElement>());
  const stageSizeRef = React.useRef({ width: 0, height: 0 });
  const progressRef = React.useRef(enabled ? 0 : 1);
  const prefersReducedMotion = useReducedMotion();
  const motionEnabled = enabled && !prefersReducedMotion;
  const startX = startPosition?.x ?? 50;
  const startY = startPosition?.y ?? 50;

  const motionValues = React.useMemo<MotionValues>(
    () => {
      const width = clamp(finiteNumber(startWidth, 42), 0, 100);
      const height = clamp(finiteNumber(startHeight, 58), 0, 100);
      const left = clamp(
        finiteNumber(startX, 50) - width / 2,
        0,
        100 - width,
      );
      const top = clamp(
        finiteNumber(startY, 50) - height / 2,
        0,
        100 - height,
      );

      return {
        startWidth: width,
        startHeight: height,
        startX: finiteNumber(startX, 50),
        startY: finiteNumber(startY, 50),
        startInsetTop: top,
        startInsetRight: 100 - left - width,
        startInsetBottom: 100 - top - height,
        startInsetLeft: left,
        startRadius: Math.max(0, finiteNumber(startRadius, 24)),
        endRadius: Math.max(0, finiteNumber(endRadius, 0)),
        mediaZoom: Math.max(0.01, finiteNumber(mediaZoom, 1.35)),
        overlayScrim: clamp(finiteNumber(overlayScrim, 0.45), 0, 1),
      };
    },
    [
      endRadius,
      mediaZoom,
      overlayScrim,
      startHeight,
      startRadius,
      startWidth,
      startX,
      startY,
    ],
  );

  const applyItemProgress = React.useCallback(
    (node: HTMLDivElement, progress: number) => {
      const start = clamp(
        finiteNumber(Number(node.dataset.start), 0.64),
        0,
        1,
      );
      const end = clamp(
        finiteNumber(Number(node.dataset.end), 0.94),
        start,
        1,
      );
      const offsetY = finiteNumber(Number(node.dataset.offsetY), 24);
      const scaleFrom = Math.max(
        0.01,
        finiteNumber(Number(node.dataset.scaleFrom), 0.98),
      );
      const revealProgress = smoothstep(start, end, progress);

      node.style.opacity = `${revealProgress}`;
      node.style.transform = `translate3d(0, ${offsetY * (1 - revealProgress)}px, 0) scale(${scaleFrom + (1 - scaleFrom) * revealProgress})`;
    },
    [],
  );

  const itemRegistry = React.useMemo<ScrollExpandItemRegistry>(
    () => ({
      register: (node) => {
        itemNodesRef.current.add(node);
        applyItemProgress(node, progressRef.current);
      },
      unregister: (node) => {
        itemNodesRef.current.delete(node);
      },
    }),
    [applyItemProgress],
  );

  const applyProgress = React.useCallback((progress: number) => {
    const frame = frameRef.current;
    const media = mediaRef.current;

    if (!frame || !media) {
      return;
    }

    progressRef.current = progress;
    rootRef.current?.style.setProperty(
      "--scroll-expand-progress",
      String(progress),
    );
    onProgress?.(progress);

    const values = motionValues;
    const geometry = resolveFrameGeometry(
      values,
      frameShape,
      stageSizeRef.current,
    );
    const eased = smoothstep(0, 1, progress);
    const frameProgress = motionEnabled
      ? direction === "focus"
        ? 1 - eased
        : eased
      : 1;
    const remainingInset = 1 - frameProgress;
    const insetTop = geometry.insetTop * remainingInset;
    const insetRight = geometry.insetRight * remainingInset;
    const insetBottom = geometry.insetBottom * remainingInset;
    const insetLeft = geometry.insetLeft * remainingInset;
    const radius =
      geometry.startRadius +
      (values.endRadius - geometry.startRadius) * frameProgress;

    frame.style.clipPath = `inset(${insetTop}${geometry.unit} ${insetRight}${geometry.unit} ${insetBottom}${geometry.unit} ${insetLeft}${geometry.unit} round ${radius}px)`;
    media.style.transform = `scale(${values.mediaZoom + (1 - values.mediaZoom) * frameProgress})`;

    if (scrimRef.current) {
      const scrimProgress = smoothstep(0.38, 1, progress);
      scrimRef.current.style.opacity = `${values.overlayScrim * scrimProgress}`;
    }

    if (titleRef.current) {
      const exitProgress = smoothstep(0.32, 0.74, progress);
      titleRef.current.style.opacity = `${1 - exitProgress}`;
      titleRef.current.style.transform = `translate3d(0, ${-22 * exitProgress}px, 0) scale(${1 - 0.04 * exitProgress})`;
    }

    if (hintRef.current) {
      const exitProgress = smoothstep(0, 0.12, progress);
      hintRef.current.style.opacity = `${1 - exitProgress}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * exitProgress}px, 0)`;
    }

    if (overlayRef.current) {
      const enterProgress = smoothstep(0.56, 0.9, progress);
      const isHidden = enterProgress < 0.98;

      overlayRef.current.style.opacity = `${enterProgress}`;
      overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - enterProgress)}px, 0)`;
      overlayRef.current.toggleAttribute("inert", isHidden);
      overlayRef.current.setAttribute("aria-hidden", String(isHidden));
    }

    itemNodesRef.current.forEach((node) => {
      applyItemProgress(node, progress);
    });
  }, [applyItemProgress, direction, frameShape, motionEnabled, motionValues, onProgress]);

  const handleMeasure = React.useCallback(
    (viewportHeight: number) => {
      const track = trackRef.current;
      const stage = stageRef.current;

      if (!track || !stage) {
        return;
      }

      stageSizeRef.current = {
        width: rootRef.current?.clientWidth ?? 0,
        height: viewportHeight,
      };

      const expansion = Math.max(0, finiteNumber(scrollDistance, 1.2));
      const hold = Math.max(0, finiteNumber(holdDistance, 0.35));
      const trackMultiplier = motionEnabled ? 1 + expansion + hold : 1;

      stage.style.height = `${viewportHeight}px`;
      track.style.height = `${roundPixel(viewportHeight * trackMultiplier)}px`;
    },
    [holdDistance, motionEnabled, scrollDistance],
  );

  const { measure } = useScrollProgress({
    containerRef: rootRef,
    trackRef,
    source: useWindowScroll ? "window" : "container",
    distance: Math.max(0.01, finiteNumber(scrollDistance, 1.2)),
    smoothing: Math.max(0, finiteNumber(smoothing, 0.1)),
    enabled: motionEnabled,
    disabledProgress: 1,
    onProgress: applyProgress,
    onMeasure: handleMeasure,
  });

  const hasChildren = Boolean(children);

  React.useEffect(() => {
    measure();
  }, [
    endRadius,
    direction,
    frameShape,
    handleMeasure,
    mediaZoom,
    measure,
    overlayScrim,
    startHeight,
    startRadius,
    startWidth,
    startX,
    startY,
    title,
    scrollHint,
    hasChildren,
  ]);

  React.useEffect(() => {
    if (mediaType !== "video" || !(mediaRef.current instanceof HTMLVideoElement)) {
      return;
    }

    const video = mediaRef.current;

    if (prefersReducedMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      // Autoplay can be blocked by the browser; the poster remains visible.
    });
  }, [mediaType, prefersReducedMotion, src]);

  const setMediaRef = React.useCallback((node: HTMLElement | null) => {
    mediaRef.current = node;
  }, []);
  const nestedScroller = motionEnabled && !useWindowScroll;
  const rootStyle = {
    "--scroll-expand-progress": motionEnabled ? 0 : 1,
    "--scroll-expand-inset-top": `${motionValues.startInsetTop}%`,
    "--scroll-expand-inset-right": `${motionValues.startInsetRight}%`,
    "--scroll-expand-inset-bottom": `${motionValues.startInsetBottom}%`,
    "--scroll-expand-inset-left": `${motionValues.startInsetLeft}%`,
    "--scroll-expand-start-radius": `${motionValues.startRadius}px`,
    "--scroll-expand-end-radius": `${motionValues.endRadius}px`,
    "--scroll-expand-media-zoom": motionValues.mediaZoom,
    ...style,
  } as React.CSSProperties;
  const overlay = children ? (
    <ScrollExpandItemContext.Provider value={itemRegistry}>
      <div
        ref={overlayRef}
        className="scroll-expand__overlay"
        data-align={contentAlign}
        data-position={contentPosition}
        data-layer={contentLayer}
        aria-hidden="true"
        inert
      >
        {children}
      </div>
    </ScrollExpandItemContext.Provider>
  ) : null;

  return (
    <div
      ref={rootRef}
      data-slot="scroll-expand"
      data-direction={direction}
      data-frame-shape={frameShape}
      data-motion={motionEnabled ? "enabled" : "disabled"}
      className={cn(
        "scroll-expand",
        nestedScroller && "scroll-expand--scroller",
        className,
      )}
      style={rootStyle}
      tabIndex={tabIndex ?? (nestedScroller ? 0 : undefined)}
      role={role ?? (nestedScroller ? "region" : undefined)}
      aria-label={
        ariaLabel ??
        (nestedScroller ? title || "Scroll-controlled media" : undefined)
      }
      {...props}
    >
      <div ref={trackRef} className="scroll-expand__track">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            {src ? (
              mediaType === "video" ? (
                <video
                  ref={setMediaRef}
                  className="scroll-expand__media"
                  src={src}
                  poster={poster || undefined}
                  aria-label={alt || undefined}
                  aria-hidden={alt ? undefined : true}
                  autoPlay={!prefersReducedMotion}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  style={{
                    objectPosition: mediaPosition,
                    transformOrigin: mediaTransformOrigin,
                  }}
                />
              ) : (
                // Native media keeps the registry block framework-agnostic.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={setMediaRef}
                  className="scroll-expand__media"
                  src={src}
                  alt={alt}
                  draggable={false}
                  style={{
                    objectPosition: mediaPosition,
                    transformOrigin: mediaTransformOrigin,
                  }}
                />
              )
            ) : (
              <div
                ref={setMediaRef}
                className="scroll-expand__media scroll-expand__media--empty"
                aria-hidden="true"
              />
            )}
            <div
              ref={scrimRef}
              className="scroll-expand__scrim"
              aria-hidden="true"
            />
            {contentLayer === "frame" ? overlay : null}
          </div>
          {contentLayer === "stage" ? overlay : null}
          {title ? (
            <h2
              ref={titleRef}
              className={cn("scroll-expand__title", titleClassName)}
              data-align={titleAlign}
            >
              {title}
            </h2>
          ) : null}
          {scrollHint ? (
            <div
              ref={hintRef}
              className="scroll-expand__hint"
              aria-hidden="true"
            >
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ScrollExpandItem({
  start = 0.64,
  end = 0.94,
  offsetY = 24,
  scaleFrom = 0.98,
  className,
  style,
  ...props
}: ScrollExpandItemProps) {
  const registry = React.useContext(ScrollExpandItemContext);
  const itemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const node = itemRef.current;

    if (!node || !registry) {
      return;
    }

    registry.register(node);

    return () => {
      registry.unregister(node);
    };
  }, [registry]);

  const managed = Boolean(registry);
  const itemStyle = managed
    ? ({
        "--scroll-expand-item-offset-y": `${offsetY}px`,
        "--scroll-expand-item-scale": scaleFrom,
        ...style,
      } as React.CSSProperties)
    : style;

  return (
    <div
      ref={itemRef}
      data-scroll-expand-item={managed ? "" : undefined}
      data-start={managed ? clamp(start, 0, 1) : undefined}
      data-end={managed ? clamp(end, 0, 1) : undefined}
      data-offset-y={managed ? offsetY : undefined}
      data-scale-from={managed ? scaleFrom : undefined}
      className={cn(managed && "scroll-expand__item", className)}
      style={itemStyle}
      {...props}
    />
  );
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = clamp(
    (value - edgeStart) / (edgeEnd - edgeStart || 1e-6),
    0,
    1,
  );

  return progress * progress * (3 - 2 * progress);
}

function resolveFrameGeometry(
  values: MotionValues,
  shape: ScrollExpandFrameShape,
  stageSize: { width: number; height: number },
) {
  if (shape !== "circle" || stageSize.width <= 0 || stageSize.height <= 0) {
    return {
      insetTop: values.startInsetTop,
      insetRight: values.startInsetRight,
      insetBottom: values.startInsetBottom,
      insetLeft: values.startInsetLeft,
      startRadius: values.startRadius,
      unit: "%",
    } as const;
  }

  const diameter = Math.min(
    stageSize.width * (values.startWidth / 100),
    stageSize.height * (values.startHeight / 100),
  );
  const left = clamp(
    stageSize.width * (values.startX / 100) - diameter / 2,
    0,
    stageSize.width - diameter,
  );
  const top = clamp(
    stageSize.height * (values.startY / 100) - diameter / 2,
    0,
    stageSize.height - diameter,
  );

  return {
    insetTop: top,
    insetRight: stageSize.width - left - diameter,
    insetBottom: stageSize.height - top - diameter,
    insetLeft: left,
    startRadius: diameter / 2,
    unit: "px",
  } as const;
}

function finiteNumber(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

function roundPixel(value: number) {
  return Math.round(value * 1000) / 1000;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default ScrollExpand;
