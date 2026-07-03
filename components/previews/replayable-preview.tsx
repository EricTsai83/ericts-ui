"use client";

import { RotateCcw } from "lucide-react";
import { createContext, useContext, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Where a preview's own corner controls (e.g. the replay button) should sit, as
 * Tailwind top/right classes. Surrounding chrome that pins its own control to
 * the preview's top-right corner — the fullscreen link on a component page, the
 * navigation toggle in fullscreen — provides a slot to the left of it so the two
 * sit side by side instead of stacking. Defaults to the corner itself.
 */
const PreviewCornerSlotContext = createContext("right-3 top-3");

export function PreviewCornerSlotProvider({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <PreviewCornerSlotContext.Provider value={className}>
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
  const cornerSlot = useContext(PreviewCornerSlotContext);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Replay preview"
        title="Replay preview"
        onClick={() => setReplayKey((key) => key + 1)}
        className={cn(
          "absolute z-10 bg-background/80 backdrop-blur-sm",
          cornerSlot,
        )}
      >
        <RotateCcw aria-hidden />
      </Button>
      {children(replayKey)}
    </>
  );
}
