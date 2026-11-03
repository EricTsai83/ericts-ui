"use client";

import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";

import { cn } from "@/lib/utils";

import "./stroke-trace.css";

/**
 * - `draw`: draws in when active and stays; retracts when deactivated.
 * - `trace`: draws in, then leaves forward, once per activation.
 * - `loop`: `trace` on repeat while active.
 * - `orbit`: a short segment circles the path while active.
 */
export type StrokeTraceMode = "draw" | "trace" | "loop" | "orbit";

type StrokeTraceOptions = {
  mode?: StrokeTraceMode;
  /** Runs the mode while true. Toggle it, or change `key`, to replay. */
  active?: boolean;
  /** Milliseconds for one draw, trace, loop cycle, or orbit lap. */
  duration?: number;
  /** Draw mode only. Exit direction; defaults to retracting along the same path. */
  exitDirection?: "reverse" | "forward";
  /** Draw mode only. Milliseconds for a full exit; defaults to 60% of duration.
   * Partial exits take proportionally less time. */
  exitDuration?: number;
  /** `neon` renders a near-white core with a glow in `currentColor`. For dark surfaces. */
  variant?: "line" | "neon";
};

export type StrokeTraceProps = ComponentProps<"svg"> &
  StrokeTraceOptions & {
    /** Milliseconds between the start of each shape, in document order. */
    stagger?: number;
    /** Renders a faint copy of every shape under the trace. */
    track?: boolean;
  };

export type StrokeTraceBorderProps = Omit<ComponentProps<"svg">, "children"> &
  StrokeTraceOptions & {
    /** Uniform corner radius in px. Defaults to 0; clamped to half the box size. */
    radius?: number;
  };

const geometryTags = new Set([
  "path",
  "circle",
  "rect",
  "ellipse",
  "line",
  "polyline",
  "polygon",
]);

type ShapeProps = {
  children?: ReactNode;
  className?: string;
  pathLength?: number | string;
  style?: CSSProperties;
};

function msOr(value: number | undefined, fallback: number) {
  return value !== undefined && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback;
}

/** `off` is only reachable after `on`, so the first render never plays an exit. */
function useTraceState(active: boolean) {
  const [hasBeenActive, setHasBeenActive] = useState(active);

  if (active && !hasBeenActive) {
    setHasBeenActive(true);
  }

  return active ? "on" : hasBeenActive ? "off" : "idle";
}

function rootProps(
  {
    mode = "draw",
    duration,
    variant = "line",
    exitDirection = "reverse",
  }: StrokeTraceOptions,
  state: string,
  style: CSSProperties | undefined,
) {
  return {
    "aria-hidden": true,
    "data-mode": mode,
    "data-state": state,
    "data-variant": variant,
    "data-exit-direction": mode === "draw" ? exitDirection : undefined,
    style: {
      "--stroke-trace-duration": `${msOr(duration, mode === "orbit" ? 1200 : 1000)}ms`,
      ...style,
    } as CSSProperties,
  };
}

/** One node, two consumers; preserve React 19 callback-ref cleanup. */
function useTraceNode(ref: Ref<SVGSVGElement> | undefined) {
  const [node, setNode] = useState<SVGSVGElement | null>(null);
  const setRefs = useCallback(
    (element: SVGSVGElement | null) => {
      setNode(element);
      const cleanup = assignRef(ref, element);
      return () => {
        setNode(null);
        cleanup();
      };
    },
    [ref],
  );
  return [node, setRefs] as const;
}

function cssMs(value: string, fallback: number) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed)
    ? Math.max(0, parsed * (value.trim().endsWith("ms") ? 1 : 1000))
    : fallback;
}

/** Animate the visible segment's length and tail, without per-frame React state.
 * Snapshot before cancelling so every interruption starts at the current image. */
