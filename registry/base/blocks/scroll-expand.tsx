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

/**
 * The subject of the shot, as a percentage of the media's own dimensions.
 *
 * `startPosition` lives in stage space while the subject lives in image space,
 * so a `cover` crop pulls them apart as soon as the stage aspect ratio changes.
 * Naming the subject here lets the media pan itself under the frame instead.
 */
export type ScrollExpandFocalPoint = {
  x?: number;
  y?: number;
};

/**
 * Choreography values re-tuned for a narrow, portrait stage. The frame geometry
 * is computed in JavaScript, so a container query cannot reach it — a phone
 * needs its own numbers rather than a scaled-down desktop composition.
 */
export type ScrollExpandCompactOverrides = {
  startWidth?: number;
  startHeight?: number;
  startPosition?: ScrollExpandStartPosition;
  focalPoint?: ScrollExpandFocalPoint;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  mediaPosition?: React.CSSProperties["objectPosition"];
  mediaTransformOrigin?: React.CSSProperties["transformOrigin"];
  scrollDistance?: number;
  holdDistance?: number;
  overlayScrim?: number;
  titleAlign?: ScrollExpandAlignment;
  contentAlign?: ScrollExpandAlignment;
  contentPosition?: ScrollExpandContentPosition;
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
    React.ComponentProps<"div">,
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
  /**
   * Anchor the media to its subject rather than to the stage. When set, the
   * media covers the stage and pans so this point sits under the frame center
   * at every stage size, and `mediaPosition` / `mediaTransformOrigin` are
   * ignored. Requires a `mediaZoom` of at least `1`.
   */
  focalPoint?: ScrollExpandFocalPoint;
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
  /** Choreography overrides applied while the stage is narrower than `compactAt`. */
  compact?: ScrollExpandCompactOverrides;
  /** Stage width in px below which `compact` applies. */
  compactAt?: number;
  /**
   * Drive the scroll from the page instead of a nested scroller. Prefer this on
   * touch devices, where a nested scroller traps momentum and chains awkwardly.
   */
  useWindowScroll?: boolean;
  enabled?: boolean;
  /**
   * Honour `prefers-reduced-motion` by settling on the resting composition.
   * Set to `false` only where the viewer has explicitly asked to see the motion.
   */
  respectReducedMotion?: boolean;
  /** Receives the same raw 0–1 progress used by the internal choreography. */
  onProgress?: (progress: number) => void;
}

