"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type PreviewPresentation = "inline" | "fullscreen";

type PreviewComponent = ComponentType<{
  variant: string;
  presentation?: PreviewPresentation;
}>;

// Live previews for registry items, keyed by registry name. Each entry is
// lazily loaded so a route only downloads the demos it actually renders —
// the landing page, a component detail page, and a fullscreen /view page
// each need a different slice of this gallery. Items without an entry
// render nothing (the card still shows their metadata).
const previews: Record<string, PreviewComponent> = {
  "smooth-height": dynamic(() => import("@/components/previews/smooth-height")),
  "timer": dynamic(() => import("@/components/previews/timer")),
  "copy-button": dynamic(() => import("@/components/previews/copy-button")),
  "check-mark": dynamic(() => import("@/components/previews/check-mark")),
  "jitter": dynamic(() => import("@/components/previews/jitter")),
  "squeeze": dynamic(() => import("@/components/previews/squeeze")),
  "heartbeat": dynamic(() => import("@/components/previews/heartbeat")),
  "projected-shadow": dynamic(() => import("@/components/previews/projected-shadow")),
  "status-badge": dynamic(() => import("@/components/previews/status-badge")),
  "status-button": dynamic(() => import("@/components/previews/status-button")),
  "expandable-toggle-button": dynamic(() => import("@/components/previews/expandable-toggle-button")),
  "floating-shortcut-button": dynamic(() => import("@/components/previews/floating-shortcut-button")),
  "play-button": dynamic(() => import("@/components/previews/play-button")),
  "floating-select": dynamic(() => import("@/components/previews/floating-select")),
  "adaptive-switch": dynamic(
    () => import("@/components/previews/adaptive-switch"),
  ),
  "expandable-slider": dynamic(() => import("@/components/previews/expandable-slider")),
  "expandable-toolbar": dynamic(() => import("@/components/previews/expandable-toolbar")),
  "otp-input": dynamic(() => import("@/components/previews/otp-input")),
  "highlight-tabs": dynamic(() => import("@/components/previews/highlight-tabs")),
  "sliding-list": dynamic(() => import("@/components/previews/sliding-list")),
  "rail-list": dynamic(() => import("@/components/previews/rail-list")),
  "rail-stage": dynamic(() => import("@/components/previews/rail-stage")),
  "expandable-segmented-tabs": dynamic(() => import("@/components/previews/expandable-segmented-tabs")),
  "expandable-tabs": dynamic(() => import("@/components/previews/expandable-tabs")),
  "expandable-panel": dynamic(() => import("@/components/previews/expandable-panel")),
  "navigation-menu": dynamic(() => import("@/components/previews/navigation-menu")),
  "text-morph": dynamic(() => import("@/components/previews/text-morph")),
  "expandable-dialog": dynamic(() => import("@/components/previews/expandable-dialog")),
  "context-cursor": dynamic(() => import("@/components/previews/context-cursor")),
  "feedback-popover": dynamic(() => import("@/components/previews/feedback-popover")),
  "multi-step": dynamic(() => import("@/components/previews/multi-step")),
  "adaptive-drawer": dynamic(() => import("@/components/previews/adaptive-drawer")),
  "staggered-entrance": dynamic(() => import("@/components/previews/staggered-entrance")),
  "use-reduced-motion": dynamic(() => import("@/components/previews/use-reduced-motion")),
  "use-element-height": dynamic(() => import("@/components/previews/use-element-height")),
  "use-element-size-map": dynamic(() => import("@/components/previews/use-element-size-map")),
  "use-scroll-anchor": dynamic(() => import("@/components/previews/use-scroll-anchor")),
  "use-scroll-progress": dynamic(() => import("@/components/previews/use-scroll-progress")),
  "use-swipe-navigation": dynamic(() => import("@/components/previews/use-swipe-navigation")),
  "use-sequence-player": dynamic(() => import("@/components/previews/use-sequence-player")),
  "scroll-expand": dynamic(() => import("@/components/previews/scroll-expand")),
  "ripple-scene": dynamic(() => import("@/components/previews/ripple-scene")),
  "vertical-scene": dynamic(() => import("@/components/previews/vertical-scene")),
};

export function RegistryPreview({
  name,
  variant = "motion",
  presentation = "inline",
}: {
  name: string;
  variant?: string;
  presentation?: PreviewPresentation;
}) {
  const Preview = previews[name];
  return Preview ? (
    <Preview variant={variant} presentation={presentation} />
  ) : null;
}

export { PreviewCornerSlotProvider } from "@/components/previews/replayable-preview";
