"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
  type SpringOptions,
} from "motion/react";

import { cn } from "@/lib/utils";

export type ContextCursorVariant = "default" | "open" | "drag" | "preview";
export type ContextCursorFollow = "instant" | "spring";

export type ContextCursorState = {
  label: React.ReactNode;
  icon?: React.ReactNode;
  variant?: ContextCursorVariant;
};

export type ContextCursorAnimation = {
  edgeFade?: boolean;
  edgeFadeDistance?: number;
  edgeFadeEasing?: (progress: number) => number;
  hideDelay?: number;
  opacity?: {
    hidden?: number;
    visible?: number;
  };
  scale?: {
    hidden?: number;
    visible?: number;
  };
  opacitySpring?: SpringOptions;
  scaleSpring?: SpringOptions;
};

export type ContextCursorTargetAnimation = Omit<
  ContextCursorAnimation,
  "opacitySpring" | "scaleSpring"
>;

type ContextCursorContextValue = {
  showCursor: (
    cursor: ContextCursorState,
    targetId: string,
    point?: CursorPoint,
    targetBounds?: DOMRectReadOnly,
    targetAnimation?: ContextCursorTargetAnimation,
  ) => void;
  hideCursor: (targetId?: string, point?: CursorPoint) => void;
  isDisabled: boolean;
};

type CursorPoint = {
  x: number;
  y: number;
};

type ResolvedContextCursorAnimation = {
  edgeFade: boolean;
  edgeFadeDistance: number;
  edgeFadeEasing: (progress: number) => number;
  hideDelay: number;
  hiddenOpacity: number;
  visibleOpacity: number;
  hiddenScale: number;
  visibleScale: number;
};

const ContextCursorContext =
  React.createContext<ContextCursorContextValue | null>(null);

const defaultSpring: SpringOptions = {
  mass: 0.1,
  stiffness: 320,
  damping: 26,
};

const opacitySpring: SpringOptions = {
  mass: 0.1,
  stiffness: 480,
  damping: 24,
};

const scaleSpring: SpringOptions = {
  mass: 0.12,
  stiffness: 420,
  damping: 22,
};

const nativeCursorStyleId = "context-cursor-native-hidden";
const defaultEdgeFadeDistance = 40;
const defaultCursorHideDelay = 140;
const defaultHiddenOpacity = 0;
const defaultVisibleOpacity = 1;
const defaultHiddenScale = 0.4;
const defaultVisibleScale = 1;
// Once the edge-fade has shrunk the badge below this much progress it is
// effectively gone, so the native cursor is handed back at that exact point.
const nativeHandoffProgress = 0.08;
let nativeCursorLockCount = 0;

const variantClassNames: Record<ContextCursorVariant, string> = {
  default: "border-border bg-background text-foreground",
  open: "border-transparent bg-primary text-primary-foreground",
  drag: "border-border bg-muted text-foreground",
  preview: "border-border bg-background text-foreground",
};

export type ContextCursorProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "onPointerEnter" | "onPointerLeave" | "onPointerMove"
> & {
  follow?: ContextCursorFollow;
  spring?: SpringOptions;
  animation?: ContextCursorAnimation;
  edgeFadeDistance?: number;
  cursorClassName?: string;
  disabled?: boolean;
};

