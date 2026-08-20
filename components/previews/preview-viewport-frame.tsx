"use client";

import { Maximize2, Monitor, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { createPortal } from "react-dom";

import {
  PreviewToolbarProvider,
  previewToolbarButtonClassName,
  usePreviewCornerSlot,
} from "@/components/previews/replayable-preview";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useElementSizeMap } from "@/hooks/use-element-size-map";
import { cn } from "@/lib/utils";

/**
 * The device viewports the toolbar offers, widest first — the order it reads
 * left to right and the order the arrow keys walk. `width` is the real CSS
 * width of the device the label names and is what the frame is built from;
 * `height` is the most the frame will ever take, so a canvas taller than the
 * device still shows a phone rather than a strip of one.
 */
const devices = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: 1280, height: 800 },
  { id: "tablet", label: "Tablet", icon: Tablet, width: 768, height: 1024 },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: 390, height: 844 },
] as const;

export type PreviewDeviceId = (typeof devices)[number]["id"];

/** Carries the chosen device across the jump to the fullscreen route. */
const DEVICE_PARAM = "w";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export function isPreviewDeviceId(value: string): value is PreviewDeviceId {
  return devices.some((device) => device.id === value);
}

/** The same href at a given device, with the default left out of the URL. */
export function previewDeviceHref(
  href: string,
  device: PreviewDeviceId,
  fallback: PreviewDeviceId,
) {
  const [path, query] = href.split("?");
  const params = new URLSearchParams(query);

  if (device === fallback) {
    params.delete(DEVICE_PARAM);
  } else {
    params.set(DEVICE_PARAM, device);
  }

  const search = params.toString();

  return search ? `${path}?${search}` : path;
}

/**
 * How large the frame is drawn, and how much of the device's height it takes,
 * in the room the canvas actually has.
 *
 * Exported because this is the arithmetic the demo-owned switcher got wrong: a
 * device width set alongside `max-w-full` clamps rather than scales, so a page
 * narrower than a desktop quietly showed a tablet under a Desktop label.
 * Scaling instead of clamping is the whole point of the frame, and a rendered
 * test cannot be trusted to exercise it — jsdom measures everything as zero.
 */
export function previewFrameGeometry({
  deviceWidth,
  deviceHeight,
  canvasWidth,
  canvasHeight,
}: {
  deviceWidth: number;
  deviceHeight: number;
  /** Zero until the canvas is measured. */
  canvasWidth: number;
  canvasHeight: number;
}) {
  if (canvasWidth <= 0 || canvasHeight <= 0) {
    return { scale: 1, height: deviceHeight };
  }

  // Only ever shrink. A frame grown past its device width would be showing a
  // viewport nobody has.
  const scale = Math.min(1, canvasWidth / deviceWidth);

  return {
    scale,
    // Taken after the scale, so the frame fills the canvas it is drawn into
    // rather than the room it would need at 100%.
    height: Math.round(Math.min(deviceHeight, canvasHeight / scale)),
  };
}

/**
 * A resizable window for a demo, with the toolbar that resizes it.
 *
 * The frame owns the width, not the demo: the demo fills it with `size-full`
 * and adapts to whatever box it is handed. That split is what makes the sizes
 * honest — the frame is the only thing that knows the canvas is too narrow for
 * a 1280px desktop, so it is the only thing that can *scale* rather than
 * silently clamp, which is what a demo setting its own `width` alongside
 * `max-w-full` ends up doing.
 *
 * @example
 *   <PreviewViewportFrame defaultDevice="mobile" fullscreenHref={href}>
 *     <SomeBlock className="size-full" />
 *   </PreviewViewportFrame>
 *
 * - The frame is a plain element, so the demo's box is a real container query
 *   context. That makes it exact for container-query layouts and useless for
 *   viewport media queries, which never see it — only opt a demo in when its
 *   layout is driven by its own box. Swapping this element for an `iframe` is
 *   the one change that would lift that restriction; nothing outside this file
 *   would move.
 * - The canvas is a fixed surface the device sits *on*, never a second frame
 *   around it: it keeps its size at every device, so the grid behind stays a
 *   ruler the frame visibly shrinks against.
 * - The toolbar is anchored to the chrome, not to the frame, so it holds still
 *   while the frame resizes and stays out of the frame's `scale` transform —
 *   which would otherwise shrink the controls along with the demo, and become
 *   the containing block for anything inside them.
 * - Each button's tooltip states the size that button would actually produce,
 *   which is not always the device's nominal one. The scale it is drawn at is
 *   deliberately not reported: it is a fact about the page, not about the
 *   viewport being previewed, and a percentage nobody can verify by looking is
 *   noise.
 * - A window resize lands instantly and only a press animates: a resize is not
 *   a move anyone made.
 */
