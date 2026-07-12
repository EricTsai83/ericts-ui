"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type PreviewComponent = ComponentType<{ variant: string }>;

// Live previews for registry items, keyed by registry name. Each entry is
// lazily loaded so a route only downloads the demos it actually renders —
// the landing page, a component detail page, and a fullscreen /view page
// each need a different slice of this gallery. Items without an entry
// render nothing (the card still shows their metadata).
const previews: Record<string, PreviewComponent> = {
  "smooth-height": dynamic(() => import("@/components/previews/smooth-height")),
  "copy-button": dynamic(() => import("@/components/previews/copy-button")),
  "check-animation": dynamic(() => import("@/components/previews/check-animation")),
  "jitter-animation": dynamic(() => import("@/components/previews/jitter-animation")),
  "squeeze-animation": dynamic(() => import("@/components/previews/squeeze-animation")),
  "heartbeat-animation": dynamic(() => import("@/components/previews/heartbeat-animation")),
  "projected-shadow-animation": dynamic(() => import("@/components/previews/projected-shadow-animation")),
  "status-badge": dynamic(() => import("@/components/previews/status-badge")),
  "status-button": dynamic(() => import("@/components/previews/status-button")),
  "floating-select": dynamic(() => import("@/components/previews/floating-select")),
  "expandable-toolbar": dynamic(() => import("@/components/previews/expandable-toolbar")),
  "otp-input": dynamic(() => import("@/components/previews/otp-input")),
  "highlight-tabs": dynamic(() => import("@/components/previews/highlight-tabs")),
  "expanding-segmented-tabs": dynamic(() => import("@/components/previews/expanding-segmented-tabs")),
  "expandable-tabs": dynamic(() => import("@/components/previews/expandable-tabs")),
  "expanding-button": dynamic(() => import("@/components/previews/expanding-button")),
  "navigation-menu": dynamic(() => import("@/components/previews/navigation-menu")),
  "text-morph": dynamic(() => import("@/components/previews/text-morph")),
  "expandable-modal": dynamic(() => import("@/components/previews/expandable-modal")),
  "context-cursor": dynamic(() => import("@/components/previews/context-cursor")),
  "feedback-popover": dynamic(() => import("@/components/previews/feedback-popover")),
  "multi-step": dynamic(() => import("@/components/previews/multi-step")),
  "adaptive-drawer": dynamic(() => import("@/components/previews/adaptive-drawer")),
  "staggered-entrance": dynamic(() => import("@/components/previews/staggered-entrance")),
  "use-reduced-motion": dynamic(() => import("@/components/previews/use-reduced-motion")),
  "use-element-height": dynamic(() => import("@/components/previews/use-element-height")),
  "use-element-size-map": dynamic(() => import("@/components/previews/use-element-size-map")),
  "use-scroll-anchor": dynamic(() => import("@/components/previews/use-scroll-anchor")),
};

export function RegistryPreview({
  name,
  variant = "motion",
}: {
  name: string;
  variant?: string;
}) {
  const Preview = previews[name];
  return Preview ? <Preview variant={variant} /> : null;
}

export { PreviewCornerSlotProvider } from "@/components/previews/replayable-preview";
