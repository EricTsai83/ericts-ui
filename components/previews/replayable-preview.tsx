"use client";

import { RotateCcw } from "lucide-react";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PreviewCornerSlot = {
  /**
   * Position and offset classes for the control. Surrounding chrome that pins
   * its own control to the preview's top-right corner — the fullscreen link on a
   * component page, the navigation toggle in fullscreen — hands over a slot
   * clear of it: below that control at phone widths, where a demo spans the
   * whole canvas and a second control on the same row would sit on top of it,
   * and beside it from `sm` up.
   */
  className: string;
  /**
   * Where the preview toolbar pins itself, for the chrome that renders one.
   * It holds the same corner as `className` — a preview shows one or the
   * other, never both — but it is a row rather than a single button, so the
   * chrome states it separately.
   */
  toolbarClassName: string;
  /**
   * Mount point for the control, when it cannot be positioned where the preview
   * renders it. Fullscreen needs this: the canvas wraps the demo in a
   * transformed element for the swipe entrance, and a transform is the
   * containing block for `absolute` *and* `fixed` descendants, so a control left
   * in place would resolve its offsets against the demo's own box and land on
   * top of it. Passing `null` holds the control back until the node exists;
   * leaving it out keeps the control where the preview renders it.
   */
  container?: HTMLElement | null;
};

const PreviewCornerSlotContext = createContext<PreviewCornerSlot>({
  className: "absolute right-3 top-3",
  toolbarClassName: "absolute right-3 top-3",
});

/**
 * The chrome's preview toolbar, when there is one. A demo-owned control —
 * replay is the only one — joins that row instead of floating in a corner of
 * its own, so a preview carries one strip of controls rather than one per
 * owner. Same convention as `container` above: `undefined` means there is no
 * toolbar, `null` means it has not mounted yet.
 */
const PreviewToolbarContext = createContext<HTMLElement | null | undefined>(
  undefined,
);

/**
 * A control the toolbar hosts rather than one floating on its own: flat,
 * circular, and sized to the toolbar's row, so a portaled control cannot be
 * told apart from the ones the toolbar renders itself.
 */
export const previewToolbarButtonClassName =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5";

export function PreviewCornerSlotProvider({
  className,
  toolbarClassName = className,
  container,
  children,
}: {
  className: string;
  toolbarClassName?: string;
  container?: HTMLElement | null;
  children: ReactNode;
}) {
  const slot = useMemo<PreviewCornerSlot>(
    () => ({ className, toolbarClassName, container }),
    [className, toolbarClassName, container],
  );

  return (
    <PreviewCornerSlotContext.Provider value={slot}>
      {children}
    </PreviewCornerSlotContext.Provider>
  );
}

export function usePreviewCornerSlot() {
  return useContext(PreviewCornerSlotContext);
}

export function PreviewToolbarProvider({
  node,
  children,
}: {
  node: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <PreviewToolbarContext.Provider value={node}>
      {children}
    </PreviewToolbarContext.Provider>
  );
}

export function ReplayablePreview({
  children,
}: {
  children: (replayKey: number) => ReactNode;
}) {
  const [replayKey, setReplayKey] = useState(0);
  const slot = useContext(PreviewCornerSlotContext);
  const toolbar = useContext(PreviewToolbarContext);
  const replay = () => setReplayKey((key) => key + 1);
  let renderedControl: ReactNode;

  if (toolbar !== undefined) {
    // A toolbar is on screen, so the control belongs in it. `null` only means
    // that row has not mounted yet, so hold the control back for that render.
    const control = (
      <button
        type="button"
        aria-label="Replay preview"
        title="Replay preview"
        onClick={replay}
        className={previewToolbarButtonClassName}
      >
        <RotateCcw aria-hidden />
      </button>
    );

    renderedControl = toolbar ? createPortal(control, toolbar) : null;
  } else {
    // No `container` prop at all means "leave the control where the preview
    // renders it". Once a slot opts into a mount point, `null` only means that
    // node has not mounted yet, so hold the control back for that render.
    const control = (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Replay preview"
        title="Replay preview"
        onClick={replay}
        className={cn("z-10 bg-background/80 backdrop-blur-sm", slot.className)}
      >
        <RotateCcw aria-hidden />
      </Button>
    );

    renderedControl =
      slot.container === undefined
        ? control
        : slot.container
          ? createPortal(control, slot.container)
          : null;
  }

  return (
    <>
      {renderedControl}
      {children(replayKey)}
    </>
  );
}
