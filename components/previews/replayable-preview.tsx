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
   * The mirror of `className`: the preview's *leading* corner, kept symmetric
   * with whatever the chrome pins to the trailing one. A demo's own controls
   * (a device-size switcher, a variant toggle) belong here rather than over the
   * demo, where they would land on the top-left control of the demo itself.
   */
  leadingClassName: string;
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

/** Where a preview's own control sits when the chrome does not move it. */
const DEFAULT_LEADING_CORNER = "absolute left-3 top-3";

const PreviewCornerSlotContext = createContext<PreviewCornerSlot>({
  className: "absolute right-3 top-3",
  leadingClassName: DEFAULT_LEADING_CORNER,
});

export function PreviewCornerSlotProvider({
  className,
  leadingClassName = DEFAULT_LEADING_CORNER,
  container,
  children,
}: {
  className: string;
  leadingClassName?: string;
  container?: HTMLElement | null;
  children: ReactNode;
}) {
  const slot = useMemo<PreviewCornerSlot>(
    () => ({ className, leadingClassName, container }),
    [className, leadingClassName, container],
  );

  return (
    <PreviewCornerSlotContext.Provider value={slot}>
      {children}
    </PreviewCornerSlotContext.Provider>
  );
}

export function ReplayablePreview({
  children,
}: {
  children: (replayKey: number) => ReactNode;
}) {
  const [replayKey, setReplayKey] = useState(0);
  const slot = useContext(PreviewCornerSlotContext);
  const control = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Replay preview"
      title="Replay preview"
      onClick={() => setReplayKey((key) => key + 1)}
      className={cn("z-10 bg-background/80 backdrop-blur-sm", slot.className)}
    >
      <RotateCcw aria-hidden />
    </Button>
  );
  // No `container` prop at all means "leave the control where the preview
  // renders it". Once a slot opts into a mount point, `null` only means that
  // node has not mounted yet, so hold the control back for that render.
  let renderedControl: ReactNode = control;

  if (slot.container !== undefined) {
    renderedControl = slot.container
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

/**
 * Puts a preview's own control in the leading corner, mirroring the chrome's
 * control in the trailing one — and through the same mount point, since a
 * fullscreen canvas positions its controls against the viewport rather than the
 * demo's box.
 */
export function PreviewLeadingCorner({ children }: { children: ReactNode }) {
  const slot = useContext(PreviewCornerSlotContext);
  const control = (
    <div className={cn("z-10", slot.leadingClassName)}>{children}</div>
  );

  if (slot.container === undefined) {
    return control;
  }

  return slot.container ? createPortal(control, slot.container) : null;
}