function useDrawAnimation(
  node: SVGSVGElement | null,
  {
    mode = "draw",
    active = true,
    duration,
    exitDuration,
    exitDirection = "reverse",
  }: StrokeTraceOptions,
  content: unknown,
  track = false,
  stagger = 0,
) {
  const managedShapes = useRef(new WeakSet<SVGElement>());
  useLayoutEffect(() => {
    if (!node) return;
    const shapes = [
      ...node.querySelectorAll<SVGElement>(
        "[pathLength]:not(.stroke-trace-track)",
      ),
    ];
    if (mode !== "draw") {
      for (const shape of shapes) {
        if (!managedShapes.current.has(shape)) continue;
        shape.style.removeProperty("stroke-dasharray");
        shape.style.removeProperty("stroke-dashoffset");
        shape.style.removeProperty("opacity");
        managedShapes.current.delete(shape);
      }
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stop = () => {};
    const play = () => {
      stop();
      const stops = shapes.map((shape) => {
        managedShapes.current.add(shape);
        const computed = getComputedStyle(shape);
        const length = Math.min(
          1,
          Math.max(0, Number.parseFloat(computed.strokeDasharray) || 0),
        );
        const tail = -(Number.parseFloat(computed.strokeDashoffset) || 0);
        const opacity = Number.parseFloat(computed.opacity) || 0;
        const targetLength = active ? 1 : 0;
        // Keep the segment inside [0, 1]. Re-entry expands the remaining segment
        // back to both path endpoints, including after a partial forward exit.
        const targetTail = active
          ? 0
          : exitDirection === "forward"
            ? tail + length
            : tail;
        const fullDuration = cssMs(
          computed.animationDuration,
          msOr(duration, 1000),
        );
        const distance = Math.abs(targetLength - length);
        const time = active
          ? fullDuration
          : msOr(exitDuration, fullDuration * 0.6);
        const delay =
          active && length === 0 && opacity === 0
            ? cssMs(computed.animationDelay, 0)
            : 0;
        const target = {
          // A period of 2 keeps the next dash beyond the path's endpoint,
          // where round linecaps otherwise expose an extra dot while drawing.
          strokeDasharray: `${targetLength} ${2 - targetLength}`,
          strokeDashoffset: `${-targetTail}`,
          opacity: active ? "1" : "0",
        };
        const finish = () => Object.assign(shape.style, target);
        if (
          (!active && length === 0 && opacity === 0) ||
          (distance === 0 && opacity === Number(target.opacity)) ||
          time === 0
        ) {
          finish();
          return () => {};
        }

        const from = {
          strokeDasharray: `${length} ${2 - length}`,
          strokeDashoffset: `${-tail}`,
          opacity: `${opacity}`,
        };
        const animation = shape.animate(
          media.matches
            ? [{ opacity: `${opacity}` }, { opacity: target.opacity }]
            : [
                from,
                {
                  opacity: active ? "1" : `${opacity}`,
                  offset: active ? 0.15 : 0.85,
                },
                target,
              ],
          {
            duration: media.matches ? Math.min(150, time) : time * distance,
            delay: media.matches ? 0 : delay,
            easing: "cubic-bezier(0.23, 1, 0.32, 1)",
            fill: "both",
          },
        );
        animation.onfinish = () => {
          finish();
          animation.cancel();
        };
        return () => {
          const current = getComputedStyle(shape);
          // Keep geometry underneath the reduced-motion CSS guard unchanged.
          if (!media.matches) {
            shape.style.strokeDasharray = current.strokeDasharray;
            shape.style.strokeDashoffset = current.strokeDashoffset;
          }
          shape.style.opacity = current.opacity;
          animation.onfinish = null;
          animation.cancel();
        };
      });
      stop = () => stops.forEach((cancel) => cancel());
    };
    play();
    media.addEventListener("change", play);
    return () => {
      media.removeEventListener("change", play);
      stop();
    };
  }, [
    node,
    mode,
    active,
    duration,
    exitDuration,
    exitDirection,
    content,
    track,
    stagger,
  ]);
}

/**
 * Overrides every SVG shape's pathLength with 1, so the same dash animation
 * fits any path without measuring it. Walks `<g>` and fragments; shapes inside
 * custom components are reached only if they set `pathLength={1}` themselves.
 */
function prepareShapes(children: ReactNode, track: boolean) {
  let index = 0;

  const visit = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (child) => {
      if (!isValidElement<ShapeProps>(child)) {
        return child;
      }

      if (child.type === Fragment || child.type === "g") {
        return cloneElement(child, undefined, visit(child.props.children));
      }

      if (typeof child.type !== "string" || !geometryTags.has(child.type)) {
        return child;
      }

      const shape = cloneElement(child as ReactElement<ShapeProps>, {
        pathLength: 1,
        style: {
          "--stroke-trace-index": index++,
          ...child.props.style,
        } as CSSProperties,
      });

      if (!track) {
        return shape;
      }

      return (
        <>
          {cloneElement(child as ReactElement<ShapeProps>, {
            pathLength: undefined,
            // Keep semantic selectors outside tailwind-merge: stroke-* is
            // otherwise interpreted as a stroke-color utility.
            className: `stroke-trace-track ${cn(child.props.className)}`,
          })}
          {shape}
        </>
      );
    });

  return visit(children);
}

