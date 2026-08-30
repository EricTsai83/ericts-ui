"use client";

import type { MermaidConfig } from "mermaid";
import {
  Maximize2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface MermaidRepairRequest {
  chart: string;
  error: string;
}

export type MermaidDiagramClassNames = {
  root?: string;
  header?: string;
  title?: string;
  caption?: string;
  viewport?: string;
  toolbar?: string;
  error?: string;
};

export interface MermaidDiagramProps {
  chart: string;
  responsiveChart?: MermaidResponsiveChart;
  title?: string;
  caption?: string;
  showCaption?: boolean;
  meta?: string;
  config?: MermaidConfig;
  isIncomplete?: boolean;
  fullscreen?: boolean;
  wheelZoom?: boolean;
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  className?: string;
  classNames?: MermaidDiagramClassNames;
  onRepair?: (request: MermaidRepairRequest) => void | Promise<void>;
  onRenderError?: (error: Error) => void;
  renderLoading?: () => ReactNode;
  renderError?: (context: MermaidRepairRequest) => ReactNode;
  ref?: Ref<HTMLElement>;
}

export type MermaidResponsiveChart = {
  chart: string;
  query?: string;
};

export type DiagramViewportControls = {
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

export interface DiagramViewportProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode;
  controlsRef?: Ref<DiagramViewportControls>;
  initialZoom?: number;
  interactive?: boolean;
  maxZoom?: number;
  minZoom?: number;
  wheelZoom?: boolean;
  zoomStep?: number;
  ref?: Ref<HTMLDivElement>;
}

type MermaidRenderResult = {
  svg: string;
};

type RenderState =
  | { status: "empty" | "idle" }
  | { status: "loading"; lastSvg?: string }
  | { status: "success"; svg: string }
  | { status: "error"; message: string };

type RenderSnapshot =
  | { status: "success"; svg: string; requestKey: string }
  | { status: "error"; message: string; requestKey: string };

type DiagramMeta = {
  caption?: string;
  title?: string;
};

type ViewState = {
  scale: number;
  x: number;
  y: number;
};

type ViewportPoint = {
  x: number;
  y: number;
};

const DEFAULT_MERMAID_CONFIG: MermaidConfig = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  maxEdges: 500,
  maxTextSize: 50_000,
  securityLevel: "strict",
  startOnLoad: false,
  suppressErrorRendering: true,
};

const DEFAULT_MIN_ZOOM = 0.5;
const DEFAULT_MAX_ZOOM = 4;
const DEFAULT_ZOOM_STEP = 0.25;
const DEFAULT_RESPONSIVE_CHART_QUERY = "(max-width: 640px)";
const EMPTY_MERMAID_CONFIG: MermaidConfig = {};
const WHEEL_ZOOM_INTENSITY = 0.002;
const PINCH_WHEEL_ZOOM_INTENSITY = 0.008;
const WHEEL_GESTURE_IDLE_MS = 160;
const KEYBOARD_PAN_STEP = 40;
const KEYBOARD_PAN_STEP_FAST = 120;

let renderQueue: Promise<void> = Promise.resolve();
let renderSequence = 0;

const subscribeToRootTheme = (callback: () => void) => {
  if (typeof document === "undefined") return () => {};

  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributeFilter: ["class", "data-theme"],
    attributes: true,
  });
  return () => observer.disconnect();
};

function getResolvedMermaidTheme(): "dark" | "default" {
  if (typeof document === "undefined") return "default";
  const root = document.documentElement;
  const isDark =
    root.classList.contains("dark") ||
    (root.dataset.theme?.toLowerCase().includes("dark") ?? false);
  return isDark ? "dark" : "default";
}

function getServerMermaidTheme(): "dark" | "default" {
  return "default";
}