export function ContextCursor({
  children,
  className,
  cursorClassName,
  follow = "instant",
  spring = defaultSpring,
  animation,
  edgeFadeDistance = defaultEdgeFadeDistance,
  disabled,
  ...props
}: ContextCursorProps) {
  const initialHiddenOpacity =
    animation?.opacity?.hidden ?? defaultHiddenOpacity;
  const initialHiddenScale = animation?.scale?.hidden ?? defaultHiddenScale;
  const shouldReduceMotion = useReducedMotion();
  const supportsFinePointer = useFinePointer();
  const [cursor, setCursor] = React.useState<ContextCursorState | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const bounds = React.useRef<DOMRectReadOnly | null>(null);
  const activeTargetBounds = React.useRef<DOMRectReadOnly | null>(null);
  const activeTargetAnimation =
    React.useRef<ContextCursorTargetAnimation | null>(null);
  const hideTimer = React.useRef<number | null>(null);
  const hasNativeCursorLock = React.useRef(false);
  const activeTargetId = React.useRef<string | null>(null);
  const isDisabled = Boolean(
    disabled || shouldReduceMotion || !supportsFinePointer,
  );
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const opacity = useSpring(
    initialHiddenOpacity,
    animation?.opacitySpring ?? opacitySpring,
  );
  const scale = useSpring(
    initialHiddenScale,
    animation?.scaleSpring ?? scaleSpring,
  );

  const hideNativeCursor = React.useCallback(() => {
    if (hasNativeCursorLock.current) return;

    hasNativeCursorLock.current = true;
    acquireNativeCursorLock();
  }, []);

  const showNativeCursor = React.useCallback(() => {
    if (!hasNativeCursorLock.current) return;

    hasNativeCursorLock.current = false;
    releaseNativeCursorLock();
  }, []);

  const getAnimation = React.useCallback(
    (
      targetAnimation: ContextCursorTargetAnimation | null =
        activeTargetAnimation.current,
    ): ResolvedContextCursorAnimation => ({
      edgeFade: targetAnimation?.edgeFade ?? animation?.edgeFade ?? true,
      edgeFadeDistance:
        targetAnimation?.edgeFadeDistance ??
        animation?.edgeFadeDistance ??
        edgeFadeDistance,
      edgeFadeEasing:
        targetAnimation?.edgeFadeEasing ??
        animation?.edgeFadeEasing ??
        smoothstep,
      hideDelay:
        targetAnimation?.hideDelay ??
        animation?.hideDelay ??
        defaultCursorHideDelay,
      hiddenOpacity:
        targetAnimation?.opacity?.hidden ??
        animation?.opacity?.hidden ??
        defaultHiddenOpacity,
      visibleOpacity:
        targetAnimation?.opacity?.visible ??
        animation?.opacity?.visible ??
        defaultVisibleOpacity,
      hiddenScale:
        targetAnimation?.scale?.hidden ??
        animation?.scale?.hidden ??
        defaultHiddenScale,
      visibleScale:
        targetAnimation?.scale?.visible ??
        animation?.scale?.visible ??
        defaultVisibleScale,
    }),
    [animation, edgeFadeDistance],
  );

  // Drives the badge by how close the pointer is to the target edge: it shrinks
  // and fades as the edge nears, and the native cursor is handed back at the
  // exact moment the badge vanishes — so the two never overlap and there is no
  // gap where neither cursor is visible.
  //
  // Scale and opacity are written with `jump` (not `set`), so the badge size is
  // an exact function of the pointer's distance to the border with zero spring
  // lag. A laggy spring can't keep up with a fast pointer, which is what made
  // the badge finish shrinking *outside* the target; jumping ties the shrink to
  // position, so it always completes inside the box no matter how fast the move.
  const updateCursorPresence = React.useCallback(
    (point: CursorPoint, targetBounds: DOMRectReadOnly) => {
      const currentAnimation = getAnimation();
      const distanceToEdge = Math.min(
        point.x - targetBounds.left,
        targetBounds.right - point.x,
        point.y - targetBounds.top,
        targetBounds.bottom - point.y,
      );
      const fadeDistance = Math.max(1, currentAnimation.edgeFadeDistance);
      const edgeProgress = clamp(distanceToEdge / fadeDistance, 0, 1);
      const easedProgress = currentAnimation.edgeFade
        ? clamp(currentAnimation.edgeFadeEasing(edgeProgress), 0, 1)
        : 1;

      opacity.jump(
        interpolate(
          currentAnimation.hiddenOpacity,
          currentAnimation.visibleOpacity,
          easedProgress,
        ),
      );
      scale.jump(
        interpolate(
          currentAnimation.hiddenScale,
          currentAnimation.visibleScale,
          easedProgress,
        ),
      );

      if (easedProgress <= nativeHandoffProgress) {
        showNativeCursor();
      } else {
        hideNativeCursor();
      }
    },
    [getAnimation, hideNativeCursor, opacity, scale, showNativeCursor],
  );

  const getWrapperBounds = React.useCallback(() => {
    const currentBounds =
      wrapperRef.current?.getBoundingClientRect() ?? bounds.current ?? null;

    if (currentBounds) {
      bounds.current = currentBounds;
    }

    return currentBounds;
  }, []);

  const showCursor = React.useCallback(
    (
      nextCursor: ContextCursorState,
      targetId: string,
      point?: CursorPoint,
      targetBounds?: DOMRectReadOnly,
      targetAnimation?: ContextCursorTargetAnimation,
    ) => {
      if (isDisabled) return;

      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      activeTargetId.current = targetId;
      activeTargetBounds.current = targetBounds ?? null;
      activeTargetAnimation.current = targetAnimation ?? null;
      setCursor(nextCursor);

      const currentWrapperBounds = getWrapperBounds();
      if (point && currentWrapperBounds) {
        rawX.set(Math.round(point.x - currentWrapperBounds.left));
        rawY.set(Math.round(point.y - currentWrapperBounds.top));
      }

      if (point && targetBounds) {
        // Respect edge proximity even on enter, so entering right at the border
        // doesn't snap the badge fully in.
        updateCursorPresence(point, targetBounds);
      } else {
        hideNativeCursor();
        const currentAnimation = getAnimation(targetAnimation ?? null);
        opacity.set(currentAnimation.visibleOpacity);
        scale.set(currentAnimation.visibleScale);
      }
    },
    [
      hideNativeCursor,
      getWrapperBounds,
      isDisabled,
      opacity,
      rawX,
      rawY,
      scale,
      getAnimation,
      updateCursorPresence,
    ],
  );

  const hideCursor = React.useCallback(
    (targetId?: string, point?: CursorPoint) => {
      const targetIdAtLeave = targetId ?? activeTargetId.current;
      if (targetIdAtLeave && activeTargetId.current !== targetIdAtLeave) {
        return;
      }

      const currentAnimation = getAnimation(activeTargetAnimation.current);
      activeTargetBounds.current = null;
      activeTargetAnimation.current = null;

      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }

      const currentBounds = bounds.current;
      if (point && currentBounds) {
        rawX.set(Math.round(point.x - currentBounds.left));
        rawY.set(Math.round(point.y - currentBounds.top));
      }

      // Leaving the target snaps the badge away (no spring tail) and hands the
      // native cursor back on the same frame — so crossing the border reads as
      // an instant switch back to the normal cursor, never a badge shrinking
      // outside the box on a fast exit that skipped the edge-fade band.
      opacity.jump(currentAnimation.hiddenOpacity);
      scale.jump(currentAnimation.hiddenScale);
      showNativeCursor();

      // The badge is already invisible; this only clears the React state once
      // we're sure the pointer hasn't re-entered another target in the meantime.
      hideTimer.current = window.setTimeout(() => {
        if (targetIdAtLeave && activeTargetId.current !== targetIdAtLeave) {
          return;
        }

        activeTargetId.current = null;
        setCursor(null);
        hideTimer.current = null;
      }, currentAnimation.hideDelay);
    },
    [getAnimation, opacity, rawX, rawY, scale, showNativeCursor],
  );

  React.useEffect(() => {
    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
      }
      showNativeCursor();
    };
  }, [showNativeCursor]);

  React.useEffect(() => {
    if (!isDisabled) return;

    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    activeTargetId.current = null;
    activeTargetBounds.current = null;
    activeTargetAnimation.current = null;
    bounds.current = null;
    const currentAnimation = getAnimation(null);
    opacity.set(currentAnimation.hiddenOpacity);
    scale.set(currentAnimation.hiddenScale);
    showNativeCursor();

    hideTimer.current = window.setTimeout(() => {
      setCursor(null);
      hideTimer.current = null;
    }, 0);
  }, [getAnimation, isDisabled, opacity, scale, showNativeCursor]);

  const updateBounds = React.useCallback((element: HTMLDivElement) => {
    bounds.current = element.getBoundingClientRect();
  }, []);

  const handlePointerEnter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isDisabled || event.pointerType !== "mouse") return;

      updateBounds(event.currentTarget);
    },
    [isDisabled, updateBounds],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isDisabled || event.pointerType !== "mouse") return;

      const currentBounds =
        bounds.current ?? event.currentTarget.getBoundingClientRect();

      rawX.set(Math.round(event.clientX - currentBounds.left));
      rawY.set(Math.round(event.clientY - currentBounds.top));

      const currentTargetBounds = activeTargetBounds.current;
      if (currentTargetBounds) {
        updateCursorPresence(
          { x: event.clientX, y: event.clientY },
          currentTargetBounds,
        );
      }
    },
    [isDisabled, rawX, rawY, updateCursorPresence],
  );

  const handlePointerLeave = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") return;

      hideCursor(undefined, { x: event.clientX, y: event.clientY });
      bounds.current = null;
    },
    [hideCursor],
  );

  const handlePointerCancel = React.useCallback(() => {
    bounds.current = null;
    hideCursor();
  }, [hideCursor]);

  const contextValue = React.useMemo<ContextCursorContextValue>(
    () => ({
      showCursor,
      hideCursor,
      isDisabled,
    }),
    [hideCursor, isDisabled, showCursor],
  );
  const variant = cursor?.variant ?? "default";

  return (
    <ContextCursorContext.Provider value={contextValue}>
      <div
        {...props}
        ref={wrapperRef}
        data-slot="context-cursor"
        className={cn("relative", className)}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerCancel}
      >
        {children}
        {follow === "spring" ? (
          <SpringCursorIndicator
            cursor={cursor}
            cursorClassName={cursorClassName}
            opacity={opacity}
            rawX={rawX}
            rawY={rawY}
            scale={scale}
            spring={spring}
            variant={variant}
          />
        ) : (
          <ContextCursorIndicator
            cursor={cursor}
            cursorClassName={cursorClassName}
            opacity={opacity}
            scale={scale}
            variant={variant}
            x={rawX}
            y={rawY}
          />
        )}
      </div>
    </ContextCursorContext.Provider>
  );
}

