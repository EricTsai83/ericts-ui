"use client";

import type { ReactNode } from "react";

import SmoothHeightPreview from "@/components/previews/smooth-height";
import CopyButtonPreview from "@/components/previews/copy-button";
import CheckAnimationPreview from "@/components/previews/check-animation";
import JitterAnimationPreview from "@/components/previews/jitter-animation";
import SqueezeAnimationPreview from "@/components/previews/squeeze-animation";
import StatusBadgePreview from "@/components/previews/status-badge";
import StatusButtonPreview from "@/components/previews/status-button";
import FloatingSelectPreview from "@/components/previews/floating-select";
import ExpandableToolbarPreview from "@/components/previews/expandable-toolbar";
import OTPInputPreview from "@/components/previews/otp-input";
import HighlightTabsPreview from "@/components/previews/highlight-tabs";
import ExpandableTabsPreview from "@/components/previews/expandable-tabs";
import ExpandingButtonPreview from "@/components/previews/expanding-button";
import NavigationMenuPreview from "@/components/previews/navigation-menu";
import TextMorphPreview from "@/components/previews/text-morph";
import ExpandableModalPreview from "@/components/previews/expandable-modal";
import ContextCursorPreview from "@/components/previews/context-cursor";
import FeedbackPopoverPreview from "@/components/previews/feedback-popover";
import MultiStepPreview from "@/components/previews/multi-step";
import AdaptiveDrawerPreview from "@/components/previews/adaptive-drawer";
import StaggeredEntrancePreview from "@/components/previews/staggered-entrance";
import UseReducedMotionPreview from "@/components/previews/use-reduced-motion";
import UseElementHeightPreview from "@/components/previews/use-element-height";
import UseElementSizeMapPreview from "@/components/previews/use-element-size-map";
import UseScrollAnchorPreview from "@/components/previews/use-scroll-anchor";

// Live previews for registry items, keyed by registry name. Each entry receives
// the active showcase variant so the preview can render the matching source.
// Items without an entry render nothing (the card still shows their metadata).
const previews: Record<string, (variant: string) => ReactNode> = {
  "smooth-height": (variant) => <SmoothHeightPreview variant={variant} />,
  "copy-button": (variant) => <CopyButtonPreview variant={variant} />,
  "check-animation": (variant) => <CheckAnimationPreview variant={variant} />,
  "jitter-animation": (variant) => (
    <JitterAnimationPreview variant={variant} />
  ),
  "squeeze-animation": (variant) => (
    <SqueezeAnimationPreview variant={variant} />
  ),
  "status-badge": (variant) => <StatusBadgePreview variant={variant} />,
  "status-button": (variant) => <StatusButtonPreview variant={variant} />,
  "floating-select": (variant) => <FloatingSelectPreview variant={variant} />,
  "expandable-toolbar": (variant) => (
    <ExpandableToolbarPreview variant={variant} />
  ),
  "otp-input": (variant) => <OTPInputPreview variant={variant} />,
  "highlight-tabs": (variant) => <HighlightTabsPreview variant={variant} />,
  "expandable-tabs": (variant) => (
    <ExpandableTabsPreview variant={variant} />
  ),
  "expanding-button": (variant) => (
    <ExpandingButtonPreview variant={variant} />
  ),
  "navigation-menu": (variant) => <NavigationMenuPreview variant={variant} />,
  "text-morph": (variant) => <TextMorphPreview variant={variant} />,
  "expandable-modal": (variant) => (
    <ExpandableModalPreview variant={variant} />
  ),
  "context-cursor": (variant) => <ContextCursorPreview variant={variant} />,
  "feedback-popover": (variant) => (
    <FeedbackPopoverPreview variant={variant} />
  ),
  "multi-step": (variant) => <MultiStepPreview variant={variant} />,
  "adaptive-drawer": (variant) => <AdaptiveDrawerPreview variant={variant} />,
  "staggered-entrance": (variant) => (
    <StaggeredEntrancePreview variant={variant} />
  ),
  "use-reduced-motion": (variant) => (
    <UseReducedMotionPreview variant={variant} />
  ),
  "use-element-height": (variant) => (
    <UseElementHeightPreview variant={variant} />
  ),
  "use-element-size-map": (variant) => (
    <UseElementSizeMapPreview variant={variant} />
  ),
  "use-scroll-anchor": (variant) => (
    <UseScrollAnchorPreview variant={variant} />
  ),
};

export function RegistryPreview({
  name,
  variant = "motion",
}: {
  name: string;
  variant?: string;
}) {
  return previews[name]?.(variant) ?? null;
}

export function hasRegistryPreview(name: string) {
  return name in previews;
}

export function getRegistryPreviewNames() {
  return Object.keys(previews);
}

export { PreviewCornerSlotProvider } from "@/components/previews/replayable-preview";