function parseMermaidFenceMeta(meta?: string): DiagramMeta {
  if (!meta) return {};

  const result: DiagramMeta = {};
  const attributePattern = /(?:^|\s)(title|caption)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
  let match = attributePattern.exec(meta);

  while (match) {
    const key = match[1];
    const value = (match[2] ?? match[3] ?? match[4] ?? "").trim();
    if ((key === "title" || key === "caption") && value) result[key] = value;
    match = attributePattern.exec(meta);
  }

  return result;
}

// Charts can be as large as maxTextSize, so requests are identified by a hash
// instead of carrying the full source around in state comparisons.
function hashRenderInput(input: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(36)}${(h1 >>> 0).toString(36)}:${input.length}`;
}

function getRenderRequestKey(chart: string, config: MermaidConfig, theme: string) {
  try {
    return hashRenderInput(JSON.stringify([chart, config, theme]));
  } catch {
    return hashRenderInput(`${chart}:${theme}`);
  }
}

async function renderMermaid(
  idBase: string,
  chart: string,
  config: MermaidConfig,
  theme: "dark" | "default",
) {
  const task = renderQueue
    .catch(() => undefined)
    .then(async () => {
      const mermaid = (await import("mermaid")).default;
      const renderId = `mermaid-diagram-${idBase}-${++renderSequence}`;
      mermaid.initialize({
        ...DEFAULT_MERMAID_CONFIG,
        ...config,
        theme: config.theme ?? theme,
        maxEdges: Math.min(config.maxEdges ?? DEFAULT_MERMAID_CONFIG.maxEdges!, 2_000),
        maxTextSize: Math.min(config.maxTextSize ?? DEFAULT_MERMAID_CONFIG.maxTextSize!, 100_000),
        securityLevel: "strict",
        startOnLoad: false,
        suppressErrorRendering: true,
      });
      try {
        const result = (await mermaid.render(renderId, chart)) as MermaidRenderResult;
        return result.svg;
      } catch (error) {
        // Mermaid can leave its temporary render element in the document when
        // parsing fails; remove it so failed renders never accumulate nodes.
        document.getElementById(renderId)?.remove();
        document.getElementById(`d${renderId}`)?.remove();
        throw error;
      }
    });
  renderQueue = task.then(() => undefined, () => undefined);

  return task;
}

export function MermaidDiagram({
  chart,
  responsiveChart,
  title: titleProp,
  caption: captionProp,
  showCaption = true,
  meta,
  config = EMPTY_MERMAID_CONFIG,
  isIncomplete = false,
  fullscreen = true,
  wheelZoom = true,
  initialZoom = 1,
  minZoom = DEFAULT_MIN_ZOOM,
  maxZoom = DEFAULT_MAX_ZOOM,
  zoomStep = DEFAULT_ZOOM_STEP,
  className,
  classNames,
  onRepair,
  onRenderError,
  renderLoading,
  renderError,
  ref,
}: MermaidDiagramProps) {
  const parsedMeta = useMemo(() => parseMermaidFenceMeta(meta), [meta]);
  const title = titleProp?.trim() || parsedMeta.title;
  const caption = showCaption ? captionProp?.trim() || parsedMeta.caption : undefined;
  const useResponsiveChart = useMediaQuery(
    responsiveChart?.query ?? DEFAULT_RESPONSIVE_CHART_QUERY,
    Boolean(responsiveChart),
  );
  const selectedChart = useResponsiveChart ? responsiveChart?.chart ?? chart : chart;
  const normalizedChart = useMemo(() => selectedChart.replace(/\n+$/u, ""), [selectedChart]);
  const renderState = useMermaidRender(normalizedChart, config, isIncomplete, onRenderError);

  if (isIncomplete) {
    return (
      <figure ref={ref} className={cn("my-4 border bg-card p-4 text-sm text-muted-foreground", className, classNames?.root)}>
        Mermaid diagram is still streaming…
      </figure>
    );
  }

  if (renderState.status === "empty") {
    return (
      <figure ref={ref} className={cn("my-4 border bg-card p-4 text-sm text-muted-foreground", className, classNames?.root)}>
        No Mermaid source to render.
      </figure>
    );
  }

  if (renderState.status === "error") {
    const context = { chart: normalizedChart, error: renderState.message };
    return renderError ? (
      <>{renderError(context)}</>
    ) : (
      <MermaidRenderError
        ref={(node) => setRefValue(ref, node)}
        chart={normalizedChart}
        error={renderState.message}
        onRepair={onRepair}
        className={cn(className, classNames?.error)}
      />
    );
  }

  const svgHtml =
    renderState.status === "success"
      ? renderState.svg
      : renderState.status === "loading"
        ? renderState.lastSvg
        : undefined;

  if (svgHtml) {
    return (
      <SvgViewer
        ref={ref}
        svgHtml={svgHtml}
        isRefreshing={renderState.status === "loading"}
        title={title}
        caption={caption}
        fullscreen={fullscreen}
        wheelZoom={wheelZoom}
        initialZoom={initialZoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        zoomStep={zoomStep}
        viewportClassName={classNames?.viewport}
        toolbarClassName={classNames?.toolbar}
        className={cn(className, classNames?.root)}
        headerClassName={classNames?.header}
        titleClassName={classNames?.title}
        captionClassName={classNames?.caption}
      />
    );
  }

  return (
    <MermaidFrame
      ref={ref}
      title={title}
      caption={caption}
      isLoading
      className={cn(className, classNames?.root)}
      headerClassName={classNames?.header}
      titleClassName={classNames?.title}
      captionClassName={classNames?.caption}
    >
      {renderLoading ? (
        renderLoading()
      ) : (
        <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          <span aria-hidden="true" className="mr-2 size-4 animate-spin rounded-full border border-muted-foreground/30 border-b-muted-foreground" />
          Rendering diagram…
        </div>
      )}
    </MermaidFrame>
  );
}

function useMediaQuery(query: string, enabled: boolean) {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!enabled || typeof window === "undefined") return () => {};
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    [enabled, query],
  );
  const getSnapshot = useCallback(
    () => enabled && typeof window !== "undefined" && window.matchMedia(query).matches,
    [enabled, query],
  );
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function useMermaidRender(
  chart: string,
  config: MermaidConfig,
  isIncomplete: boolean,
  onRenderError?: (error: Error) => void,
): RenderState {
  const reactId = useId();
  const idBase = useMemo(() => reactId.replace(/[^a-zA-Z0-9_-]/g, ""), [reactId]);
  const theme = useSyncExternalStore(subscribeToRootTheme, getResolvedMermaidTheme, getServerMermaidTheme);
  const [snapshot, setSnapshot] = useState<RenderSnapshot | null>(null);
  const requestKey = getRenderRequestKey(chart, config, theme);

  // Inline `config` objects and `onRenderError` callbacks get a new identity on
  // every parent render; reading them through refs keeps them out of the render
  // effect's dependencies so only content changes (via requestKey) re-render.
  const configRef = useRef(config);
  const onRenderErrorRef = useRef(onRenderError);
  useEffect(() => {
    configRef.current = config;
    onRenderErrorRef.current = onRenderError;
  });

  useEffect(() => {
    if (isIncomplete || !chart.trim()) return;

    let active = true;
    void renderMermaid(idBase, chart, configRef.current, theme).then(
      (svg) => {
        if (active) setSnapshot({ status: "success", svg, requestKey });
      },
      (caught: unknown) => {
        if (!active) return;
        const error = caught instanceof Error ? caught : new Error("Failed to render Mermaid diagram.");
        onRenderErrorRef.current?.(error);
        setSnapshot({ status: "error", message: error.message.trim() || "Failed to render Mermaid diagram.", requestKey });
      },
    );

    return () => {
      active = false;
    };
  }, [chart, idBase, isIncomplete, requestKey, theme]);

  if (isIncomplete) return { status: "idle" };
  if (!chart.trim()) return { status: "empty" };
  if (snapshot?.requestKey === requestKey) {
    return snapshot.status === "success"
      ? { status: "success", svg: snapshot.svg }
      : { status: "error", message: snapshot.message };
  }
  // While a new request renders, keep the previous diagram on screen instead of
  // flashing back to the loading state.
  return { status: "loading", lastSvg: snapshot?.status === "success" ? snapshot.svg : undefined };
}

function MermaidFrame({
  title,
  caption,
  isLoading,
  children,
  actions,
  actionsClassName,
  className,
  headerClassName,
  titleClassName,
  captionClassName,
  ref,
}: {
  title?: string;
  caption?: string;
  isLoading: boolean;
  children: ReactNode;
  actions?: ReactNode;
  actionsClassName?: string;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  captionClassName?: string;
  ref?: Ref<HTMLElement>;
}) {
  return (
    <figure ref={ref} className={cn("my-4 overflow-hidden rounded-xl border bg-card text-card-foreground", className)}>
      <div data-slot="mermaid-diagram-header" className={cn("flex min-h-14 items-center justify-between gap-3 border-b bg-muted/45 px-3 py-2", headerClassName)}>
        <div className="min-w-0">
          <figcaption data-slot="mermaid-diagram-title" className={cn("truncate text-base font-medium capitalize text-foreground", titleClassName)}>
            {title?.trim() || "Mermaid diagram"}
          </figcaption>
          {caption?.trim() ? (
            <p data-slot="mermaid-diagram-caption" className={cn("truncate text-xs text-muted-foreground", captionClassName)}>{caption}</p>
          ) : null}
        </div>
        <div className={cn("flex shrink-0 items-center gap-1", actionsClassName)}>
          {isLoading ? <span className="font-mono text-[10px] uppercase text-muted-foreground">Loading</span> : null}
          {actions}
        </div>
      </div>
      {children}
    </figure>
  );
}

function SvgViewer({
  ref,
  svgHtml,
  isRefreshing,
  title,
  caption,
  fullscreen,
  wheelZoom,
  initialZoom,
  minZoom,
  maxZoom,
  zoomStep,
  viewportClassName,
  toolbarClassName,
  className,
  headerClassName,
  titleClassName,
  captionClassName,
}: {
  ref?: Ref<HTMLElement>;
  svgHtml: string;
  isRefreshing: boolean;
  title?: string;
  caption?: string;
  fullscreen: boolean;
  wheelZoom: boolean;
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  viewportClassName?: string;
  toolbarClassName?: string;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  captionClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const controlsRef = useRef<DiagramViewportControls | null>(null);
  const label = title?.trim() ? `${title} diagram` : "Mermaid diagram";
  useFullscreenDocumentScrollLock(open);

  return (
    <TooltipProvider delay={150}>
      <MermaidFrame
        ref={ref}
        title={title}
        caption={caption}
        isLoading={isRefreshing}
        className={className}
        headerClassName={headerClassName}
        titleClassName={titleClassName}
        captionClassName={captionClassName}
        actionsClassName={toolbarClassName}
        actions={fullscreen ? (
          <Button
            aria-label="View diagram fullscreen"
            onClick={() => setOpen(true)}
            variant="ghost"
            size="icon"
          >
            <Maximize2 />
          </Button>
        ) : null}
      >
        <DiagramViewport interactive={false} className={cn("min-h-48", viewportClassName)}>
          <SvgMount svgHtml={svgHtml} ariaLabel={label} />
        </DiagramViewport>
      </MermaidFrame>
      <Dialog open={open} onOpenChange={setOpen} modal="trap-focus">
        <DialogContent
          showCloseButton={false}
          className="inset-0 top-0 left-0 grid size-full max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 rounded-none p-0 sm:max-w-none"
        >
          <div className="flex min-h-14 items-stretch justify-between border-b bg-card">
            <div className="flex min-w-0 flex-1 flex-col justify-center px-4">
              <DialogTitle className={cn("truncate text-base font-medium capitalize", titleClassName)}>
                {title?.trim() || "Mermaid diagram"}
              </DialogTitle>
              <DialogDescription className={cn("truncate text-xs", captionClassName, !caption && "sr-only")}>
                {caption?.trim() || "Interactive fullscreen diagram. Drag to pan and use the toolbar to zoom."}
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-stretch">
              <ViewerToolbar controlsRef={controlsRef} className={cn("px-3", toolbarClassName)} />
              <Separator
                orientation="vertical"
                className="w-px bg-foreground/20"
              />
              <DialogClose
                render={
                  <Button
                    aria-label="Exit fullscreen"
                    className="size-14 rounded-none [&_svg:not([class*='size-'])]:size-6"
                    variant="ghost"
                    size="icon"
                  />
                }
              >
                <X />
              </DialogClose>
            </div>
          </div>
          <DiagramViewport
            controlsRef={controlsRef}
            interactive
            wheelZoom={wheelZoom}
            initialZoom={initialZoom}
            minZoom={minZoom}
            maxZoom={maxZoom}
            zoomStep={zoomStep}
            className={cn("min-h-0", viewportClassName)}
          >
            <SvgMount svgHtml={svgHtml} ariaLabel={label} />
          </DiagramViewport>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

function useFullscreenDocumentScrollLock(open: boolean) {
  useLayoutEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const body = document.body;
    const rootOverflow = root.style.overflow;
    const bodyOverflow = body.style.overflow;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      root.style.overflow = rootOverflow;
      body.style.overflow = bodyOverflow;
    };
  }, [open]);
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button aria-label={label} onClick={onClick} variant="ghost" size="icon" />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ViewerToolbar({ controlsRef, className }: { controlsRef: RefObject<DiagramViewportControls | null>; className?: string }) {
  const getControls = () => controlsRef.current;
  return (
    <div className={cn("flex shrink-0 items-center gap-1", className)}>
      <IconButton label="Zoom in" onClick={() => getControls()?.zoomIn()}><ZoomIn /></IconButton>
      <IconButton label="Zoom out" onClick={() => getControls()?.zoomOut()}><ZoomOut /></IconButton>
      <IconButton label="Reset diagram view" onClick={() => getControls()?.reset()}><RotateCcw /></IconButton>
    </div>
  );
}

function setRefValue<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export function DiagramViewport({
  children,
  controlsRef,
  initialZoom = 1,
  interactive = true,
  maxZoom = DEFAULT_MAX_ZOOM,
  minZoom = DEFAULT_MIN_ZOOM,
  wheelZoom = true,
  zoomStep = DEFAULT_ZOOM_STEP,
  className,
  ref,
  onKeyDown,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  ...props
}: DiagramViewportProps) {
  const reducedMotion = useReducedMotion();
  const clampScale = useCallback((scale: number) => Math.min(Math.max(maxZoom, minZoom), Math.max(Math.min(minZoom, maxZoom), scale)), [maxZoom, minZoom]);
  const initialView = useMemo<ViewState>(() => ({ scale: clampScale(initialZoom), x: 0, y: 0 }), [clampScale, initialZoom]);
  const [view, setView] = useState(initialView);
  const [isGesturing, setIsGesturing] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef(view);
  const pointersRef = useRef(new Map<number, ViewportPoint>());
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const pinchRef = useRef<{ distance: number; midpoint: ViewportPoint } | null>(null);
  const pendingViewRef = useRef<ViewState | null>(null);
  const frameRef = useRef<number | null>(null);
  const wheelIdleTimerRef = useRef<number | null>(null);

  const setViewportNode = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    setRefValue(ref, node);
  }, [ref]);

  const commitView = useCallback((next: ViewState) => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    pendingViewRef.current = null;
    viewRef.current = next;
    setView(next);
  }, []);

  const scheduleView = useCallback((next: ViewState) => {
    viewRef.current = next;
    pendingViewRef.current = next;
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const pending = pendingViewRef.current;
      pendingViewRef.current = null;
      if (pending) setView(pending);
    });
  }, []);

  // Zooming toward a point keeps the content under that point stationary. The
  // point is expressed relative to the viewport center, which is also the
  // content's transform origin.
  const zoomAtPoint = useCallback((nextScale: number, point?: ViewportPoint, immediate = true) => {
    const current = viewRef.current;
    const scale = clampScale(nextScale);
    if (scale === current.scale) return;
    const next = point
      ? {
          scale,
          x: point.x - (point.x - current.x) * (scale / current.scale),
          y: point.y - (point.y - current.y) * (scale / current.scale),
        }
      : { ...current, scale };
    if (immediate) commitView(next);
    else scheduleView(next);
  }, [clampScale, commitView, scheduleView]);

  const zoom = useCallback((direction: 1 | -1) => {
    zoomAtPoint(viewRef.current.scale + zoomStep * direction);
  }, [zoomAtPoint, zoomStep]);
  const reset = useCallback(() => commitView(initialView), [commitView, initialView]);

  const getViewportPoint = useCallback((clientX: number, clientY: number): ViewportPoint => {
    const node = viewportRef.current;
    if (!node) return { x: 0, y: 0 };
    const rect = node.getBoundingClientRect();
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  }, []);

  useLayoutEffect(() => {
    setRefValue(controlsRef, { reset, zoomIn: () => zoom(1), zoomOut: () => zoom(-1) });
    return () => setRefValue(controlsRef, null);
  }, [controlsRef, reset, zoom]);

  // React attaches wheel listeners passively, so preventing page scroll while
  // zooming requires a native non-passive listener.
  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !interactive || !wheelZoom) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const deltaY =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? event.deltaY * 120
        : event.deltaY;
      // Trackpad pinches arrive as ctrl+wheel and expect a stronger response.
      const intensity = event.ctrlKey ? PINCH_WHEEL_ZOOM_INTENSITY : WHEEL_ZOOM_INTENSITY;
      setIsGesturing(true);
      if (wheelIdleTimerRef.current !== null) window.clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = window.setTimeout(() => {
        wheelIdleTimerRef.current = null;
        if (pointersRef.current.size === 0) setIsGesturing(false);
      }, WHEEL_GESTURE_IDLE_MS);
      zoomAtPoint(
        viewRef.current.scale * Math.exp(-deltaY * intensity),
        getViewportPoint(event.clientX, event.clientY),
        false,
      );
    };

    node.addEventListener("wheel", handleWheel, { passive: false });
    return () => node.removeEventListener("wheel", handleWheel);
  }, [getViewportPoint, interactive, wheelZoom, zoomAtPoint]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    if (wheelIdleTimerRef.current !== null) window.clearTimeout(wheelIdleTimerRef.current);
  }, []);

  const startPinch = useCallback(() => {
    const [first, second] = [...pointersRef.current.values()];
    if (!first || !second) return;
    dragRef.current = null;
    pinchRef.current = {
      distance: Math.hypot(second.x - first.x, second.y - first.y),
      midpoint: getViewportPoint((first.x + second.x) / 2, (first.y + second.y) / 2),
    };
  }, [getViewportPoint]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(event);
    if (!interactive || event.defaultPrevented || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setIsGesturing(true);
    if (pointersRef.current.size >= 2) {
      startPinch();
    } else {
      dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: viewRef.current.x, y: viewRef.current.y };
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event);
    const tracked = pointersRef.current.get(event.pointerId);
    if (!tracked) return;
    tracked.x = event.clientX;
    tracked.y = event.clientY;

    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const [first, second] = [...pointersRef.current.values()];
      const distance = Math.hypot(second.x - first.x, second.y - first.y);
      if (pinch.distance <= 0 || distance <= 0) return;
      const midpoint = getViewportPoint((first.x + second.x) / 2, (first.y + second.y) / 2);
      const current = viewRef.current;
      const scale = clampScale(current.scale * (distance / pinch.distance));
      const ratio = scale / current.scale;
      scheduleView({
        scale,
        x: midpoint.x - (pinch.midpoint.x - current.x) * ratio,
        y: midpoint.y - (pinch.midpoint.y - current.y) * ratio,
      });
      pinch.distance = distance;
      pinch.midpoint = midpoint;
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    scheduleView({ ...viewRef.current, x: drag.x + event.clientX - drag.startX, y: drag.y + event.clientY - drag.startY });
  };

  const finishPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.delete(event.pointerId)) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

    if (pointersRef.current.size >= 2) {
      startPinch();
      return;
    }
    pinchRef.current = null;
    if (pointersRef.current.size === 1) {
      const [remaining] = [...pointersRef.current.entries()];
      dragRef.current = { pointerId: remaining[0], startX: remaining[1].x, startY: remaining[1].y, x: viewRef.current.x, y: viewRef.current.y };
      return;
    }
    dragRef.current = null;
    const pending = pendingViewRef.current;
    if (pending) commitView(pending);
    setIsGesturing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (!interactive || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const panStep = event.shiftKey ? KEYBOARD_PAN_STEP_FAST : KEYBOARD_PAN_STEP;
    const current = viewRef.current;
    switch (event.key) {
      case "ArrowUp":
        commitView({ ...current, y: current.y + panStep });
        break;
      case "ArrowDown":
        commitView({ ...current, y: current.y - panStep });
        break;
      case "ArrowLeft":
        commitView({ ...current, x: current.x + panStep });
        break;
      case "ArrowRight":
        commitView({ ...current, x: current.x - panStep });
        break;
      case "+":
      case "=":
        zoom(1);
        break;
      case "-":
      case "_":
        zoom(-1);
        break;
      case "0":
        reset();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <div
      role={interactive ? "group" : undefined}
      aria-label={interactive ? "Diagram viewport. Drag or use arrow keys to pan, pinch or press plus and minus to zoom, 0 to reset." : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
      ref={setViewportNode}
      data-mermaid-viewport={interactive ? "interactive" : "static"}
      className={cn(
        "relative flex overflow-hidden bg-background",
        interactive
          ? "cursor-grab touch-none select-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
          : "touch-auto",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        finishPointer(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        finishPointer(event);
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        data-mermaid-viewport-content
        className="flex min-h-full w-full origin-center items-center justify-center p-4"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transition: isGesturing || reducedMotion ? "none" : "transform 120ms ease-out",
          willChange: interactive ? "transform" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SvgMount({ svgHtml, ariaLabel }: { svgHtml: string; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const svg = ref.current?.querySelector("svg");
    // Mermaid inlines a pixel max-width on the root svg, which beats the
    // class-based sizing below; override it so the diagram fits the viewport.
    if (svg instanceof SVGSVGElement) {
      svg.style.maxWidth = "100%";
      svg.style.maxHeight = "100%";
    }
  }, [svgHtml]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={ariaLabel}
      className="flex size-full items-center justify-center text-foreground [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}

function MermaidRenderError({
  chart,
  error,
  onRepair,
  className,
  ref,
}: {
  chart: string;
  error: string;
  onRepair?: (request: MermaidRepairRequest) => void | Promise<void>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);

  const repair = async () => {
    if (!onRepair || isRepairing) return;
    setIsRepairing(true);
    setRepairError(null);
    try {
      await onRepair({ chart, error });
    } catch (caught) {
      setRepairError(caught instanceof Error && caught.message.trim() ? caught.message : "Could not repair this diagram.");
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div ref={ref} className={cn("my-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-destructive">Mermaid diagram could not render.</p>
          <p className="mt-1 wrap-break-word text-muted-foreground">{error}</p>
          {repairError ? <p className="mt-2 wrap-break-word text-xs text-destructive">{repairError}</p> : null}
        </div>
        {onRepair ? (
          <Button disabled={isRepairing} onClick={() => void repair()} size="sm" type="button" variant="outline">
            {isRepairing ? "Repairing…" : "Repair diagram"}
          </Button>
        ) : null}
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">View Mermaid source</summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg border bg-muted p-3 text-xs text-muted-foreground"><code>{chart}</code></pre>
      </details>
    </div>
  );
}
