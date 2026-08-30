"use client";

import type { MermaidConfig } from "mermaid";
import {
  Maximize2,
  RotateCcw,
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
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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
  | { status: "empty" | "idle" | "loading" }
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

let renderQueue: Promise<void> = Promise.resolve();
let renderSequence = 0;

const subscribeToThemeClass = (callback: () => void) => {
  if (typeof document === "undefined") return () => {};

  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributeFilter: ["class"],
    attributes: true,
  });
  return () => observer.disconnect();
};

function getResolvedMermaidTheme(): "dark" | "default" {
  if (typeof document === "undefined") return "default";
  return document.documentElement.classList.contains("dark") ? "dark" : "default";
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

function getRenderRequestKey(chart: string, config: MermaidConfig, theme: string) {
  try {
    return JSON.stringify([chart, config, theme]);
  } catch {
    return `${chart}:${theme}`;
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
      const result = (await mermaid.render(renderId, chart)) as MermaidRenderResult;
      return result.svg;
    });
  renderQueue = task.then(() => undefined, () => undefined);

  return task;
}

export function MermaidDiagram({
  chart,
  responsiveChart,
  title: titleProp,
  caption: captionProp,
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
  const caption = captionProp?.trim() || parsedMeta.caption;
  const useResponsiveChart = useMediaQuery(
    responsiveChart?.query ?? DEFAULT_RESPONSIVE_CHART_QUERY,
    Boolean(responsiveChart),
  );
  const selectedChart = useResponsiveChart ? responsiveChart?.chart ?? chart : chart;
  const normalizedChart = useMemo(() => selectedChart.replace(/\n+$/u, ""), [selectedChart]);
  const renderState = useMermaidRender(normalizedChart, config, isIncomplete, onRenderError);

  if (isIncomplete) {
    return (
      <figure ref={ref} className={cn("my-4 border bg-card p-4 text-sm text-muted-foreground", className)}>
        Mermaid diagram is still streaming…
      </figure>
    );
  }

  if (renderState.status === "empty") {
    return (
      <figure ref={ref} className={cn("my-4 border bg-card p-4 text-sm text-muted-foreground", className)}>
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

  if (renderState.status === "success") {
    return (
      <SvgViewer
        key={renderState.requestKey}
        ref={ref}
        svgHtml={renderState.svg}
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
  const theme = useSyncExternalStore(subscribeToThemeClass, getResolvedMermaidTheme, getServerMermaidTheme);
  const [state, setState] = useState<RenderState>({ status: "idle" });
  const requestKey = getRenderRequestKey(chart, config, theme);

  useEffect(() => {
    if (isIncomplete || !chart.trim()) return;

    let active = true;
    void renderMermaid(idBase, chart, config, theme).then(
      (svg) => {
        if (active) setState({ status: "success", svg, requestKey });
      },
      (caught: unknown) => {
        if (!active) return;
        const error = caught instanceof Error ? caught : new Error("Failed to render Mermaid diagram.");
        onRenderError?.(error);
        setState({ status: "error", message: error.message.trim() || "Failed to render Mermaid diagram.", requestKey });
      },
    );

    return () => {
      active = false;
    };
  }, [chart, config, idBase, isIncomplete, onRenderError, requestKey, theme]);

  if (isIncomplete) return { status: "idle" };
  if (!chart.trim()) return { status: "empty" };
  if ((state.status === "success" || state.status === "error") && state.requestKey === requestKey) return state;
  return { status: "loading" };
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
          <figcaption data-slot="mermaid-diagram-title" className={cn("truncate text-base font-medium text-foreground", titleClassName)}>
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

  return (
    <TooltipProvider delay={150}>
      <MermaidFrame
        ref={ref}
        title={title}
        caption={caption}
        isLoading={false}
        className={className}
        headerClassName={headerClassName}
        titleClassName={titleClassName}
        captionClassName={captionClassName}
        actionsClassName={toolbarClassName}
        actions={fullscreen ? (
          <IconButton label="View diagram fullscreen" onClick={() => setOpen(true)}>
            <Maximize2 />
          </IconButton>
        ) : null}
      >
        <DiagramViewport interactive={false} className={cn("min-h-48", viewportClassName)}>
          <SvgMount svgHtml={svgHtml} ariaLabel={label} />
        </DiagramViewport>
      </MermaidFrame>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="inset-0 top-0 left-0 grid size-full max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)] gap-0 rounded-none p-0 sm:max-w-none"
        >
          <div className="flex min-h-14 items-center justify-between gap-4 border-b bg-card px-4 pr-14">
            <div className="min-w-0">
              <DialogTitle className={cn("truncate text-base font-medium", titleClassName)}>
                {title?.trim() || "Mermaid diagram"}
              </DialogTitle>
              <DialogDescription className={cn("truncate text-xs", captionClassName, !caption && "sr-only")}>
                {caption?.trim() || "Interactive fullscreen diagram. Drag to pan and use the toolbar to zoom."}
              </DialogDescription>
            </div>
            <ViewerToolbar controlsRef={controlsRef} className={toolbarClassName} />
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
  ...props
}: DiagramViewportProps) {
  const reducedMotion = useReducedMotion();
  const clampScale = useCallback((scale: number) => Math.min(Math.max(maxZoom, minZoom), Math.max(Math.min(minZoom, maxZoom), scale)), [maxZoom, minZoom]);
  const initialView = useMemo<ViewState>(() => ({ scale: clampScale(initialZoom), x: 0, y: 0 }), [clampScale, initialZoom]);
  const [view, setView] = useState(initialView);
  const [isDragging, setIsDragging] = useState(false);
  const viewRef = useRef(view);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; x: number; y: number } | null>(null);
  const pendingViewRef = useRef<ViewState | null>(null);
  const frameRef = useRef<number | null>(null);

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

  const zoom = useCallback((direction: 1 | -1) => {
    const current = viewRef.current;
    commitView({ ...current, scale: clampScale(current.scale + zoomStep * direction) });
  }, [clampScale, commitView, zoomStep]);
  const reset = useCallback(() => commitView(initialView), [commitView, initialView]);

  useLayoutEffect(() => {
    setRefValue(controlsRef, { reset, zoomIn: () => zoom(1), zoomOut: () => zoom(-1) });
    return () => setRefValue(controlsRef, null);
  }, [controlsRef, reset, zoom]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const finishDrag = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    const pending = pendingViewRef.current;
    if (pending) commitView(pending);
    dragRef.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }, [commitView]);

  return (
    <div
      {...props}
      ref={ref}
      data-mermaid-viewport={interactive ? "interactive" : "static"}
      className={cn("relative flex overflow-hidden bg-background", interactive ? "cursor-grab touch-none active:cursor-grabbing" : "touch-auto", className)}
      onPointerDown={(event) => {
        if (!interactive || event.button !== 0) return;
        dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: viewRef.current.x, y: viewRef.current.y };
        setIsDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        scheduleView({ ...viewRef.current, x: drag.x + event.clientX - drag.startX, y: drag.y + event.clientY - drag.startY });
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onWheel={(event) => {
        if (!interactive || !wheelZoom) return;
        event.preventDefault();
        zoom(event.deltaY < 0 ? 1 : -1);
      }}
    >
      <div
        data-mermaid-viewport-content
        className="flex min-h-full w-full origin-center items-center justify-center p-4"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          transition: isDragging || reducedMotion ? "none" : "transform 120ms ease-out",
          userSelect: interactive ? "none" : undefined,
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
    if (!(svg instanceof SVGSVGElement)) return;
    svg.setAttribute("draggable", "false");
    svg.setAttribute("height", "100%");
    svg.style.maxHeight = "100%";
    svg.style.maxWidth = "100%";
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