type ContextCursorIndicatorProps = {
  cursor: ContextCursorState | null;
  cursorClassName?: string;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  variant: ContextCursorVariant;
  x: MotionValue<number>;
  y: MotionValue<number>;
};

function ContextCursorIndicator({
  cursor,
  cursorClassName,
  opacity,
  scale,
  variant,
  x,
  y,
}: ContextCursorIndicatorProps) {
  return (
    <motion.div
      aria-hidden="true"
      data-slot="context-cursor-indicator"
      style={{
        x,
        y,
        opacity,
        scale,
      }}
      className={cn(
        // Anchored to the pointer coordinate; the badge inside is centered on it
        // so it reads as the cursor itself, and the scale pops from that point.
        "pointer-events-none absolute left-0 top-0 z-50 origin-center will-change-transform",
        !cursor && "invisible",
        cursorClassName,
      )}
    >
      <span
        data-slot="context-cursor-label"
        className={cn(
          "inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium leading-5 shadow-sm",
          variantClassNames[variant],
        )}
      >
        {cursor?.icon ? (
          <span
            data-slot="context-cursor-icon"
            className="flex size-3.5 items-center justify-center"
          >
            {cursor.icon}
          </span>
        ) : null}
        {cursor?.label}
      </span>
    </motion.div>
  );
}