/** Draws along the strokes of its SVG shapes. */
export function StrokeTrace({
  mode,
  active = true,
  duration,
  exitDuration,
  exitDirection,
  variant,
  stagger = 0,
  track = false,
  className,
  style,
  children,
  ref,
  ...props
}: StrokeTraceProps) {
  const state = useTraceState(active);
  const [node, setRefs] = useTraceNode(ref);
  useDrawAnimation(
    node,
    { mode, active, duration, exitDuration, exitDirection },
    children,
    track,
    stagger,
  );

  return (
    <svg
      {...rootProps({ mode, duration, variant, exitDirection }, state, {
        "--stroke-trace-stagger": `${msOr(stagger, 0)}ms`,
        ...style,
      } as CSSProperties)}
      {...props}
      ref={setRefs}
      data-slot="stroke-trace"
      className={`stroke-trace ${cn(className)}`}
    >
      {prepareShapes(children, track)}
    </svg>
  );
}

type BorderBox = {
  width: number;
  height: number;
  offset: number;
};

function readBorderBox(element: HTMLElement): BorderBox {
  const computed = getComputedStyle(element);
  // Layout size, unaffected by transforms such as a pressed-button scale.
  const w = element.offsetWidth;
  const h = element.offsetHeight;
  return {
    width: w,
    height: h,
    offset: Number.parseFloat(computed.borderTopWidth) || 0,
  };
}

/**
 * Traces the border of its parent element. The parent must be positioned
 * (`relative`, `absolute`, …) with uniform border widths. Its size is followed
 * live; set `radius` explicitly to match its uniform corner radius in px.
 * Asymmetric borders and elliptical or per-corner radii are not supported.
 */
export function StrokeTraceBorder({
  mode,
  active = true,
  duration,
  exitDuration,
  exitDirection,
  variant,
  radius = 0,
  className,
  style,
  ref,
  ...props
}: StrokeTraceBorderProps) {
  const state = useTraceState(active);
  const [node, setRefs] = useTraceNode(ref);
  const [box, setBox] = useState<BorderBox | null>(null);
  useDrawAnimation(
    node,
    { mode, active, duration, exitDuration, exitDirection },
    box,
  );

  useLayoutEffect(() => {
    const parent = node?.parentElement;

    if (!parent) {
      return;
    }

    const update = () => {
      const next = readBorderBox(parent);
      setBox((current) =>
        current &&
        current.width === next.width &&
        current.height === next.height &&
        current.offset === next.offset
          ? current
          : next,
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(parent, { box: "border-box" });

    return () => observer.disconnect();
  }, [node]);

  return (
    <svg
      {...rootProps({ mode, duration, variant, exitDirection }, state, {
        top: box ? -box.offset : 0,
        left: box ? -box.offset : 0,
        width: box?.width ?? 0,
        height: box?.height ?? 0,
        ...style,
      })}
      {...props}
      ref={setRefs}
      data-slot="stroke-trace-border"
      className={`stroke-trace stroke-trace-border ${cn(className)}`}
    >
      {box ? (
        <rect
          pathLength={1}
          width={box.width}
          height={box.height}
          rx={Math.min(
            Number.isFinite(radius) ? Math.max(0, radius) : 0,
            box.width / 2,
            box.height / 2,
          )}
          style={{ "--stroke-trace-index": 0 } as CSSProperties}
        />
      ) : null}
    </svg>
  );
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    const cleanup = ref(value);
    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      } else {
        ref(null);
      }
    };
  }

  if (ref) {
    ref.current = value;
  }

  return () => {
    if (ref) {
      ref.current = null;
    }
  };
}