export function PreviewViewportFrame({
  defaultDevice,
  presentation = "inline",
  fullscreenHref,
  children,
}: {
  defaultDevice: PreviewDeviceId;
  presentation?: "inline" | "fullscreen";
  fullscreenHref?: string;
  children: React.ReactNode;
}) {
  const slot = usePreviewCornerSlot();
  const [device, setDevice] = React.useState<PreviewDeviceId>(defaultDevice);
  const [toolbarNode, setToolbarNode] = React.useState<HTMLDivElement | null>(
    null,
  );
  const buttons = React.useRef(new Map<PreviewDeviceId, HTMLButtonElement>());
  const { setMeasureRef, sizes } = useElementSizeMap<HTMLDivElement>();

  // Adopt the device the URL asks for once, so the fullscreen link can carry
  // the preview's size across the route change. Read from `history` rather than
  // `useSearchParams`, which would opt these statically generated pages out of
  // static rendering for the sake of one control; a layout effect, so the swap
  // lands before paint instead of as a jump.
  useIsomorphicLayoutEffect(() => {
    const requested = new URLSearchParams(window.location.search).get(
      DEVICE_PARAM,
    );

    if (requested && isPreviewDeviceId(requested)) setDevice(requested);
  }, []);

  // The canvas is measured rather than queried: the frame has to know how much
  // room it has *before* it can decide whether to scale.
  const canvasWidth = sizes.canvas?.width ?? 0;
  const canvasHeight = sizes.canvas?.height ?? 0;
  const active = devices.find((entry) => entry.id === device) ?? devices[0];
  const activeIndex = devices.indexOf(active);
  const { scale, height } = previewFrameGeometry({
    deviceWidth: active.width,
    deviceHeight: active.height,
    canvasWidth,
    canvasHeight,
  });

  // What the frame last settled on. `instant` is stored rather than derived,
  // because adjusting state during render re-runs this component and only the
  // last pass commits — a value computed from `pressed`/`remeasured` would
  // always reach the DOM as `false`.
  const [settled, setSettled] = React.useState({
    device,
    canvasWidth,
    canvasHeight,
    instant: true,
  });
  const pressed = settled.device !== device;
  const remeasured =
    settled.canvasWidth !== canvasWidth || settled.canvasHeight !== canvasHeight;

  if (pressed || remeasured) {
    setSettled({
      device,
      canvasWidth,
      canvasHeight,
      instant: remeasured && !pressed,
    });
  }

  // Left off entirely rather than paired with `transition-none`: both set
  // `transition-property`, and which one wins is stylesheet order, not the
  // order they are listed here.
  const motion = settled.instant
    ? { frame: undefined, inner: undefined }
    : {
        frame:
          "transition-[width,height] duration-300 ease-out motion-reduce:transition-none",
        inner:
          "transition-[width,height,transform] duration-300 ease-out motion-reduce:transition-none",
      };

  const select = React.useCallback(
    (next: PreviewDeviceId) => {
      setDevice(next);

      const url = new URL(window.location.href);

      if (next === defaultDevice) url.searchParams.delete(DEVICE_PARAM);
      else url.searchParams.set(DEVICE_PARAM, next);

      window.history.replaceState(null, "", url);
    },
    [defaultDevice],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      event.key
    ];

    if (step === undefined) return;

    event.preventDefault();

    const next = devices[(activeIndex + step + devices.length) % devices.length];

    select(next.id);
    buttons.current.get(next.id)?.focus();
  };

  const toolbar = (
    <div
      data-slot="preview-viewport-toolbar"
      className={cn(
        // Opaque, not translucent: it sits astride the card's top border, and
        // a line showing through the middle of it reads as a mistake.
        "z-10 flex h-9 items-center gap-1 rounded-full border bg-background px-1 shadow-sm",
        slot.toolbarClassName,
      )}
    >
      {/* One provider for the row: once any tooltip is up, moving along the
          buttons swaps them instantly instead of re-waiting the delay. */}
      <TooltipProvider>
        <div
          role="radiogroup"
          aria-label="Preview viewport"
          onKeyDown={onKeyDown}
          className="flex items-center gap-0.5"
        >
          {devices.map((entry) => {
            // The size this button would actually produce, not the device's
            // nominal one: the canvas can be shorter than the device is tall.
            const size = previewFrameGeometry({
              deviceWidth: entry.width,
              deviceHeight: entry.height,
              canvasWidth,
              canvasHeight,
            });

            return (
              <Tooltip key={entry.id}>
                <TooltipTrigger
                  ref={(node: HTMLButtonElement | null) => {
                    if (node) buttons.current.set(entry.id, node);
                    else buttons.current.delete(entry.id);
                  }}
                  role="radio"
                  aria-checked={entry.id === device}
                  // One tab stop for the group; the arrow keys move within it.
                  tabIndex={entry.id === device ? 0 : -1}
                  onClick={() => select(entry.id)}
                  className={cn(
                    previewToolbarButtonClassName,
                    entry.id === device &&
                      "bg-foreground text-background hover:bg-foreground hover:text-background",
                  )}
                >
                  <entry.icon aria-hidden="true" />
                  <span className="sr-only">{entry.label}</span>
                </TooltipTrigger>
                {/* The size lives here rather than on the toolbar: it answers
                    "what would this button give me", which is a question about
                    one button, and a number parked on the toolbar reads as one
                    the reader is meant to be tracking. */}
                <TooltipContent>
                  {entry.label} · {entry.width} × {size.height}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {fullscreenHref ? (
          <>
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link
                    href={previewDeviceHref(fullscreenHref, device, defaultDevice)}
                    aria-label="Open fullscreen demo"
                  />
                }
                className={previewToolbarButtonClassName}
              >
                <Maximize2 aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Open fullscreen demo</TooltipContent>
            </Tooltip>
          </>
        ) : null}

        {/* Demo-owned controls land here — replay is the only one today — so the
            preview carries one row of controls rather than one per owner. */}
        <div ref={setToolbarNode} className="contents" />
      </TooltipProvider>
    </div>
  );

  return (
    <PreviewToolbarProvider node={toolbarNode}>
      {slot.container === undefined
        ? toolbar
        : slot.container
          ? createPortal(toolbar, slot.container)
          : null}

      {/* A surface, not a second frame. Its size never changes, so the ruled
          grid behind the device stays put while the device shrinks across it —
          which is the whole claim the toolbar is making. Fullscreen brings its
          own canvas, so this one only dresses the inline card. */}
      <div
        data-slot="preview-viewport-canvas"
        className={cn(
          "relative w-full overflow-clip",
          presentation === "fullscreen"
            ? "h-full"
            : "h-[min(42rem,76svh)] min-h-[30rem] bg-muted/40 p-4 sm:p-6",
        )}
      >
        {presentation === "inline" ? (
          <div
            aria-hidden="true"
            // Unmasked, unlike the fullscreen canvas: the grid is only ever
            // seen in the gutters beside the frame, and a radial fade puts its
            // transparent edge exactly there.
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px] opacity-60 dark:opacity-30"
          />
        ) : null}

        {/* Measured rather than the canvas itself: the padding above is the
            device's breathing room on the surface, and a frame sized from a
            box that included it would grow until it touched the edges. */}
        <div
          ref={setMeasureRef("canvas")}
          className="relative flex size-full items-center justify-center"
        >
          {/* Two boxes: this one holds the frame's *drawn* size so the canvas
              can centre it, and the one inside stays at the device's own size
              and is scaled down into it. */}
          <div
            data-slot="preview-viewport-frame"
            style={{
              width: Math.round(active.width * scale),
              height: Math.round(height * scale),
            }}
            className={cn("relative shrink-0", motion.frame)}
          >
            <div
              style={{
                width: active.width,
                height,
                transform: `scale(${scale})`,
              }}
              className={cn(
                "absolute left-0 top-0 origin-top-left",
                motion.inner,
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </PreviewToolbarProvider>
  );
}