type SpringCursorIndicatorProps = Omit<
  ContextCursorIndicatorProps,
  "x" | "y"
> & {
  rawX: MotionValue<number>;
  rawY: MotionValue<number>;
  spring: SpringOptions;
};

function SpringCursorIndicator({
  rawX,
  rawY,
  spring,
  ...props
}: SpringCursorIndicatorProps) {
  const x = useSpring(rawX, spring);
  const y = useSpring(rawY, spring);

  return <ContextCursorIndicator {...props} x={x} y={y} />;
}

function useFinePointer() {
  const [supportsFinePointer, setSupportsFinePointer] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateSupportsFinePointer = () => {
      setSupportsFinePointer(mediaQuery.matches);
    };

    updateSupportsFinePointer();
    mediaQuery.addEventListener("change", updateSupportsFinePointer);

    return () => {
      mediaQuery.removeEventListener("change", updateSupportsFinePointer);
    };
  }, []);

  return supportsFinePointer;
}

function acquireNativeCursorLock() {
  nativeCursorLockCount += 1;
  ensureNativeCursorStyle();
  document.documentElement.dataset.contextCursorNativeHidden = "true";
}

function releaseNativeCursorLock() {
  nativeCursorLockCount = Math.max(0, nativeCursorLockCount - 1);

  if (nativeCursorLockCount === 0) {
    delete document.documentElement.dataset.contextCursorNativeHidden;
  }
}

function ensureNativeCursorStyle() {
  if (document.getElementById(nativeCursorStyleId)) return;

  const style = document.createElement("style");
  style.id = nativeCursorStyleId;
  style.textContent = `
    html[data-context-cursor-native-hidden="true"],
    html[data-context-cursor-native-hidden="true"] * {
      cursor: none !important;
    }
  `;
  document.head.appendChild(style);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export type ContextCursorTargetProps =
  React.ComponentPropsWithoutRef<"div"> & {
    label: React.ReactNode;
    icon?: React.ReactNode;
    variant?: ContextCursorVariant;
    animation?: ContextCursorTargetAnimation;
  };

export function ContextCursorTarget({
  children,
  className,
  label,
  icon,
  variant = "default",
  animation,
  onPointerEnter,
  onPointerLeave,
  ...props
}: ContextCursorTargetProps) {
  const context = React.useContext(ContextCursorContext);
  const targetId = React.useId();

  return (
    <div
      data-slot="context-cursor-target"
      className={className}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          context?.showCursor(
            { label, icon, variant },
            targetId,
            {
              x: event.clientX,
              y: event.clientY,
            },
            event.currentTarget.getBoundingClientRect(),
            animation,
          );
        }
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        context?.hideCursor(targetId, {
          x: event.clientX,
          y: event.clientY,
        });
        onPointerLeave?.(event);
      }}
      {...props}
    >
      {children}
    </div>
  );
}