export interface ScrollExpandItemProps
  extends React.ComponentProps<"div"> {
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
  focalPoint,
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
  compact,
  compactAt = 640,
  useWindowScroll = false,
  enabled = true,
  respectReducedMotion = true,
  onProgress,
  children,
  className,
  style,
  tabIndex,
  role,
  "aria-label": ariaLabel,
  ref,
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
  const mediaSizeRef = React.useRef({ width: 0, height: 0 });
  const mediaBoxRef = React.useRef({
    active: false,
    originX: 0,
    originY: 0,
    boxWidth: 0,
    boxHeight: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const progressRef = React.useRef(enabled ? 0 : 1);
  const [isCompact, setIsCompact] = React.useState(false);
  const systemReducedMotion = useReducedMotion();
  const prefersReducedMotion = systemReducedMotion && respectReducedMotion;
  const motionEnabled = enabled && !prefersReducedMotion;

  // Resolved one scalar at a time so an inline `compact` object literal does not
  // invalidate the memos and callbacks below on every render.
  const overrides = isCompact ? compact : undefined;
  const startX = overrides?.startPosition?.x ?? startPosition?.x ?? 50;
  const startY = overrides?.startPosition?.y ?? startPosition?.y ?? 50;
  const resolvedFocalPoint = overrides?.focalPoint ?? focalPoint;
  const focalX = resolvedFocalPoint
    ? clamp(finiteNumber(resolvedFocalPoint.x ?? 50, 50), 0, 100) / 100
    : null;
  const focalY = resolvedFocalPoint
    ? clamp(finiteNumber(resolvedFocalPoint.y ?? 50, 50), 0, 100) / 100
    : null;
  const resolvedStartWidth = overrides?.startWidth ?? startWidth;
  const resolvedStartHeight = overrides?.startHeight ?? startHeight;
  const resolvedStartRadius = overrides?.startRadius ?? startRadius;
  const resolvedEndRadius = overrides?.endRadius ?? endRadius;
  const resolvedMediaZoom = overrides?.mediaZoom ?? mediaZoom;
  const resolvedMediaPosition = overrides?.mediaPosition ?? mediaPosition;
  const resolvedMediaTransformOrigin =
    overrides?.mediaTransformOrigin ?? mediaTransformOrigin;
  const resolvedScrollDistance = overrides?.scrollDistance ?? scrollDistance;
  const resolvedHoldDistance = overrides?.holdDistance ?? holdDistance;
  const resolvedOverlayScrim = overrides?.overlayScrim ?? overlayScrim;
  const resolvedTitleAlign = overrides?.titleAlign ?? titleAlign;
  const resolvedContentAlign = overrides?.contentAlign ?? contentAlign;
  const resolvedContentPosition = overrides?.contentPosition ?? contentPosition;

  const motionValues = React.useMemo<MotionValues>(
    () => {
      const width = clamp(finiteNumber(resolvedStartWidth, 42), 0, 100);
      const height = clamp(finiteNumber(resolvedStartHeight, 58), 0, 100);
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
        startRadius: Math.max(0, finiteNumber(resolvedStartRadius, 24)),
        endRadius: Math.max(0, finiteNumber(resolvedEndRadius, 0)),
        mediaZoom: Math.max(0.01, finiteNumber(resolvedMediaZoom, 1.35)),
        overlayScrim: clamp(finiteNumber(resolvedOverlayScrim, 0.45), 0, 1),
      };
    },
    [
      resolvedEndRadius,
      resolvedMediaZoom,
      resolvedOverlayScrim,
      resolvedStartHeight,
      resolvedStartRadius,
      resolvedStartWidth,
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
    // Progress is pinned to 1 while motion is off, so both directions settle on
    // their own end state: full bleed for `expand`, the detail frame for `focus`.
    const frameProgress = direction === "focus" ? 1 - eased : eased;
    const remainingInset = 1 - frameProgress;
    const insetTop = geometry.insetTop * remainingInset;
    const insetRight = geometry.insetRight * remainingInset;
    const insetBottom = geometry.insetBottom * remainingInset;
    const insetLeft = geometry.insetLeft * remainingInset;
    const radius =
      geometry.startRadius +
      (values.endRadius - geometry.startRadius) * frameProgress;

    frame.style.clipPath = `inset(${insetTop}${geometry.unit} ${insetRight}${geometry.unit} ${insetBottom}${geometry.unit} ${insetLeft}${geometry.unit} round ${radius}px)`;

    const zoom = values.mediaZoom + (1 - values.mediaZoom) * frameProgress;
    const box = mediaBoxRef.current;

    if (box.active) {
      // The zoom pivots on the subject and the offset that parks the subject on
      // its target is a constant, so nothing here depends on progress: the media
      // only ever scales. `handleMeasure` sizes the box so this offset already
      // covers the stage at the shallowest zoom, which is what removes the pan
      // a minimal cover box would otherwise force near full bleed.
      media.style.transform = `translate3d(${roundPixel(box.offsetX)}px, ${roundPixel(box.offsetY)}px, 0) scale(${zoom})`;
    } else {
      media.style.transform = `scale(${zoom})`;
    }

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
  }, [applyItemProgress, direction, frameShape, motionValues, onProgress]);

  const handleMeasure = React.useCallback(
    (viewportHeight: number) => {
      const track = trackRef.current;
      const stage = stageRef.current;

      if (!track || !stage) {
        return;
      }

      const stageWidth = rootRef.current?.clientWidth ?? 0;

      stageSizeRef.current = { width: stageWidth, height: viewportHeight };

      if (stageWidth > 0) {
        setIsCompact(stageWidth < Math.max(0, finiteNumber(compactAt, 640)));
      }

      // Focal mode grows the media to the full cover box so the crop can be
      // chosen here, once, rather than by `object-fit` reacting to the stage
      // aspect ratio. The box keeps the media's own ratio, so nothing stretches.
      const media = mediaRef.current;
      const intrinsic = mediaSizeRef.current;

      if (
        media &&
        focalX !== null &&
        focalY !== null &&
        stageWidth > 0 &&
        intrinsic.width > 0 &&
        intrinsic.height > 0
      ) {
        const coverScale = Math.max(
          stageWidth / intrinsic.width,
          viewportHeight / intrinsic.height,
        );
        // Where the subject wants to sit: the centre of the resting detail
        // frame. Fixed for the whole scroll, so the media is never chased around
        // by the frame centre as it travels.
        const restX =
          ((motionValues.startInsetLeft + motionValues.startWidth / 2) / 100) *
          stageWidth;
        const restY =
          ((motionValues.startInsetTop + motionValues.startHeight / 2) / 100) *
          viewportHeight;
        // Holding the subject on that target with a constant offset is what
        // makes the travel a pure zoom. It only stays coverage-legal if the box
        // is big enough to absorb the offset at the shallowest zoom the media is
        // ever drawn at, so solve each stage edge for the box width it needs and
        // take the largest. A minimal cover box is the floor.
        const zoomFloor = Math.min(1, motionValues.mediaZoom);
        const zoomCeiling = Math.max(1, motionValues.mediaZoom);
        const scale = Math.min(
          Math.max(
            coverScale,
            edgeScale(restX, focalX, intrinsic.width, zoomFloor),
            edgeScale(stageWidth - restX, 1 - focalX, intrinsic.width, zoomFloor),
            edgeScale(restY, focalY, intrinsic.height, zoomFloor),
            edgeScale(
              viewportHeight - restY,
              1 - focalY,
              intrinsic.height,
              zoomFloor,
            ),
          ),
          // A subject pinned against its own edge can ask for an unbounded box.
          // Stop at the coverage the old pan reached at its widest zoom — past
          // that the request is unsatisfiable at any size, and the clamp below
          // keeps the stage covered instead.
          (coverScale * zoomCeiling) / zoomFloor,
        );
        const boxWidth = intrinsic.width * scale;
        const boxHeight = intrinsic.height * scale;
        const subjectX = focalX * boxWidth;
        const subjectY = focalY * boxHeight;
        // Only bites for the unsatisfiable configurations above.
        const offsetX = clamp(
          restX - subjectX,
          stageWidth - subjectX - zoomFloor * (boxWidth - subjectX),
          subjectX * (zoomFloor - 1),
        );
        const offsetY = clamp(
          restY - subjectY,
          viewportHeight - subjectY - zoomFloor * (boxHeight - subjectY),
          subjectY * (zoomFloor - 1),
        );

        mediaBoxRef.current = {
          active: true,
          originX: subjectX,
          originY: subjectY,
          boxWidth,
          boxHeight,
          offsetX,
          offsetY,
        };
        media.style.width = `${roundPixel(boxWidth)}px`;
        media.style.height = `${roundPixel(boxHeight)}px`;
        media.style.transformOrigin = `${roundPixel(subjectX)}px ${roundPixel(subjectY)}px`;
      } else {
        mediaBoxRef.current = {
          active: false,
          originX: 0,
          originY: 0,
          boxWidth: 0,
          boxHeight: 0,
          offsetX: 0,
          offsetY: 0,
        };

        if (media) {
          media.style.width = "";
          media.style.height = "";
        }
      }

      const expansion = Math.max(0, finiteNumber(resolvedScrollDistance, 1.2));
      const hold = Math.max(0, finiteNumber(resolvedHoldDistance, 0.35));
      const trackMultiplier = motionEnabled ? 1 + expansion + hold : 1;

      stage.style.height = `${viewportHeight}px`;
      track.style.height = `${roundPixel(viewportHeight * trackMultiplier)}px`;
    },
    [
      compactAt,
      focalX,
      focalY,
      motionEnabled,
      motionValues,
      resolvedHoldDistance,
      resolvedScrollDistance,
    ],
  );

  const { measure } = useScrollProgress({
    containerRef: rootRef,
    trackRef,
    source: useWindowScroll ? "window" : "container",
    distance: Math.max(0.01, finiteNumber(resolvedScrollDistance, 1.2)),
    smoothing: Math.max(0, finiteNumber(smoothing, 0.1)),
    enabled: motionEnabled,
    disabledProgress: 1,
    onProgress: applyProgress,
    onMeasure: handleMeasure,
  });

  const handleMediaLoad = React.useCallback(() => {
    const media = mediaRef.current;

    if (!media) {
      return;
    }

    const width =
      media instanceof HTMLVideoElement
        ? media.videoWidth
        : media instanceof HTMLImageElement
          ? media.naturalWidth
          : 0;
    const height =
      media instanceof HTMLVideoElement
        ? media.videoHeight
        : media instanceof HTMLImageElement
          ? media.naturalHeight
          : 0;
    const current = mediaSizeRef.current;

    if (
      width <= 0 ||
      height <= 0 ||
      (current.width === width && current.height === height)
    ) {
      return;
    }

    mediaSizeRef.current = { width, height };
    measure();
  }, [measure]);

  // Covers media that was already complete on mount, where `load` never fires.
  React.useEffect(() => {
    handleMediaLoad();
  }, [handleMediaLoad, mediaType, src]);

  const hasChildren = Boolean(children);

  React.useEffect(() => {
    measure();
  }, [
    direction,
    frameShape,
    handleMeasure,
    measure,
    resolvedEndRadius,
    resolvedMediaZoom,
    resolvedOverlayScrim,
    resolvedStartHeight,
    resolvedStartRadius,
    resolvedStartWidth,
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
  // The root node is the scroll container and progress target internally, and
  // consumers may want it too, so the consumer's ref is merged in.
  const setRootRef = React.useCallback(
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
  // In focal mode the element is grown to the cover box by `handleMeasure`, so
  // it is anchored top-left and left to overflow. `object-fit: cover` from the
  // stylesheet stays put deliberately: the sized box already carries the media's
  // ratio, and before the intrinsic size is known it still crops rather than
  // stretches. The transform origin is the subject, and is written on measure.
  const mediaStyle: React.CSSProperties =
    focalX !== null
      ? { right: "auto", bottom: "auto" }
      : {
          objectPosition: resolvedMediaPosition,
          transformOrigin: resolvedMediaTransformOrigin,
        };
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
        data-align={resolvedContentAlign}
        data-position={resolvedContentPosition}
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
      ref={setRootRef}
      data-slot="scroll-expand"
      data-direction={direction}
      data-frame-shape={frameShape}
      data-motion={motionEnabled ? "enabled" : "disabled"}
      data-size={isCompact ? "compact" : "regular"}
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
                  onLoadedMetadata={handleMediaLoad}
                  style={mediaStyle}
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
                  onLoad={handleMediaLoad}
                  style={mediaStyle}
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
              data-align={resolvedTitleAlign}
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

/**
 * Smallest box scale that still reaches `edge` from a subject sitting `share` of
 * the way across the media, at zoom `zoom`. A subject flush against that edge
 * (`share` of zero) can never reach it, so it contributes no constraint at all.
 */
function edgeScale(
  edge: number,
  share: number,
  intrinsicSize: number,
  zoom: number,
) {
  if (share <= 0 || intrinsicSize <= 0 || zoom <= 0) {
    return 0;
  }

  return edge / (zoom * share * intrinsicSize);
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
